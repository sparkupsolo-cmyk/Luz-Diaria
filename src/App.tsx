import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DevotionalCard } from './components/DevotionalCard';
import { BibleReadingTracker } from './components/BibleReadingTracker';
import { ShareStudio } from './components/ShareStudio';
import { MorningNotificationManager } from './components/MorningNotificationManager';
import { DevotionalAIGenerator } from './components/DevotionalAIGenerator';
import { FavoritesArchive } from './components/FavoritesArchive';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('devocional');
  const [currentDevotional, setCurrentDevotional] = useState<Devotional>(() => {
    const saved = getStoredCurrentDevotional();
    return saved || CURATED_DEVOTIONALS[0];
  });
  const [bibleProgress, setBibleProgress] = useState<BibleProgress>(getStoredBibleProgress);
  const [favorites, setFavorites] = useState<Devotional[]>(getStoredFavorites);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(getStoredNotificationConfig);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Synchronize Bible reading progress
  const handleUpdateBibleProgress = (newProgress: BibleProgress) => {
    setBibleProgress(newProgress);
    saveBibleProgress(newProgress);
  };

  // Synchronize favorites
  const handleToggleFavorite = (dev: Devotional) => {
    const isFav = favorites.some((f) => f.id === dev.id);
    let updated: Devotional[];
    if (isFav) {
      updated = favorites.filter((f) => f.id !== dev.id);
    } else {
      updated = [{ ...dev, isFavorite: true }, ...favorites];
    }
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
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

  // Regenerate daily devotional via API
  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/devotional/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: 'Renovação Matinal',
          mood: 'Esperançoso'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.devotional) {
          setCurrentDevotional(data.devotional);
          saveStoredCurrentDevotional(data.devotional);
        }
      }
    } catch (e) {
      console.error('Error regenerating devotional:', e);
      // Select another from curated pool
      const nextDev = CURATED_DEVOTIONALS[(Math.floor(Math.random() * CURATED_DEVOTIONALS.length))];
      setCurrentDevotional(nextDev);
      saveStoredCurrentDevotional(nextDev);
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate confronting devotional directly
  const handleConfrontingRegenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/devotional/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: 'Tomar a Cruz Diária e Morrer para Si',
          toneMode: 'confronting',
          mood: 'Quebrantado'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.devotional) {
          setCurrentDevotional(data.devotional);
          saveStoredCurrentDevotional(data.devotional);
        }
      }
    } catch (e) {
      console.error('Error generating confronting devotional:', e);
      // Select another confronting from curated pool
      const nextDev = CURATED_DEVOTIONALS[(Math.floor(Math.random() * CURATED_DEVOTIONALS.length))];
      setCurrentDevotional(nextDev);
      saveStoredCurrentDevotional(nextDev);
    } finally {
      setIsGenerating(false);
    }
  };

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
        // Trigger notification
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
    const interval = setInterval(checkMorningNotification, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [notificationConfig, currentDevotional]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        readingStreak={bibleProgress.readingStreak || 1}
        favoritesCount={favorites.length}
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
            onRegenerate={handleRegenerate}
            onConfrontingRegenerate={handleConfrontingRegenerate}
            isGenerating={isGenerating}
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

        {activeTab === 'ia-gerador' && (
          <DevotionalAIGenerator
            onDevotionalGenerated={(newDev) => {
              setCurrentDevotional(newDev);
              saveStoredCurrentDevotional(newDev);
              setActiveTab('devocional');
            }}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
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
            Luz Diária • Devocionais Inteligentes & Progresso Bíblico
          </p>
          <p className="text-slate-400">
            Alimentando o espírito com as Sagradas Escrituras a cada manhã
          </p>
        </div>
      </footer>

    </div>
  );
}
