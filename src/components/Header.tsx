import React from 'react';
import { Sparkles, Bell, Flame, Bookmark, SunMedium } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  readingStreak: number;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  readingStreak,
  favoritesCount
}) => {
  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Capitalize first letter of weekday
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="sticky top-0 z-30 bg-amber-50/80 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('devocional')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
            <SunMedium className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-heading-cinzel font-bold text-lg sm:text-xl tracking-wide text-amber-950">
                Luz Diária
              </h1>
            </div>
            <p className="text-xs text-amber-800/80 hidden sm:block">
              {capitalizedDate}
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reading Streak */}
          <div 
            onClick={() => setActiveTab('leitura-biblica')}
            title="Sua sequência de leitura da Bíblia"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-medium cursor-pointer hover:bg-amber-200/60 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>{readingStreak} {readingStreak === 1 ? 'dia' : 'dias'}</span>
          </div>

          {/* Favorites Button */}
          <button
            onClick={() => setActiveTab('favoritos')}
            className={`p-2 rounded-full border transition-all ${
              activeTab === 'favoritos'
                ? 'bg-amber-200 border-amber-400 text-amber-900'
                : 'bg-white/70 border-amber-200/60 text-slate-700 hover:bg-amber-100/60'
            }`}
            title="Devocionais Favoritos"
          >
            <Bookmark className="w-4 h-4" />
            {favoritesCount > 0 && (
              <span className="sr-only">{favoritesCount} favoritos</span>
            )}
          </button>

          {/* Morning Notifications Bell */}
          <button
            onClick={() => setActiveTab('notificacoes')}
            className={`relative p-2 rounded-full border transition-all ${
              activeTab === 'notificacoes'
                ? 'bg-amber-200 border-amber-400 text-amber-900'
                : 'bg-white/70 border-amber-200/60 text-slate-700 hover:bg-amber-100/60'
            }`}
            title="Configurar Notificações Matinais"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>

          {/* Generate Custom with AI */}
          <button
            onClick={() => setActiveTab('ia-gerador')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-amber-600 to-amber-700 text-white text-xs font-medium shadow-xs hover:from-amber-700 hover:to-amber-800 transition-all hover:scale-102 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Palavra para o Coração</span>
          </button>
        </div>

      </div>
    </header>
  );
};
