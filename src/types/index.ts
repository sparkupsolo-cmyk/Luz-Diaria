export interface Devotional {
  id: string;
  title: string;
  verse: string;
  reference: string;
  version: string;
  theme: string;
  reflection: string;
  prayer: string;
  actionStep: string;
  date: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface BibleProgress {
  readChapters: Record<string, number[]>; // bookId -> [1, 2, 5, ...]
  lastUpdated: string;
  readingStreak: number;
  lastReadDate: string; // YYYY-MM-DD
}

export interface NotificationConfig {
  enabled: boolean;
  time: string; // "07:00"
  themePreference: string;
  soundAlert: boolean;
  lastDeliveredDate?: string;
}

export type ActiveTab = 'devocional' | 'leitura-biblica' | 'compartilhar' | 'notificacoes' | 'favoritos';

export type CardVisualTheme = 'aurora-dourada' | 'ceu-celestial' | 'noite-estrelada' | 'pergaminho-sagrado' | 'floresta-serena' | 'minimalista-ouro';

export type CardFormat = 'story' | 'feed' | 'compact';
