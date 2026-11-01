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
 * Checks whether the server environment has administrative SUPABASE_SERVICE_ROLE_KEY.
 * The service_role key is required to invoke administrative lock functions and write to daily_devotionals.
 * If only the public anon key is provided, the server operates in safe read-only mode for Supabase,
 * relying on memory-level deduplication to prevent permission denied errors.
 */
function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    key && 
    !key.includes('your-supabase') && 
    !key.includes('[COLE') && 
    !key.startsWith('sb_publishable_') &&
    key.length > 20
  );
}

/**
 * Initialize Supabase Client for server-side usage.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY to perform administrative atomic locks and writes.
 * The service role key is NEVER exposed to the frontend/browser.
 */
function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key || url.includes('your-project-id') || url.includes('[COLE') || key.includes('your-supabase') || key.includes('[COLE')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Helper to fetch a daily devotional from Supabase cache
 */
async function fetchDailyFromSupabase(supabase: SupabaseClient, publishDate: string): Promise<Devotional | null> {
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
  // If the server only has the public anon key, do not invoke administrative RPC functions
  if (!hasServiceRoleKey()) {
    try {
      const existing = await fetchDailyFromSupabase(supabase, publishDate);
      return !existing;
    } catch {
      return true;
    }
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
    console.warn('[DevotionalService] RPC acquire_generation_lock call failed:', rpcErr);
  }

  // Graceful fallback if RPC function is not installed:
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
  if (!hasServiceRoleKey()) {
    return true;
  }

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
    console.warn('[DevotionalService] RPC release_generation_lock call failed:', err);
  }

  return false;
}

/**
 * Atomically publish devotional with fencing token verification or direct upsert.
 * Ensures data is persisted into 'daily_devotionals' table with unique publish_date constraint.
 */
