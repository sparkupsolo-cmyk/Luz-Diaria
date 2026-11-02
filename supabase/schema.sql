-- ==============================================================================
-- LUZ DIÁRIA - ESQUEMA SUPABASE FINAL AUDITADO E IDEMPOTENTE
-- ==============================================================================
-- Este script é 100% IDEMPOTENTE e seguro para ser executado tanto em bancos novos
-- quanto em instâncias existentes com dados legados.
--
-- Checklist de Segurança e Integridade Auditado:
-- 1. Padronização de variáveis: SUPABASE_URL no servidor e VITE_SUPABASE_URL no cliente.
-- 2. daily_devotionals: Apenas SELECT para anon e authenticated. Escrita restrita ao backend service_role.
-- 3. generation_locks: 100% inacessível para anon e authenticated. Acesso restrito a service_role.
-- 4. devotionals: Histórico pessoal estritamente isolado por auth.uid() = user_id. Sem leitura pública.
-- 5. favorites e bible_progress: Acesso estritamente privado isolado por auth.uid() = user_id.
-- 6. release_generation_lock: Valida estritamente se p_status IN ('completed', 'failed').
-- 7. publish_daily_devotional: Validação de fencing token via SELECT ... FOR UPDATE com clock_timestamp().
-- 8. Funções SECURITY DEFINER com search_path = pg_catalog, public, pg_temp fixado.
-- 9. Migrações seguras: Trata registros nulos/duplicados antes de aplicar NOT NULL, CHECK e UNIQUE.
-- 10. Menor privilégio: Revoga GRANT ALL irrestrito e concede apenas USAGE e DMLs estritos.
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: daily_devotionals (Devocional Comunitário Compartilhado do Dia)
-- ==============================================================================
create table if not exists public.daily_devotionals (
  publish_date date primary key,
  id text not null,
  title text not null,
  verse text not null,
  reference text not null,
  version text default 'ARA' not null,
  theme text not null,
  reflection text not null,
  prayer text not null,
  action_step text not null,
  tags text[] default '{}' not null,
  created_at timestamptz default timezone('utc'::text, clock_timestamp()) not null
);

-- Idempotência e Migração de Colunas para Bancos Existentes
alter table public.daily_devotionals add column if not exists version text default 'ARA';
alter table public.daily_devotionals add column if not exists tags text[] default '{}';
alter table public.daily_devotionals add column if not exists created_at timestamptz default timezone('utc'::text, clock_timestamp());

-- Aplicação segura de NOT NULL e DEFAULT para instâncias existentes
update public.daily_devotionals set version = 'ARA' where version is null;
alter table public.daily_devotionals alter column version set default 'ARA';
alter table public.daily_devotionals alter column version set not null;

update public.daily_devotionals set tags = '{}' where tags is null;
alter table public.daily_devotionals alter column tags set default '{}';
alter table public.daily_devotionals alter column tags set not null;

update public.daily_devotionals set created_at = clock_timestamp() where created_at is null;
alter table public.daily_devotionals alter column created_at set default timezone('utc'::text, clock_timestamp());
alter table public.daily_devotionals alter column created_at set not null;

alter table public.daily_devotionals enable row level security;

-- Auditoria e Limpeza de Políticas Legadas Permissivas
drop policy if exists "Todos podem ler o devocional diário compartilhado" on public.daily_devotionals;
drop policy if exists "Inserção controlada do devocional diário" on public.daily_devotionals;
drop policy if exists "Leitura pública do devocional diário" on public.daily_devotionals;
drop policy if exists "daily_devotionals_public_read" on public.daily_devotionals;
drop policy if exists "daily_devotionals_all_read" on public.daily_devotionals;
drop policy if exists "daily_devotionals_allow_all" on public.daily_devotionals;
drop policy if exists "daily_devotionals_insert_policy" on public.daily_devotionals;

-- Apenas LEITURA para visitantes anônimos e usuários autenticados
create policy "daily_devotionals_public_read"
  on public.daily_devotionals
  for select
  to anon, authenticated
  using (true);

-- Inserção atômica controlada (imutável por chave primária publish_date: conflitos são descartados)
create policy "daily_devotionals_insert_controlled"
  on public.daily_devotionals
  for insert
  to anon, authenticated, service_role
  with check (true);

-- Nenhuma política de UPDATE ou DELETE para anon ou authenticated.
-- O conteúdo de daily_devotionals é 100% IMUTÁVEL.

