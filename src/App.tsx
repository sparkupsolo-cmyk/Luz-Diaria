import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DevotionalCard } from './components/DevotionalCard';
import { BibleReadingTracker } from './components/BibleReadingTracker';
import { ShareStudio } from './components/ShareStudio';
import { MorningNotificationManager } from './components/MorningNotificationManager';
import { FavoritesArchive } from './components/FavoritesArchive';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DevotionalHistoryModal } from './components/DevotionalHistoryModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  saveDevotionalToCloud, 
  addFavoriteToCloud, 
  removeFavoriteFromCloud,
  fetchUserFavoritesFromCloud,
  fetchBibleProgressFromCloud,
  saveBibleProgressToCloud,
  fetchTodaySharedDevotional
} from './lib/supabase';
import { CURATED_DEVOTIONALS } from './data/curatedDevotionals';
import { TOTAL_BIBLE_CHAPTERS } from './data/bibleBooks';
import { Devotional, BibleProgress, NotificationConfig, ActiveTab } from './types';
import {
  getStoredBibleProgress,
  saveBibleProgress,
  getStoredFavorites,
  saveFavorites,
  getStoredNotificationConfig,
  saveNotificationConfig,
  getStoredCurrentDevotional,
  saveStoredCurrentDevotional
} from './utils/storage';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('devocional');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [currentDevotional, setCurrentDevotional] = useState<Devotional>(() => {
    const saved = getStoredCurrentDevotional();
    return saved || CURATED_DEVOTIONALS[0];
  });
  const [bibleProgress, setBibleProgress] = useState<BibleProgress>(getStoredBibleProgress);
  const [favorites, setFavorites] = useState<Devotional[]>(getStoredFavorites);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(getStoredNotificationConfig);

  // 1. Fetch Shared Community Devotional of the Day (America/Sao_Paulo) on mount
  useEffect(() => {
    fetchTodaySharedDevotional().then((result) => {
      if (result?.devotional) {
        setCurrentDevotional(result.devotional);
        saveStoredCurrentDevotional(result.devotional);
      }
    }).catch((err) => {
      console.warn('Could not fetch shared daily devotional on mount:', err);
    });
  }, []);

  // Sync with Supabase on user sign-in
  useEffect(() => {
    if (user?.id) {
      // 1. Fetch Cloud Favorites
      fetchUserFavoritesFromCloud(user.id).then((cloudFavs) => {
        if (cloudFavs && cloudFavs.length > 0) {
          setFavorites((prev) => {
            const map = new Map<string, Devotional>();
            prev.forEach((f) => map.set(f.id, f));
            cloudFavs.forEach((f) => map.set(f.id, f));
            const merged = Array.from(map.values());
            saveFavorites(merged);
            return merged;
          });
        }
      });

      // 2. Fetch Cloud Bible Reading Progress
      fetchBibleProgressFromCloud(user.id).then((cloudProgress) => {
        if (cloudProgress) {
          setBibleProgress((prev) => {
            const mergedChapters = { ...prev.readChapters };
            Object.entries(cloudProgress.readChapters).forEach(([bookId, chapters]) => {
              const set = new Set(mergedChapters[bookId] || []);
              chapters.forEach((c) => set.add(c));
              mergedChapters[bookId] = Array.from(set).sort((a, b) => a - b);
            });
            const merged: BibleProgress = {
              readChapters: mergedChapters,
              readingStreak: Math.max(prev.readingStreak || 1, cloudProgress.readingStreak || 1),
              lastReadDate: cloudProgress.lastReadDate || prev.lastReadDate,
              lastUpdated: new Date().toISOString()
            };
            saveBibleProgress(merged);
            return merged;
          });
        }
      });
    }
  }, [user?.id]);

  // Synchronize Bible reading progress locally and in the cloud
  const handleUpdateBibleProgress = (newProgress: BibleProgress) => {
    setBibleProgress(newProgress);
    saveBibleProgress(newProgress);
    if (user?.id) {
      saveBibleProgressToCloud(user.id, newProgress);
    }
  };

  // Synchronize favorites locally and in the cloud
  const handleToggleFavorite = (dev: Devotional) => {
    const isFav = favorites.some((f) => f.id === dev.id);
    let updated: Devotional[];
    if (isFav) {
      updated = favorites.filter((f) => f.id !== dev.id);
      if (user?.id) {
        removeFavoriteFromCloud(user.id, dev.id);
      }
    } else {
      updated = [{ ...dev, isFavorite: true }, ...favorites];
      if (user?.id) {
        addFavoriteToCloud(user.id, dev);
      }
    }
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
    if (user?.id) {
      removeFavoriteFromCloud(user.id, id);
    }
  };

  // Synchronize notification config
  const handleUpdateNotificationConfig = (newConfig: NotificationConfig) => {
    setNotificationConfig(newConfig);
    saveNotificationConfig(newConfig);
  };

  // Calculate Bible completion %
  const totalReadChapters = Object.values(bibleProgress.readChapters).reduce(
    (acc, arr) => acc + arr.length,
    0
  );
  const biblePercentage = Math.round((totalReadChapters / TOTAL_BIBLE_CHAPTERS) * 100);

  // Check if current devotional is in favorites
  const isCurrentFavorite = favorites.some((f) => f.id === currentDevotional.id);



  // Background Morning Check for Notifications
  useEffect(() => {
    if (!notificationConfig.enabled) return;

    const checkMorningNotification = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const [targetHours, targetMinutes] = notificationConfig.time.split(':').map(Number);

      const targetTime = new Date();
      targetTime.setHours(targetHours, targetMinutes, 0, 0);

      if (now >= targetTime && notificationConfig.lastDeliveredDate !== todayStr) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🌅 Luz Diária • Bom dia!', {
              body: `"${currentDevotional.verse.slice(0, 80)}..." — ${currentDevotional.reference}`,
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.log(e);
          }
        }
        const updated = { ...notificationConfig, lastDeliveredDate: todayStr };
        setNotificationConfig(updated);
        saveNotificationConfig(updated);
      }
    };

    checkMorningNotification();
    const interval = setInterval(checkMorningNotification, 60000);
    return () => clearInterval(interval);
  }, [notificationConfig, currentDevotional]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      
      {/* Top Header with User Account Button */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        readingStreak={bibleProgress.readingStreak || 1}
        favoritesCount={favorites.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        biblePercentage={biblePercentage}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'devocional' && (
          <DevotionalCard
            devotional={currentDevotional}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isCurrentFavorite}
            onOpenShareModal={() => setActiveTab('compartilhar')}
          />
        )}

        {activeTab === 'leitura-biblica' && (
          <BibleReadingTracker
            progress={bibleProgress}
            onUpdateProgress={handleUpdateBibleProgress}
          />
        )}

        {activeTab === 'compartilhar' && (
          <ShareStudio
            devotional={currentDevotional}
            onClose={() => setActiveTab('devocional')}
          />
        )}

        {activeTab === 'notificacoes' && (
          <MorningNotificationManager
            config={notificationConfig}
            onUpdateConfig={handleUpdateNotificationConfig}
            todayDevotional={currentDevotional}
          />
        )}

        {activeTab === 'favoritos' && (
          <FavoritesArchive
            favorites={favorites}
            onSelectDevotional={(dev) => {
              setCurrentDevotional(dev);
              setActiveTab('devocional');
            }}
            onRemoveFavorite={handleRemoveFavorite}
            onShareDevotional={(dev) => {
              setCurrentDevotional(dev);
              setActiveTab('compartilhar');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-amber-200/50 bg-amber-50/40 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-heading-cinzel font-semibold text-amber-950">
            Luz Diária • Devocionais Bíblicos & Progresso de Leitura
          </p>
          <p className="text-slate-400">
            Alimentando o espírito com as Sagradas Escrituras a cada manhã
          </p>
        </div>
      </footer>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        favoritesCount={favorites.length}
        totalChaptersRead={totalReadChapters}
        readingStreak={bibleProgress.readingStreak || 1}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Devotional Cloud History Modal */}
      <DevotionalHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectDevotional={(dev) => {
          setCurrentDevotional(dev);
          setActiveTab('devocional');
        }}
        onShareDevotional={(dev) => {
          setCurrentDevotional(dev);
          setActiveTab('compartilhar');
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
