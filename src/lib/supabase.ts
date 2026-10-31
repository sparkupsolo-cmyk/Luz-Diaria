import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Devotional, BibleProgress } from '../types';

// Read Supabase configuration from Vite environment variables (client-side only)
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  '';

const supabasePublishableKey = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) || 
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabasePublishableKey && 
    !supabaseUrl.includes('your-project-id') &&
    !supabasePublishableKey.includes('your-supabase-publishable-key')
  );
};

// Fallback placeholder url to prevent createClient constructor from throwing when credentials are not yet entered
const validUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured() ? supabasePublishableKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// ============================================================================
// Database Sync Helpers (Graceful: fall back silently if not configured)
// ============================================================================

/**
 * Save a newly generated devotional to the Supabase 'devotionals' table
 */
export async function saveDevotionalToCloud(devotional: Devotional, userId?: string | null): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('devotionals').upsert({
      id: devotional.id,
      title: devotional.title,
      verse: devotional.verse,
      reference: devotional.reference,
      version: devotional.version,
      theme: devotional.theme,
      reflection: devotional.reflection,
      prayer: devotional.prayer,
      action_step: devotional.actionStep,
      tags: devotional.tags || [],
      user_id: userId || null
    });
  } catch (err) {
    console.error('Error saving devotional to cloud:', err);
  }
}

/**
 * Fetch all favorites for the authenticated user from Supabase
 */
export async function fetchUserFavoritesFromCloud(userId: string): Promise<Devotional[]> {
  if (!isSupabaseConfigured() || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('devotional_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching favorites from cloud:', error.message);
      return [];
    }

    return (data || []).map(row => row.devotional_data as Devotional);
  } catch (err) {
    console.error('Failed to load user favorites:', err);
    return [];
  }
}

/**
 * Add a devotional to user's favorites in Supabase
 */
export async function addFavoriteToCloud(userId: string, devotional: Devotional): Promise<void> {
  if (!isSupabaseConfigured() || !userId) return;
  try {
    await supabase.from('favorites').upsert({
      user_id: userId,
      devotional_id: devotional.id,
      devotional_data: devotional
    }, { onConflict: 'user_id, devotional_id' });
  } catch (err) {
    console.error('Error adding favorite to cloud:', err);
  }
}

/**
 * Remove a devotional from user's favorites in Supabase
 */
export async function removeFavoriteFromCloud(userId: string, devotionalId: string): Promise<void> {
  if (!isSupabaseConfigured() || !userId) return;
  try {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('devotional_id', devotionalId);
  } catch (err) {
    console.error('Error removing favorite from cloud:', err);
  }
}

/**
 * Fetch user's Bible reading progress from Supabase
 */
export async function fetchBibleProgressFromCloud(userId: string): Promise<BibleProgress | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('bible_progress')
      .select('read_chapters, reading_streak, last_read_date, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      readChapters: data.read_chapters || {},
      readingStreak: data.reading_streak || 1,
      lastReadDate: data.last_read_date || new Date().toISOString().split('T')[0],
      lastUpdated: data.updated_at || new Date().toISOString()
    };
  } catch (err) {
    console.error('Error fetching Bible progress:', err);
    return null;
  }
}

/**
 * Save user's Bible reading progress to Supabase
 */
export async function saveBibleProgressToCloud(userId: string, progress: BibleProgress): Promise<void> {
  if (!isSupabaseConfigured() || !userId) return;
  try {
    await supabase.from('bible_progress').upsert({
      user_id: userId,
      read_chapters: progress.readChapters,
      reading_streak: progress.readingStreak,
      last_read_date: progress.lastReadDate,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.error('Error saving Bible progress to cloud:', err);
  }
}

/**
 * Fetch devotional history generated by the authenticated user from Supabase
 */
export async function fetchUserDevotionalHistoryFromCloud(userId: string): Promise<Devotional[]> {
  if (!isSupabaseConfigured() || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching devotional history:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      verse: row.verse,
      reference: row.reference,
      version: row.version || 'ARA',
      theme: row.theme,
      reflection: row.reflection,
      prayer: row.prayer,
      actionStep: row.action_step,
      tags: row.tags || [],
      date: new Date(row.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    }));
  } catch (err) {
    console.error('Failed to load user devotional history:', err);
    return [];
  }
}

/**
 * Fetch the shared community devotional of the day (America/Sao_Paulo)
 */
export async function fetchTodaySharedDevotional(): Promise<{ devotional: Devotional; source: string } | null> {
  // 1. First attempt: call backend API endpoint which handles atomic lock and Gemini recovery
  try {
    const res = await fetch('/api/devotional/today');
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.devotional) {
        return { devotional: data.devotional, source: data.source };
      }
    }
  } catch (err) {
    console.warn('Backend /api/devotional/today unreachable, checking Supabase directly:', err);
  }

  // 2. Direct Supabase read fallback if configured
  if (isSupabaseConfigured()) {
    try {
      const spDate = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const { data } = await supabase
        .from('daily_devotionals')
        .select('*')
        .eq('publish_date', spDate)
        .maybeSingle();

      if (data) {
        return {
          devotional: {
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
            date: new Date(`${spDate}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' })
          },
          source: 'direct_supabase_client'
        };
      }
    } catch (e) {
      console.warn('Direct Supabase fetch error:', e);
    }
  }

  return null;
}
