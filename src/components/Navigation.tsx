import React from 'react';
import { BookOpen, BarChart3, Sparkles, Share2, Bell, Heart } from 'lucide-react';
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
      icon: BookOpen,
      badge: null
    },
    {
      id: 'leitura-biblica' as ActiveTab,
      label: 'Progresso Bíblico',
      icon: BarChart3,
      badge: `${biblePercentage}%`
    },
    {
      id: 'compartilhar' as ActiveTab,
      label: 'Compartilhar',
      icon: Share2,
      badge: null
    },
    {
      id: 'notificacoes' as ActiveTab,
      label: 'Notificações',
      icon: Bell,
      badge: null
    },
    {
      id: 'favoritos' as ActiveTab,
      label: 'Salvos',
      icon: Heart,
      badge: null
    }
  ];

  return (
    <>
      {/* Desktop Navigation Pill Bar */}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-amber-200/80 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors cursor-pointer relative ${
                isActive ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-100' : 'bg-transparent'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none text-center line-clamp-1">
                {tab.label === 'Progresso Bíblico' ? 'Bíblia' : tab.label}
              </span>
              {tab.id === 'leitura-biblica' && biblePercentage > 0 && (
                <span className="absolute top-0 right-1 text-[9px] bg-amber-600 text-white px-1 rounded-full font-semibold">
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
