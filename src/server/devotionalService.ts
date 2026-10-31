import { GoogleGenAI, Type } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { CURATED_DEVOTIONALS } from '../data/curatedDevotionals';
import { Devotional } from '../types';

/**
 * Returns current date string formatted as YYYY-MM-DD in America/Sao_Paulo timezone
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
 * Initialize Supabase Client for server-side usage.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY to perform administrative atomic locks and writes.
 * The service role key is NEVER exposed to the frontend/browser.
 */
function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes('your-project-id') || url.includes('[COLE') || key.includes('your-supabase') || key.includes('[COLE')) return null;

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
 * Returns true only if lock was successfully acquired for this token via RPC.
 * Default TTL is 25 seconds (safe ceiling for server crashes).
 */
async function acquireAtomicLock(
  supabase: SupabaseClient,
  publishDate: string,
  lockToken: string,
  workerId: string,
  timeoutSeconds: number = 25
): Promise<boolean> {
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
    if (error) {
      console.warn('[DevotionalService] RPC acquire_generation_lock error:', error.message);
    }
  } catch (rpcErr) {
    console.warn('[DevotionalService] RPC acquire_generation_lock call failed:', rpcErr);
  }

  // Falha na trava RPC: retorna false para evitar concorrência descontrolada
  return false;
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
    if (error) {
      console.warn('[DevotionalService] RPC release_generation_lock error:', error.message);
    }
  } catch (err) {
    console.warn('[DevotionalService] RPC release_generation_lock call failed:', err);
  }

  return false;
}

/**
 * Atomically publish devotional with fencing token verification and SELECT FOR UPDATE.
 * Prevents a stale/delayed worker from publishing after losing its lock.
 * NEVER performs alternative unverified direct writes if RPC lock check fails.
 */
async function publishAtomicDevotional(
  supabase: SupabaseClient,
  lockToken: string,
  publishDate: string,
  devotional: Devotional
): Promise<boolean> {
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
    if (error) {
      console.warn('[DevotionalService] RPC publish_daily_devotional error:', error.message);
    }
  } catch (rpcErr) {
    console.warn('[DevotionalService] RPC publish_daily_devotional call failed:', rpcErr);
  }

  // Se o RPC falhar ou o lock for rejeitado, NÃO executa escrita direta alternativa
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
 * Enforces an internal timeout of 9,500ms (9.5s) to guarantee recovery
 * well before Vercel's 15s serverless execution limit.
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

  // Internal 9.5s timeout wrapper to stay well below Vercel's 15s cutoff
  const timeoutMs = 9500;
  let timerId: any;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Timeout na chamada da API Gemini (${timeoutMs}ms excedidos)`));
    }, timeoutMs);
  });

  const apiCallPromise = (async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    if (!text) throw new Error('Resposta vazia da API Gemini');

    const parsed = JSON.parse(text);
    return {
      id: `dev-daily-${Date.now()}`,
      ...parsed,
      date: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' })
    };
  })();

  try {
    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Main Centralized Method: Get or Generate the shared daily devotional
 * Implements:
 * 1. America/Sao_Paulo calendar date reference.
 * 2. Instant cache check in Supabase daily_devotionals (never re-generates existing date).
 * 3. PostgreSQL atomic lock with unique ownership token and 25s TTL.
 * 4. Waiting loop capped at 7.5s with polling for concurrent visitors (staying within Vercel's 15s budget).
 * 5. Internal 9.5s Gemini timeout with immediate lock failure release.
 * 6. SELECT FOR UPDATE fencing token check on publish to prevent stale writes.
 * 7. Multi-level fallback on Gemini failure (latest published -> curated).
 */
export async function getOrGenerateDailySharedDevotional(): Promise<{ devotional: Devotional; source: string; publishDate: string }> {
  const publishDate = getSaoPauloDate();
  const supabase = getServerSupabaseClient();
  const workerId = `worker-${Math.random().toString(36).substring(2, 9)}`;
  const lockToken = crypto.randomUUID();

  // 1. Instant Cache Check: Se já existir devocional para a data, retorna imediatamente
  if (supabase) {
    const existing = await fetchDailyFromSupabase(supabase, publishDate);
    if (existing) {
      return {
        devotional: existing,
        source: 'supabase_cache',
        publishDate
      };
    }
  }

  // 2. Não encontrado no cache: Tenta obter a trava atômica com token exclusivo
  let hasLock = false;
  if (supabase) {
    hasLock = await acquireAtomicLock(supabase, publishDate, lockToken, workerId, 25);
  } else {
    // Se Supabase ainda não foi configurado localmente, permite geração direta
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
        return {
          devotional: newlyGenerated,
          source: 'supabase_cache_after_concurrent_lock_wait',
          publishDate
        };
      }
    }

    // Se o tempo de espera esgotou e ainda não existe devocional, tenta adquirir o lock novamente
    hasLock = await acquireAtomicLock(supabase, publishDate, lockToken, workerId, 25);
  }

  // 4. Executa a chamada ao Gemini se for o proprietário legítimo da trava
  if (hasLock) {
    try {
      console.log(`[DevotionalService] Worker ${workerId} obteve o lock. Chamando Gemini para a data: ${publishDate}...`);
      const generated = await generateDevotionalWithGemini();

      if (supabase) {
        // Publicação atômica com validação de fencing token e SELECT FOR UPDATE
        const published = await publishAtomicDevotional(supabase, lockToken, publishDate, generated);
        if (!published) {
          console.warn('[DevotionalService] Publicação rejeitada pelo fencing token. Recuperando registro existente...');
          const fallbackCached = await fetchDailyFromSupabase(supabase, publishDate);
          if (fallbackCached) {
            return {
              devotional: fallbackCached,
              source: 'supabase_cache_after_fencing_loss',
              publishDate
            };
          }
        }
      }

      return {
        devotional: generated,
        source: 'gemini_generated',
        publishDate
      };
    } catch (geminiError: any) {
      console.error('[DevotionalService] Falha ou timeout na geração com Gemini:', geminiError?.message || geminiError);

      // Libera imediatamente a trava marcando-a como 'failed' para que o próximo acesso possa tentar
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
        return {
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
      }
    } catch (fallbackErr) {
      console.warn('[DevotionalService] Erro ao recuperar devocional mais recente:', fallbackErr);
    }
  }

  // 6. Estratégia de contingência 2: Pool curado interno
  const curated = CURATED_DEVOTIONALS[0];
  return {
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
}
