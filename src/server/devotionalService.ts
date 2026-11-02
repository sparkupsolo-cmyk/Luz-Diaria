import { GoogleGenAI, Type } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { CURATED_DEVOTIONALS } from '../data/curatedDevotionals.js';
import type { Devotional } from '../types/index.js';

/**
 * Returns current date string formatted as YYYY-MM-DD in America/Sao_Paulo timezone.
 * Guaranteeing that all daily checks, locks, and cron schedules strictly align with
 * midnight in Brasília (UTC-3).
 */
export function getSaoPauloDate(): string {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/**
 * In-flight promise deduplication to prevent concurrent generations
 * when multiple requests hit the server simultaneously.
 */
let inFlightDailyPromise: Promise<{ devotional: Devotional; source: string; publishDate: string }> | null = null;

interface CachedDailyResult {
  devotional: Devotional;
  source: string;
  publishDate: string;
}

/**
 * Server in-memory daily cache. Once determined for a given day (whether from Supabase,
 * Gemini, or deterministic fallback), it is cached in RAM to prevent repeated external
 * calls and ensure 100% content consistency for all incoming requests.
 */
let memoryDailyCache: {
  publishDate: string;
  result: CachedDailyResult;
} | null = null;

/**
 * Registra auditoria segura sobre a chave administrativa SUPABASE_SERVICE_ROLE_KEY.
 * Exibe apenas presença, formato estrutural detectado e tamanho da chave.
 * NUNCA imprime nem expõe caracteres do segredo.
 */
function logServiceRoleKeySecurityAudit(isValid: boolean): void {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isPresent = Boolean(rawKey && rawKey.trim().length > 0);

  if (!isPresent) {
    console.error(
      '[DevotionalService] [SEGURANÇA] SUPABASE_SERVICE_ROLE_KEY ausente no ambiente. Operações administrativas abortadas. Nenhuma tentativa de escrita será feita com chave pública.'
    );
    return;
  }

  const trimmed = rawKey!.trim();
  let detectedFormat = 'formato_desconhecido';

  if (trimmed.startsWith('sb_secret_')) {
    detectedFormat = 'supabase_secret (sb_secret_...)';
  } else if (trimmed.startsWith('ey') && trimmed.split('.').length === 3) {
    detectedFormat = 'jwt_service_role (ey...)';
  } else if (trimmed.startsWith('sb_publishable_') || trimmed.startsWith('sbp_')) {
    detectedFormat = 'invalido_chave_publica_detectada';
  } else if (trimmed.includes('your-supabase') || trimmed.includes('[COLE')) {
    detectedFormat = 'invalido_placeholder';
  }

  if (!isValid) {
    console.error(
      `[DevotionalService] [SEGURANÇA] SUPABASE_SERVICE_ROLE_KEY inválida para operações administrativas: presente=true, formato=${detectedFormat}, comprimento=${trimmed.length}. Gravação no Supabase bloqueada.`
    );
  } else {
    console.log(
      `[DevotionalService] [SEGURANÇA] SUPABASE_SERVICE_ROLE_KEY validada com sucesso: presente=true, formato=${detectedFormat}, comprimento=${trimmed.length}. Cliente administrativo inicializado.`
    );
  }
}

/**
 * Valida se a chave SUPABASE_SERVICE_ROLE_KEY está configurada
 * com formato adequado para operações administrativas (service_role) no Supabase.
 */
export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || typeof key !== 'string') {
    return false;
  }

  const trimmed = key.trim();
  const isPlaceholder = trimmed.includes('your-supabase') || trimmed.includes('[COLE');
  const isPublishable = trimmed.startsWith('sb_publishable_') || trimmed.startsWith('sbp_');
  const isLongEnough = trimmed.length > 20;

  return !isPlaceholder && !isPublishable && isLongEnough;
}

/**
 * Inicializa o cliente Supabase para operações administrativas no servidor.
 * 
 * REGRAS MANDATÓRIAS:
 * 1. Utiliza EXCLUSIVAMENTE process.env.SUPABASE_SERVICE_ROLE_KEY.
 * 2. Sem fallbacks para VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY.
 * 3. Se SUPABASE_SERVICE_ROLE_KEY estiver ausente ou inválida, interrompe e registra erro explícito,
 *    retornando null sem jamais tentar operações de escrita com chave pública.
 * 4. Valida a configuração através de hasServiceRoleKey().
 * 5. Emite logs seguros indicando apenas se a variável está presente e seu formato esperado,
 *    nunca expondo o valor da chave.
 */
