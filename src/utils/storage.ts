import { BibleProgress, Devotional, NotificationConfig } from '../types';

const PROGRESS_KEY = 'luz_diaria_bible_progress';
const FAVORITES_KEY = 'luz_diaria_favorites';
const NOTIFICATION_KEY = 'luz_diaria_notification_config';
const CURRENT_DEVOTIONAL_KEY = 'luz_diaria_today_devotional';

export const getStoredBibleProgress = (): BibleProgress => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading bible progress:', e);
  }
  return {
    readChapters: {},
    lastUpdated: new Date().toISOString(),
    readingStreak: 1,
    lastReadDate: new Date().toISOString().split('T')[0]
  };
};

export const saveBibleProgress = (progress: BibleProgress) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving bible progress:', e);
  }
};

export const getStoredFavorites = (): Devotional[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading favorites:', e);
  }
  return [];
};

export const saveFavorites = (favorites: Devotional[]) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Error saving favorites:', e);
  }
};

export const getStoredNotificationConfig = (): NotificationConfig => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading notification config:', e);
  }
  return {
    enabled: true,
    time: '07:00',
    themePreference: 'Inspiração & Força',
    soundAlert: true
  };
};

export const saveNotificationConfig = (config: NotificationConfig) => {
  try {
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving notification config:', e);
  }
};

export function getSaoPauloDateClient(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

interface CachedDevotionalPayload {
  publishDate: string;
  devotional: Devotional;
  savedAt: string;
}

/**
 * Returns stored devotional ONLY if it matches today's date in America/Sao_Paulo.
 * If outdated or from a previous day, returns null to avoid displaying old content.
 */
export const getStoredCurrentDevotional = (targetDate?: string): Devotional | null => {
  try {
    const raw = localStorage.getItem(CURRENT_DEVOTIONAL_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const today = targetDate || getSaoPauloDateClient();

    // Check payload structure with date
    if (parsed && parsed.publishDate && parsed.devotional) {
      if (parsed.publishDate === today) {
        return parsed.devotional;
      }
      // If it belongs to a past date, clear it
      localStorage.removeItem(CURRENT_DEVOTIONAL_KEY);
      return null;
    }

    // Legacy unversioned entry: clean up
    localStorage.removeItem(CURRENT_DEVOTIONAL_KEY);
  } catch (e) {
    console.error('Error loading current devotional:', e);
  }
  return null;
};

export const saveStoredCurrentDevotional = (devotional: Devotional, publishDate?: string) => {
  try {
    const today = publishDate || getSaoPauloDateClient();
    const payload: CachedDevotionalPayload = {
      publishDate: today,
      devotional,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(CURRENT_DEVOTIONAL_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Error saving current devotional:', e);
  }
};

