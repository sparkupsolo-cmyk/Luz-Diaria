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

export const getStoredCurrentDevotional = (): Devotional | null => {
  try {
    const raw = localStorage.getItem(CURRENT_DEVOTIONAL_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading current devotional:', e);
  }
  return null;
};

export const saveStoredCurrentDevotional = (devotional: Devotional) => {
  try {
    localStorage.setItem(CURRENT_DEVOTIONAL_KEY, JSON.stringify(devotional));
  } catch (e) {
    console.error('Error saving current devotional:', e);
  }
};