export function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  if (!url || url.includes('your-project-id') || url.includes('[COLE')) {
    console.error('[DevotionalService] SUPABASE_URL não configurada ou com placeholder inválido.');
    return null;
  }

  const isValid = hasServiceRoleKey();
  logServiceRoleKeySecurityAudit(isValid);

  if (!isValid) {
    console.error(
      '[DevotionalService] Operação administrativa cancelada: SUPABASE_SERVICE_ROLE_KEY necessária para gravação e gestão de concorrência não está disponível.'
    );
    return null;
  }

  // Utiliza exclusivamente a chave service_role administrativa (sem fallback para chaves públicas)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Helper to fetch a daily devotional from Supabase cache
 */
export async function fetchDailyFromSupabase(supabase: SupabaseClient, publishDate: string): Promise<Devotional | null> {
  try {
    const { data, error } = await supabase
      .from('daily_devotionals')
      .select('*')
      .eq('publish_date', publishDate)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        verse: data.verse,
        reference: data.reference,
        version: data.version || 'ARA',
        theme: data.theme,
        reflection: data.reflection,
        prayer: data.prayer,
        actionStep: data.action_step,
        tags: data.tags || [],
        date: new Date(`${publishDate}T12:00:00Z`).toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      };
    }
  } catch (e) {
    console.warn('[DevotionalService] Error reading from daily_devotionals cache:', e);
  }
  return null;
}

/**
 * Atomically acquire generation lock in PostgreSQL using a unique lockToken.
 * Returns true only if lock was successfully acquired for this token via RPC,
 * or if no devotional exists yet for this date when RPC is absent.
 */