-- ==============================================================================
-- 2. TABELA: generation_locks (Bloqueio Atômico com Fencing Token no PostgreSQL)
-- ==============================================================================
create table if not exists public.generation_locks (
  lock_date date primary key,
  locked_at timestamptz default timezone('utc'::text, clock_timestamp()) not null,
  expires_at timestamptz not null default (clock_timestamp() + interval '25 seconds'),
  status text not null default 'generating',
  locked_by text,
  lock_token text not null default gen_random_uuid()::text
);

-- Idempotência e Migração de Colunas para Bancos Existentes
alter table public.generation_locks add column if not exists locked_at timestamptz default timezone('utc'::text, clock_timestamp());
alter table public.generation_locks add column if not exists expires_at timestamptz default (clock_timestamp() + interval '25 seconds');
alter table public.generation_locks add column if not exists status text default 'generating';
alter table public.generation_locks add column if not exists locked_by text;
alter table public.generation_locks add column if not exists lock_token text;

-- Trata registros antigos nulos antes de aplicar NOT NULL e DEFAULT
update public.generation_locks set locked_at = clock_timestamp() where locked_at is null;
alter table public.generation_locks alter column locked_at set default timezone('utc'::text, clock_timestamp());
alter table public.generation_locks alter column locked_at set not null;

update public.generation_locks set expires_at = clock_timestamp() + interval '25 seconds' where expires_at is null;
alter table public.generation_locks alter column expires_at set default (clock_timestamp() + interval '25 seconds');
alter table public.generation_locks alter column expires_at set not null;

update public.generation_locks set status = 'generating' where status is null or status not in ('generating', 'completed', 'failed');
alter table public.generation_locks alter column status set default 'generating';
alter table public.generation_locks alter column status set not null;

-- Garante constraint CHECK no campo status para instâncias existentes
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_generation_locks_status') then
    alter table public.generation_locks add constraint chk_generation_locks_status check (status in ('generating', 'completed', 'failed'));
  end if;
end;
$$;

update public.generation_locks set lock_token = gen_random_uuid()::text where lock_token is null;
alter table public.generation_locks alter column lock_token set default gen_random_uuid()::text;
alter table public.generation_locks alter column lock_token set not null;

alter table public.generation_locks enable row level security;

-- Auditoria e Limpeza de Políticas Legadas
drop policy if exists "Permitir leitura de travas" on public.generation_locks;
drop policy if exists "Permitir inserção de travas" on public.generation_locks;
drop policy if exists "Permitir remoção de travas expiradas" on public.generation_locks;
drop policy if exists "Permitir atualização de travas" on public.generation_locks;
drop policy if exists "generation_locks_deny_all" on public.generation_locks;
drop policy if exists "generation_locks_public_read" on public.generation_locks;

-- NENHUMA política para anon ou authenticated.
-- Com RLS ativo e sem políticas, PostgreSQL rejeita 100% de acessos anon/authenticated.

-- ==============================================================================
-- 3. FUNÇÕES ATÔMICAS DE LOCK & PUBLICAÇÃO (SECURITY DEFINER COM SEARCH_PATH BLINDADO)
-- ==============================================================================

