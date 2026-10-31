import React from 'react';
import { BookOpen, BarChart3, Share2, Bell, Bookmark } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  biblePercentage: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  biblePercentage
}) => {
  const tabs = [
    {
      id: 'devocional' as ActiveTab,
      label: 'Devocional',
      shortLabel: 'Devocional',
      icon: BookOpen,
      badge: null
    },
    {
      id: 'leitura-biblica' as ActiveTab,
      label: 'Progresso Bíblico',
      shortLabel: 'Bíblia',
      icon: BarChart3,
      badge: biblePercentage > 0 ? `${biblePercentage}%` : null
    },
    {
      id: 'compartilhar' as ActiveTab,
      label: 'Compartilhar',
      shortLabel: 'Partilhar',
      icon: Share2,
      badge: null
    },
    {
      id: 'notificacoes' as ActiveTab,
      label: 'Notificações',
      shortLabel: 'Lembretes',
      icon: Bell,
      badge: null
    },
    {
      id: 'favoritos' as ActiveTab,
      label: 'Salvos',
      shortLabel: 'Salvos',
      icon: Bookmark,
      badge: null
    }
  ];

  return (
    <>
      {/* 1. Desktop Navigation Pill Bar */}
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2 hidden md:block">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-amber-950 hover:bg-amber-50/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-amber-700/80'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. Mobile Top Scrollable Quick Navigation (Directly visible on phone viewports) */}
      <nav className="md:hidden w-full px-3 pt-2.5 pb-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max py-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white/90 text-slate-700 border-amber-200/80 hover:bg-amber-50/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : 'text-amber-700'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Mobile Bottom Fixed Navigation Bar (Sticky with safe-area and high z-index) */}
      <nav 
        aria-label="Navegação Principal Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom,10px))] flex items-center justify-around"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
                isActive ? 'text-amber-800 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div 
                className={`p-1.5 rounded-xl transition-transform ${
                  isActive ? 'bg-amber-100 text-amber-800 scale-105' : 'bg-transparent text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] mt-0.5 leading-none text-center truncate ${isActive ? 'font-bold text-amber-900' : 'font-medium'}`}>
                {tab.shortLabel}
              </span>
              {tab.id === 'leitura-biblica' && biblePercentage > 0 && (
                <span className="absolute top-1 right-[18%] text-[9px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-bold shadow-xs">
                  {biblePercentage}%
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