async function acquireAtomicLock(
  supabase: SupabaseClient,
  publishDate: string,
  lockToken: string,
  workerId: string,
  timeoutSeconds: number = 25
): Promise<boolean> {
  // Regra fundamental: Se já existir devocional para esta data no Supabase,
  // JAMAIS adquire lock para gerar outro!
  try {
    const existing = await fetchDailyFromSupabase(supabase, publishDate);
    if (existing) {
      return false;
    }
  } catch {
    // continue
  }

  try {
    const { data, error } = await supabase.rpc('acquire_generation_lock', {
      p_date: publishDate,
      p_lock_token: lockToken,
      p_timeout_seconds: timeoutSeconds,
      p_worker_id: workerId
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (rpcErr) {
    console.warn('[DevotionalService] RPC acquire_generation_lock call failed (using direct check fallback):', rpcErr);
  }

  // Graceful fallback if RPC function is not installed or permissions restricted:
  // Check if today's record already exists. If yes, lock is refused (avoid duplicate).
  try {
    const existing = await fetchDailyFromSupabase(supabase, publishDate);
    return !existing;
  } catch {
    return true;
  }
}

/**
 * Release lock in PostgreSQL only if lockToken matches the current owner.
 * Strictly accepts status 'completed' | 'failed'.
 */
async function releaseAtomicLock(
  supabase: SupabaseClient,
  publishDate: string,
  lockToken: string,
  status: 'completed' | 'failed'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('release_generation_lock', {
      p_date: publishDate,
      p_lock_token: lockToken,
      p_status: status
    });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (err) {
    // Silent fallback
  }

  return false;
}

/**
 * Atomically publish devotional with fencing token verification or direct insert.
 * Ensures data is persisted into 'daily_devotionals' table with unique publish_date constraint.
 * Em hipótese alguma sobrescreve um registro existente (imutabilidade total de 24h).
 */
async function publishAtomicDevotional(
  supabase: SupabaseClient,
  lockToken: string,
  publishDate: string,
  devotional: Devotional
): Promise<boolean> {
  // 1. Tenta procedure atômica publish_daily_devotional (SECURITY DEFINER com fencing token)
  try {
    const { data, error } = await supabase.rpc('publish_daily_devotional', {
      p_lock_token: lockToken,
      p_publish_date: publishDate,
      p_id: devotional.id,
      p_title: devotional.title,
      p_verse: devotional.verse,
      p_reference: devotional.reference,
      p_version: devotional.version || 'ARA',
      p_theme: devotional.theme,
      p_reflection: devotional.reflection,
      p_prayer: devotional.prayer,
      p_action_step: devotional.actionStep,
      p_tags: devotional.tags || []
    });

    if (!error && typeof data === 'boolean' && data) {
      console.log(`[DevotionalService] Devocional publicado com sucesso via RPC para ${publishDate}.`);
      return true;
    }
  } catch (rpcErr) {
    // Continue to direct insert fallback
  }

  // 2. Direct INSERT seguro (sem update / onConflict do nothing para imutabilidade)
  try {
    const { error: insertErr } = await supabase
      .from('daily_devotionals')
      .insert({
        id: devotional.id,
        publish_date: publishDate,
        title: devotional.title,
        verse: devotional.verse,
        reference: devotional.reference,
        version: devotional.version || 'ARA',
        theme: devotional.theme,
        reflection: devotional.reflection,
        prayer: devotional.prayer,
        action_step: devotional.actionStep,
        tags: devotional.tags || []
      });

    if (!insertErr) {
      console.log(`[DevotionalService] Devocional salvo com sucesso no Supabase para ${publishDate}.`);
      return true;
    }

    // Se o erro foi de chave duplicada (código 23505), outro worker acabou de gravar: isso é um sucesso!
    if (insertErr.code === '23505' || insertErr.message?.includes('duplicate key') || insertErr.message?.includes('violates unique constraint')) {
      console.log(`[DevotionalService] Registro já gravado no Supabase para ${publishDate}.`);
      return true;
    }

    console.error('[DevotionalService] Erro ao inserir em daily_devotionals no Supabase:', {
      code: insertErr.code,
      message: insertErr.message,
      details: insertErr.details,
      hint: insertErr.hint
    });
  } catch (directErr) {
    console.error('[DevotionalService] Exceção na inserção direta em daily_devotionals:', directErr);
  }

  return false;
}

/**
 * Initialize Gemini SDK
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Call Gemini to generate a convicting, Christ-centered daily devotional.
 * Uses a resilient model fallback cascade:
 * 1. Primary: 'gemini-3.8-flash'
 * 2. Secondary (if high demand / 503): 'gemini-3.1-flash-lite'
 * Enforces an internal timeout to guarantee timely execution in serverless runtimes.
 */
export async function generateDevotionalWithGemini(theme?: string): Promise<Devotional> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Chave da API Gemini não configurada no servidor');
  }

  const promptContext = `
Crie o devocional cristão oficial do dia em português brasileiro.
O texto deve ser PROFUNDO, SÓBRIO, BÍBLICO E TEOCÊNTRICO.
DIRETRIZ INEGOCIÁVEL: NÃO use clichês de autoajuda nem massageie o ego humano. Confronte o orgulho, a autossuficiência e a hipocrisia religiosa. Aponte para a soberania de Deus, a necessidade de tomar a cruz e a graça verdadeira em Cristo.
${theme ? `Tema sugerido para a reflexão: "${theme}".` : 'Tema: O senhorio de Cristo, a renúncia do ego ou santidade nas decisões cotidianas.'}

Requisitos essenciais:
1. "title": Título penetrante e sóbrio (curto e sem chavões).
2. "verse": Texto exato de um versículo bíblico clássico e cirúrgico.
3. "reference": Referência bíblica exata (Livro, capítulo e versículo).
4. "version": Versão (ex: "ARA", "NVI" ou "ARC").
5. "theme": Nome do tema em 2 a 4 palavras.
6. "reflection": Reflexão contundente e teologicamente rica de 2 a 3 parágrafos.
7. "prayer": Oração sincera de quebrantamento, humildade e dependência do Senhor.
8. "actionStep": Uma atitude prática de obediência e renúncia do eu para hoje.
9. "tags": Lista de 3 a 5 palavras-chave (ex: Cruz, Quebrantamento, Renúncia, Santidade).
`;

  const generateWithModel = async (modelName: string): Promise<Devotional> => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptContext,
      config: {
        systemInstruction: 'Você é um pregador bíblico sóbrio, profundo e sem rodeios humanos. Você jamais massageia o ego humano. Você prega a soberania de Deus, a cruz de Cristo, a santidade e a morte do eu.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            verse: { type: Type.STRING },
            reference: { type: Type.STRING },
            version: { type: Type.STRING },
            theme: { type: Type.STRING },
            reflection: { type: Type.STRING },
            prayer: { type: Type.STRING },
            actionStep: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['title', 'verse', 'reference', 'version', 'theme', 'reflection', 'prayer', 'actionStep']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error(`Resposta vazia da API Gemini com modelo ${modelName}`);

    const parsed = JSON.parse(text);
    return {
      id: `dev-daily-${Date.now()}`,
      ...parsed,
      date: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' })
    };
  };

  const timeoutMs = 9500;
  let timerId: any;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Timeout na chamada da API Gemini (${timeoutMs}ms excedidos)`));
    }, timeoutMs);
  });

  const apiCallPromise = (async () => {
    try {
      return await generateWithModel('gemini-3.8-flash');
    } catch (primaryErr: any) {
      const errStr = primaryErr?.message || String(primaryErr);
      const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota');
      if (isQuota) {
        console.warn('[DevotionalService] gemini-3.8-flash cota gratuita atingida (429), tentando gemini-3.1-flash-lite...');
      } else {
        console.warn('[DevotionalService] gemini-3.8-flash indisponível, tentando gemini-3.1-flash-lite:', errStr);
      }
      return await generateWithModel('gemini-3.1-flash-lite');
    }
  })();

  try {
    return await Promise.race([apiCallPromise, timeoutPromise]);
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Fallback determinístico ancorado no calendário para a data específica (America/Sao_Paulo).
 * Garante que mesmo em caso de falha de IA ou ausência temporária de banco,
 * todas as instâncias e dispositivos gerem rigorosamente o mesmo devocional oficial daquela data,
 * sem jamais reciclar versículos de ontem ou mudar após 5 minutos.
 */
export function getDeterministicDailyDevotional(publishDate: string): Devotional {
  const parts = publishDate.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  
  // Índice único sequencial baseado no dia do ano
  const baseTime = Date.UTC(year, month - 1, day);
  const epochTime = Date.UTC(2026, 0, 1);
  const dayIndex = Math.floor((baseTime - epochTime) / (1000 * 60 * 60 * 24));
  
  const poolIndex = Math.abs(dayIndex) % CURATED_DEVOTIONALS.length;
  const curated = CURATED_DEVOTIONALS[poolIndex] || CURATED_DEVOTIONALS[0];

  return {
    ...curated,
    id: `dev-daily-${publishDate}`,
    date: new Date(`${publishDate}T12:00:00Z`).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };
}

/**
 * Método central de execução para obter ou gerar o devocional diário compartilhado.
 * Regras estritas:
 * 1. O Supabase é a ÚNICA fonte oficial da verdade.
 * 2. Se já existir devocional para a data de hoje (Brasília), RETORNA ESSE REGISTRO EXATO imediatamente.
 * 3. Nunca sobrescreve nem altera um devocional já publicado naquele dia.
 * 4. Bloqueia concorrência entre instâncias da Vercel via travas no banco e deduplicação de promessas.
 */
async function executeGetOrGenerateDailySharedDevotional(): Promise<{ devotional: Devotional; source: string; publishDate: string }> {
  const publishDate = getSaoPauloDate();

  const supabase = getServerSupabaseClient();

  // 1. REGRA MANDATÓRIA: Consultar o Supabase antes de qualquer geração ou chamada de IA.
  // Se já existir registro para a data de hoje em Brasília, retorna EXATAMENTE esse devocional oficial.
  if (supabase) {
    const existing = await fetchDailyFromSupabase(supabase, publishDate);
    if (existing) {
      const res = {
        devotional: existing,
        source: 'supabase_official',
        publishDate
      };
      memoryDailyCache = { publishDate, result: res };
      return res;
    }
  }

  // Se já calculado nesta instância de processo para a mesma data
  if (memoryDailyCache && memoryDailyCache.publishDate === publishDate) {
    return memoryDailyCache.result;
  }

  const workerId = `worker-${Math.random().toString(36).substring(2, 9)}`;
  const lockToken = crypto.randomUUID();

  // 2. Não encontrado no Supabase: Tenta obter a trava atômica no PostgreSQL
  let hasLock = false;
  if (supabase) {
    hasLock = await acquireAtomicLock(supabase, publishDate, lockToken, workerId, 30);
  } else {
    hasLock = true;
  }

  // 3. Proteção contra concorrência entre múltiplas instâncias da Vercel:
  // Se outro processo obteve a trava, aguarda até que ele publique e consulta o banco a cada 500ms
  if (!hasLock && supabase) {
    console.log(`[DevotionalService] Worker ${workerId}: Bloqueio detido por outro processo para ${publishDate}. Aguardando publicação oficial...`);
    const maxWaitMs = 8000;
    const intervalMs = 500;
    const startWait = Date.now();

    while (Date.now() - startWait < maxWaitMs) {
      await new Promise(r => setTimeout(r, intervalMs));
      const newlyPublished = await fetchDailyFromSupabase(supabase, publishDate);
      if (newlyPublished) {
        const res = {
          devotional: newlyPublished,
          source: 'supabase_official_after_lock_wait',
          publishDate
        };
        memoryDailyCache = { publishDate, result: res };
        return res;
      }
    }

    // Checagem de segurança após a espera
    const fallbackCheck = await fetchDailyFromSupabase(supabase, publishDate);
    if (fallbackCheck) {
      const res = {
        devotional: fallbackCheck,
        source: 'supabase_official',
        publishDate
      };
      memoryDailyCache = { publishDate, result: res };
      return res;
    }
  }

  // 4. Detém a trava ou banco não inicializado: Gera o devocional oficial
  let candidateDevotional: Devotional | null = null;
  let generationSource = 'gemini_generated';

  if (hasLock) {
    try {
      console.log(`[DevotionalService] Worker ${workerId} gerando devocional oficial para ${publishDate} (America/Sao_Paulo)...`);
      candidateDevotional = await generateDevotionalWithGemini();
    } catch (geminiError: any) {
      const isQuota = String(geminiError?.message || geminiError).includes('429');
      if (isQuota) {
        console.warn(`[DevotionalService] Limite de cota Gemini atingido para hoje (${publishDate}). Ativando devocional oficial determinístico.`);
      } else {
        console.warn('[DevotionalService] Chamada Gemini indisponível:', geminiError?.message || geminiError);
      }
      generationSource = 'deterministic_daily_fallback';
    }
  }

  // Se Gemini falhou, aplica o devocional determinístico do dia
  if (!candidateDevotional) {
    candidateDevotional = getDeterministicDailyDevotional(publishDate);
    generationSource = 'deterministic_daily_fallback';
  }

  // 5. Persiste atômica e imutavelmente no Supabase
  if (supabase && candidateDevotional) {
    const published = await publishAtomicDevotional(supabase, lockToken, publishDate, candidateDevotional);
    await releaseAtomicLock(supabase, publishDate, lockToken, published ? 'completed' : 'failed');

    // Consulta imediatamente o banco para garantir que todas as instâncias leiam o registro oficial gravado
    const persisted = await fetchDailyFromSupabase(supabase, publishDate);
    if (persisted) {
      const res = {
        devotional: persisted,
        source: 'supabase_official_published',
        publishDate
      };
      memoryDailyCache = { publishDate, result: res };
      return res;
    }

    console.error(
      `[DevotionalService] FALHA DE PERSISTÊNCIA: O devocional para ${publishDate} não pôde ser gravado ou confirmado no Supabase.`
    );
  }

  // 6. Retorno de fallback (quando o Supabase não estiver configurado com service_role ou a persistência falhou)
  // Regra 7: NUNCA apresenta fallback em memória como se tivesse sido publicado com sucesso no banco.
  const fallbackSource = !supabase
    ? 'memory_fallback_unpersisted_no_service_key'
    : 'memory_fallback_unpersisted_write_failed';

  console.warn(
    `[DevotionalService] Retornando fallback em memória (${fallbackSource}) para ${publishDate}. Registro NÃO persistido no Supabase.`
  );

  const finalResult = {
    devotional: candidateDevotional,
    source: fallbackSource,
    publishDate
  };
  memoryDailyCache = { publishDate, result: finalResult };
  return finalResult;
}

/**
 * Método Centralizado: Obter ou Gerar o Devocional Diário Compartilhado
 * Protegido contra concorrência por deduplicação de promessas e trava atômica no banco.
 */
export async function getOrGenerateDailySharedDevotional(): Promise<{ devotional: Devotional; source: string; publishDate: string }> {
  if (inFlightDailyPromise) {
    console.log('[DevotionalService] Promessa de devocional diário já em andamento. Reutilizando para o solicitante...');
    return inFlightDailyPromise;
  }

  inFlightDailyPromise = executeGetOrGenerateDailySharedDevotional().finally(() => {
    inFlightDailyPromise = null;
  });

  return inFlightDailyPromise;
}