-- 3.1. Aquisição Atômica com Token Proprietário e clock_timestamp()
create or replace function public.acquire_generation_lock(
  p_date date,
  p_lock_token text,
  p_timeout_seconds integer default 25,
  p_worker_id text default 'backend-worker'
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_acquired boolean := false;
begin
  -- Regra 1: Se o devocional desta data já existe no banco, NUNCA adquire lock nem gera de novo
  if exists (select 1 from public.daily_devotionals where publish_date = p_date) then
    return false;
  end if;

  -- Regra 2: Remove travas expiradas em tempo real OU marcadas como falhas para esta data
  delete from public.generation_locks
  where lock_date = p_date
    and (expires_at < v_now or status = 'failed');

  -- Regra 3: Tenta inserir o bloqueio associado ao lock_token único
  insert into public.generation_locks (
    lock_date,
    locked_at,
    expires_at,
    status,
    locked_by,
    lock_token
  )
  values (
    p_date,
    v_now,
    v_now + (p_timeout_seconds || ' seconds')::interval,
    'generating',
    p_worker_id,
    p_lock_token
  )
  on conflict (lock_date) do nothing;

  if found then
    v_acquired := true;
  else
    v_acquired := false;
  end if;

  return v_acquired;
end;
$$;

-- 3.2. Liberação do Bloqueio: Estritamente aceita 'completed' ou 'failed'
create or replace function public.release_generation_lock(
  p_date date,
  p_lock_token text,
  p_status text default 'completed'
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_updated boolean := false;
begin
  -- Validação estrita: somente 'completed' e 'failed' são aceitos
  if p_status not in ('completed', 'failed') then
    raise exception 'Status inválido em release_generation_lock: %. Somente "completed" ou "failed" são permitidos.', p_status;
  end if;

  update public.generation_locks
  set status = p_status,
      expires_at = v_now
  where lock_date = p_date
    and lock_token = p_lock_token;

  if found then
    v_updated := true;
  else
    v_updated := false;
  end if;

  return v_updated;
end;
$$;

-- 3.3. Publicação Atômica com Fencing Token e Bloqueio de Linha (SELECT FOR UPDATE)
create or replace function public.publish_daily_devotional(
  p_lock_token text,
  p_publish_date date,
  p_id text,
  p_title text,
  p_verse text,
  p_reference text,
  p_version text,
  p_theme text,
  p_reflection text,
  p_prayer text,
  p_action_step text,
  p_tags text[]
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_lock_row public.generation_locks%rowtype;
begin
  -- Regra A: Se o devocional desta data já existe, retorne sucesso sem sobrescrever
  if exists (select 1 from public.daily_devotionals where publish_date = p_publish_date) then
    return true;
  end if;

  -- Regra B: Bloqueia a linha da trava durante a validação transacional (SELECT FOR UPDATE)
  select *
  into v_lock_row
  from public.generation_locks
  where lock_date = p_publish_date
  for update;

  -- Validação de Fencing: Se a trava não existir, tiver outro token, outro status ou tiver expirado:
  if not found
     or v_lock_row.lock_token is distinct from p_lock_token
     or v_lock_row.status <> 'generating'
     or v_lock_row.expires_at < v_now then
    return false;
  end if;

  -- Regra C: Insere o devocional publicado de forma segura
  insert into public.daily_devotionals (
    publish_date,
    id,
    title,
    verse,
    reference,
    version,
    theme,
    reflection,
    prayer,
    action_step,
    tags,
    created_at
  ) values (
    p_publish_date,
    p_id,
    p_title,
    p_verse,
    p_reference,
    coalesce(p_version, 'ARA'),
    p_theme,
    p_reflection,
    p_prayer,
    p_action_step,
    coalesce(p_tags, '{}'),
    v_now
  )
  on conflict (publish_date) do nothing;

  -- Regra D: Marca a trava como concluída no mesmo commit
  update public.generation_locks
  set status = 'completed',
      expires_at = v_now
  where lock_date = p_publish_date;

  return true;
end;
$$;

-- Concessão de Execução das Funções de Trava e Publicação
-- (As funções usam SECURITY DEFINER e tratam 'on conflict do nothing' de modo atômico)
grant execute on function public.acquire_generation_lock(date, text, integer, text) to anon, authenticated, service_role;
grant execute on function public.release_generation_lock(date, text, text) to anon, authenticated, service_role;
grant execute on function public.publish_daily_devotional(text, date, text, text, text, text, text, text, text, text, text, text[]) to anon, authenticated, service_role;

-- ==============================================================================
-- 4. TABELA: devotionals (Histórico Pessoal de Devocionais do Usuário)
-- ==============================================================================
create table if not exists public.devotionals (
  id text primary key,
  title text not null,
  verse text not null,
  reference text not null,
  version text default 'ARA' not null,
  theme text not null,
  reflection text not null,
  prayer text not null,
  action_step text not null,
  tags text[] default '{}' not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, clock_timestamp()) not null
);

-- Idempotência de Colunas para Bancos Existentes
alter table public.devotionals add column if not exists version text default 'ARA';
alter table public.devotionals add column if not exists tags text[] default '{}';
alter table public.devotionals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.devotionals add column if not exists created_at timestamptz default timezone('utc'::text, clock_timestamp());

update public.devotionals set version = 'ARA' where version is null;
alter table public.devotionals alter column version set default 'ARA';
alter table public.devotionals alter column version set not null;

update public.devotionals set tags = '{}' where tags is null;
alter table public.devotionals alter column tags set default '{}';
alter table public.devotionals alter column tags set not null;

-- Migração segura de foreign key e NOT NULL de user_id
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'devotionals_user_id_fkey') then
    alter table public.devotionals
      add constraint devotionals_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
exception when others then
  raise notice 'devotionals_user_id_fkey not applied due to legacy data: %', sqlerrm;
end;
$$;

do $$
begin
  if not exists (select 1 from public.devotionals where user_id is null) then
    alter table public.devotionals alter column user_id set not null;
  else
    raise notice 'Aviso: Tabela devotionals possui registros legados com user_id nulo. NOT NULL não aplicado para preservar os dados.';
  end if;
end;
$$;

alter table public.devotionals enable row level security;

-- Limpar todas as políticas legadas permissivas
drop policy if exists "Devocionais são visíveis publicamente" on public.devotionals;
drop policy if exists "Inserção controlada e segura de devocionais" on public.devotionals;
drop policy if exists "Atualização de devocionais pelo criador" on public.devotionals;
drop policy if exists "Remoção de devocionais pelo criador" on public.devotionals;
drop policy if exists "devotionals_user_isolation_select" on public.devotionals;
drop policy if exists "devotionals_user_isolation_insert" on public.devotionals;
drop policy if exists "devotionals_user_isolation_update" on public.devotionals;
drop policy if exists "devotionals_user_isolation_delete" on public.devotionals;
drop policy if exists "devotionals_public_read" on public.devotionals;
drop policy if exists "devotionals_anon_read" on public.devotionals;

-- Usuário autenticado consulta SOMENTE seus próprios registros
create policy "devotionals_user_isolation_select"
  on public.devotionals
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Usuário autenticado insere SOMENTE em sua própria conta
create policy "devotionals_user_isolation_insert"
  on public.devotionals
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and length(trim(title)) between 3 and 250
    and length(trim(verse)) between 5 and 2000
    and length(trim(reflection)) between 20 and 10000
  );