async function publishAtomicDevotional(
  supabase: SupabaseClient,
  lockToken: string,
  publishDate: string,
  devotional: Devotional
): Promise<boolean> {
  // If the server only has the public anon key, writing to daily_devotionals is restricted by RLS
  if (!hasServiceRoleKey()) {
    return false;
  }

  // 1. Try atomic RPC procedure if installed
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

    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (rpcErr) {
    console.warn('[DevotionalService] RPC publish_daily_devotional call failed:', rpcErr);
  }

  // 2. Direct upsert into 'daily_devotionals' table with onConflict publish_date
  try {
    const { error: upsertErr } = await supabase
      .from('daily_devotionals')
      .upsert({
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
      }, { onConflict: 'publish_date' });

    if (!upsertErr) {
      console.log(`[DevotionalService] Daily devotional successfully saved to Supabase for ${publishDate}.`);
      return true;
    }
    console.warn('[DevotionalService] Direct upsert into daily_devotionals error:', upsertErr.message);
  } catch (directErr) {
    console.warn('[DevotionalService] Direct upsert exception:', directErr);
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
 * Internal execution method for getting or generating the shared daily devotional
 */
async function executeGetOrGenerateDailySharedDevotional(): Promise<{ devotional: Devotional; source: string; publishDate: string }> {
  const publishDate = getSaoPauloDate();

  // 0. Instant In-Memory Cache: Se já calculado hoje, retorna imediatamente em 0ms
  if (memoryDailyCache && memoryDailyCache.publishDate === publishDate) {
    return memoryDailyCache.result;
  }

  const supabase = getServerSupabaseClient();
  const workerId = `worker-${Math.random().toString(36).substring(2, 9)}`;
  const lockToken = crypto.randomUUID();

  // 1. Instant Supabase Cache Check: Se já existir devocional para a data de hoje (Brasília), retorna imediatamente.
  // Nenhum devocional novo é gerado a cada acesso ou atualização de página!
  if (supabase) {
    const existing = await fetchDailyFromSupabase(supabase, publishDate);
    if (existing) {
      const res = {
        devotional: existing,
        source: 'supabase_cache',
        publishDate
      };
      memoryDailyCache = { publishDate, result: res };
      return res;
    }
  }

  // 2. Não encontrado no cache: Tenta obter a trava de geração
  let hasLock = false;
  if (supabase) {
    hasLock = await acquireAtomicLock(supabase, publishDate, lockToken, workerId, 25);
  } else {
    hasLock = true;
  }

  // 3. Proteção contra concorrência para outros visitantes simultâneos:
  // Se outro worker obteve a trava, aguarda e consulta o banco a cada 500ms (até 7.5s)
  if (!hasLock && supabase) {
    console.log(`[DevotionalService] Worker ${workerId}: Bloqueio detido por outro processo para ${publishDate}. Aguardando término...`);
    const maxWaitMs = 7500;
    const intervalMs = 500;
    const startWait = Date.now();

    while (Date.now() - startWait < maxWaitMs) {
      await new Promise(r => setTimeout(r, intervalMs));
      const newlyGenerated = await fetchDailyFromSupabase(supabase, publishDate);
      if (newlyGenerated) {
        const res = {
          devotional: newlyGenerated,
          source: 'supabase_cache_after_concurrent_lock_wait',
          publishDate
        };
        memoryDailyCache = { publishDate, result: res };
        return res;
      }
    }

    // Se o tempo esgotou e ainda não existe registro, tenta adquirir novamente
    hasLock = await acquireAtomicLock(supabase, publishDate, lockToken, workerId, 25);
  }

  // 4. Executa a geração com Gemini se detém a trava
  if (hasLock) {
    try {
      console.log(`[DevotionalService] Worker ${workerId} obteve o lock. Chamando Gemini para a data: ${publishDate}...`);
      const generated = await generateDevotionalWithGemini();

      if (supabase) {
        await publishAtomicDevotional(supabase, lockToken, publishDate, generated);
      }

      const res = {
        devotional: generated,
        source: 'gemini_generated',
        publishDate
      };
      memoryDailyCache = { publishDate, result: res };
      return res;
    } catch (geminiError: any) {
      const isQuota = String(geminiError?.message || geminiError).includes('429');
      if (isQuota) {
        console.warn(`[DevotionalService] Cota diária gratuita do Gemini atingida para hoje (${publishDate}). Ativando contingência oficial.`);
      } else {
        console.warn('[DevotionalService] Geração com Gemini indisponível:', geminiError?.message || geminiError);
      }

      if (supabase) {
        await releaseAtomicLock(supabase, publishDate, lockToken, 'failed');
      }
    }
  }

  // 5. Estratégia de contingência 1: Buscar o devocional mais recente publicado anteriormente no Supabase
  if (supabase) {
    try {
      const { data: latestRow } = await supabase
        .from('daily_devotionals')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestRow) {
        const res = {
          devotional: {
            id: latestRow.id,
            title: latestRow.title,
            verse: latestRow.verse,
            reference: latestRow.reference,
            version: latestRow.version || 'ARA',
            theme: latestRow.theme,
            reflection: latestRow.reflection,
            prayer: latestRow.prayer,
            actionStep: latestRow.action_step,
            tags: latestRow.tags || [],
            date: new Date(`${publishDate}T12:00:00Z`).toLocaleDateString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
          },
          source: 'latest_published_fallback',
          publishDate
        };
        memoryDailyCache = { publishDate, result: res };
        return res;
      }
    } catch (fallbackErr) {
      console.warn('[DevotionalService] Erro ao recuperar devocional mais recente:', fallbackErr);
    }
  }

  // 6. Estratégia de contingência 2: Pool curado interno determinístico por data
  // Garante que mesmo em modo fallback todos os usuários veem rigorosamente a mesma palavra no dia
  const dateHash = publishDate.split('-').reduce((acc, part) => acc + (parseInt(part, 10) || 0), 0);
  const curatedIndex = dateHash % CURATED_DEVOTIONALS.length;
  const curated = CURATED_DEVOTIONALS[curatedIndex] || CURATED_DEVOTIONALS[0];

  const res = {
    devotional: {
      ...curated,
      date: new Date().toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    },
    source: 'curated_fallback',
    publishDate
  };
  memoryDailyCache = { publishDate, result: res };
  return res;
}

/**
 * Main Centralized Method: Get or Generate the shared daily devotional
 * Protected by in-process promise deduplication and database-level concurrency locking.
 */
export async function getOrGenerateDailySharedDevotional(): Promise<{ devotional: Devotional; source: string; publishDate: string }> {
  if (inFlightDailyPromise) {
    console.log('[DevotionalService] In-flight shared promise already running. Reusing for caller...');
    return inFlightDailyPromise;
  }

  inFlightDailyPromise = executeGetOrGenerateDailySharedDevotional().finally(() => {
    inFlightDailyPromise = null;
  });

  return inFlightDailyPromise;
}