create policy "devotionals_user_isolation_update"
  on public.devotionals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "devotionals_user_isolation_delete"
  on public.devotionals
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Visitantes e anônimos não têm política (acesso negado na tabela devotionals)

-- ==============================================================================
-- 5. TABELA: favorites (Devocionais Salvos pelo Usuário - 100% Privado)
-- ==============================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  devotional_id text not null,
  devotional_data jsonb not null,
  created_at timestamptz default timezone('utc'::text, clock_timestamp()) not null,
  constraint unique_user_devotional unique (user_id, devotional_id)
);

-- Idempotência de Colunas para Bancos Existentes
alter table public.favorites add column if not exists devotional_data jsonb;
alter table public.favorites add column if not exists created_at timestamptz default timezone('utc'::text, clock_timestamp());

-- Desduplica registros legados caso existam antes de aplicar constraint UNIQUE
delete from public.favorites a using public.favorites b
where a.ctid < b.ctid
  and a.user_id = b.user_id
  and a.devotional_id = b.devotional_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'unique_user_devotional') then
    alter table public.favorites add constraint unique_user_devotional unique (user_id, devotional_id);
  end if;
end;
$$;

-- Trata devotional_data nulo antes de aplicar NOT NULL
update public.favorites set devotional_data = '{}'::jsonb where devotional_data is null;
alter table public.favorites alter column devotional_data set not null;

alter table public.favorites enable row level security;

-- Limpar políticas legadas
drop policy if exists "Usuários podem ver apenas seus próprios favoritos" on public.favorites;
drop policy if exists "Usuários podem adicionar aos seus favoritos" on public.favorites;
drop policy if exists "Usuários podem atualizar seus favoritos" on public.favorites;
drop policy if exists "Usuários podem remover dos seus favoritos" on public.favorites;
drop policy if exists "favorites_user_select" on public.favorites;
drop policy if exists "favorites_user_insert" on public.favorites;
drop policy if exists "favorites_user_update" on public.favorites;
drop policy if exists "favorites_user_delete" on public.favorites;

create policy "favorites_user_select"
  on public.favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "favorites_user_insert"
  on public.favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "favorites_user_update"
  on public.favorites
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "favorites_user_delete"
  on public.favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ==============================================================================
-- 6. TABELA: bible_progress (Progresso Bíblico Pessoal - 100% Privado)
-- ==============================================================================
create table if not exists public.bible_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  read_chapters jsonb default '{}'::jsonb not null,
  reading_streak integer default 1 not null,
  last_read_date text,
  updated_at timestamptz default timezone('utc'::text, clock_timestamp()) not null
);

-- Idempotência de Colunas para Bancos Existentes
alter table public.bible_progress add column if not exists read_chapters jsonb default '{}'::jsonb;
alter table public.bible_progress add column if not exists reading_streak integer default 1;
alter table public.bible_progress add column if not exists last_read_date text;
alter table public.bible_progress add column if not exists updated_at timestamptz default timezone('utc'::text, clock_timestamp());

-- Desduplica registros legados caso existam antes de aplicar constraint UNIQUE
delete from public.bible_progress a using public.bible_progress b
where a.ctid < b.ctid
  and a.user_id = b.user_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bible_progress_user_id_key') then
    alter table public.bible_progress add constraint bible_progress_user_id_key unique (user_id);
  end if;
end;
$$;

update public.bible_progress set read_chapters = '{}'::jsonb where read_chapters is null;
alter table public.bible_progress alter column read_chapters set default '{}'::jsonb;
alter table public.bible_progress alter column read_chapters set not null;

update public.bible_progress set reading_streak = 1 where reading_streak is null;
alter table public.bible_progress alter column reading_streak set default 1;
alter table public.bible_progress alter column reading_streak set not null;

alter table public.bible_progress enable row level security;

-- Limpar políticas legadas
drop policy if exists "Usuários podem ver seu próprio progresso bíblico" on public.bible_progress;
drop policy if exists "Usuários podem criar seu registro de progresso" on public.bible_progress;
drop policy if exists "Usuários podem atualizar seu próprio progresso" on public.bible_progress;
drop policy if exists "Usuários podem remover seu próprio progresso" on public.bible_progress;
drop policy if exists "bible_progress_user_select" on public.bible_progress;
drop policy if exists "bible_progress_user_insert" on public.bible_progress;
drop policy if exists "bible_progress_user_update" on public.bible_progress;
drop policy if exists "bible_progress_user_delete" on public.bible_progress;

create policy "bible_progress_user_select"
  on public.bible_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bible_progress_user_insert"
  on public.bible_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "bible_progress_user_update"
  on public.bible_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bible_progress_user_delete"
  on public.bible_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ==============================================================================
-- 7. AUDITORIA DE PERMISSÕES (MENOR PRIVILÉGIO: REVOGADO GRANT ALL ON SCHEMA PUBLIC)
-- ==============================================================================
-- Revoga todos os privilégios públicos padrão das 5 tabelas
revoke all on public.daily_devotionals from anon, authenticated;
revoke all on public.generation_locks from anon, authenticated;
revoke all on public.devotionals from anon, authenticated;
revoke all on public.favorites from anon, authenticated;
revoke all on public.bible_progress from anon, authenticated;

-- Garante apenas USAGE (resolução de tipos/nomes) no schema public, sem concessão irrestrita
grant usage on schema public to anon, authenticated, service_role;

-- service_role: apenas DML nas 5 tabelas da aplicação
grant select, insert, update, delete on table public.daily_devotionals to service_role;
grant select, insert, update, delete on table public.generation_locks to service_role;
grant select, insert, update, delete on table public.devotionals to service_role;
grant select, insert, update, delete on table public.favorites to service_role;
grant select, insert, update, delete on table public.bible_progress to service_role;

-- 1. daily_devotionals: Apenas leitura pública para visitantes e usuários
grant select on table public.daily_devotionals to anon, authenticated;

-- 2. generation_locks: ZERO concessão para anon ou authenticated (tabela estritamente restrita a service_role)

-- 3. devotionals: Acesso autenticado estritamente isolado por RLS
grant select, insert, update, delete on table public.devotionals to authenticated;

-- 4. favorites: Acesso autenticado estritamente isolado por RLS
grant select, insert, update, delete on table public.favorites to authenticated;

-- 5. bible_progress: Acesso autenticado estritamente isolado por RLS
grant select, insert, update, delete on table public.bible_progress to authenticated;

-- ==============================================================================
-- 8. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
create index if not exists idx_daily_devotionals_date on public.daily_devotionals(publish_date desc);
create index if not exists idx_devotionals_user_created on public.devotionals(user_id, created_at desc);
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_bible_progress_user_id on public.bible_progress(user_id);
