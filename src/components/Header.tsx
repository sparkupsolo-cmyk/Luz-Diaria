import React, { useState } from 'react';
import { 
  SunMedium, 
  Flame, 
  Bookmark, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  BookOpen, 
  BarChart3, 
  Share2, 
  History,
  ChevronRight
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ShareAppButton } from './ShareAppButton';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  readingStreak: number;
  favoritesCount: number;
  biblePercentage?: number;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenHistoryModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  readingStreak,
  favoritesCount,
  biblePercentage = 0,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenHistoryModal
}) => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    {
      id: 'devocional' as ActiveTab,
      label: 'Devocional Diário',
      sublabel: 'A palavra do dia compartilhada',
      icon: BookOpen,
      badge: null
    },
    {
      id: 'leitura-biblica' as ActiveTab,
      label: 'Progresso Bíblico',
      sublabel: 'Metas e leitura dos 1.189 capítulos',
      icon: BarChart3,
      badge: biblePercentage > 0 ? `${biblePercentage}% lido` : null
    },
    {
      id: 'compartilhar' as ActiveTab,
      label: 'Compartilhar Palavra',
      sublabel: 'Criar imagem para WhatsApp e redes',
      icon: Share2,
      badge: null
    },
    {
      id: 'notificacoes' as ActiveTab,
      label: 'Notificações Matinais',
      sublabel: 'Configure seu horário diário de oração',
      icon: Bell,
      badge: null
    },
    {
      id: 'favoritos' as ActiveTab,
      label: 'Devocionais Salvos',
      sublabel: 'Sua coletânea de mensagens favoritas',
      icon: Bookmark,
      badge: favoritesCount > 0 ? `${favoritesCount}` : null
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/70 shadow-xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          
          {/* Brand / Logo */}
          <div 
            onClick={() => handleSelectTab('devocional')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform shrink-0">
              <SunMedium className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading-cinzel font-bold text-base sm:text-xl tracking-wide text-amber-950 truncate">
                Luz Diária
              </h1>
              <p className="text-[11px] text-amber-800/80 hidden sm:block truncate">
                {capitalizedDate}
              </p>
            </div>
          </div>

          {/* Action Bar (Desktop & Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Reading Streak */}
            <div 
              onClick={() => handleSelectTab('leitura-biblica')}
              title="Sua sequência de leitura da Bíblia"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-100/90 border border-amber-200/90 text-amber-900 text-xs font-semibold cursor-pointer hover:bg-amber-200/80 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />
              <span>{readingStreak} <span className="hidden xs:inline">{readingStreak === 1 ? 'dia' : 'dias'}</span></span>
            </div>

            {/* Desktop-only action shortcuts */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleSelectTab('favoritos')}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  activeTab === 'favoritos'
                    ? 'bg-amber-200 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-white/80 border-amber-200/70 text-slate-700 hover:bg-amber-100/60'
                }`}
                title="Devocionais Favoritos"
              >
                <Bookmark className="w-4 h-4" />
                {favoritesCount > 0 && (
                  <span className="sr-only">{favoritesCount} favoritos</span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('notificacoes')}
                className={`relative p-2 rounded-full border transition-all cursor-pointer ${
                  activeTab === 'notificacoes'
                    ? 'bg-amber-200 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-white/80 border-amber-200/70 text-slate-700 hover:bg-amber-100/60'
                }`}
                title="Configurar Notificações Matinais"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
              </button>
            </div>

            {/* Share App Button */}
            <ShareAppButton variant="header" />

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* User Account / Profile */}
            {user ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenProfileModal}
                  title="Meu Perfil"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="max-w-[65px] sm:max-w-[100px] truncate">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </button>
                <button
                  onClick={() => signOut()}
                  title="Sair"
                  className="hidden md:flex p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                title="Entrar com Supabase"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-100" />
                <span className="text-xs">Entrar</span>
              </button>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
              className="flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 border border-amber-300/90 text-amber-950 font-semibold text-xs cursor-pointer transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-amber-900" />
              ) : (
                <Menu className="w-4 h-4 text-amber-900" />
              )}
              <span className="text-xs font-bold text-amber-900">Menu</span>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer / Slide-over Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to dismiss */}
          <div 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)} 
          />

          {/* Drawer Sheet */}
          <div className="bg-[#fcfbf9] border-t border-amber-300 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header of Drawer */}
            <div className="px-5 py-4 border-b border-amber-200/80 bg-amber-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <SunMedium className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="font-heading-cinzel font-bold text-base text-amber-950 leading-tight">
                    Navegação do Aplicativo
                  </h3>
                  <p className="text-[11px] text-amber-800/80 font-medium">
                    {capitalizedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-900 cursor-pointer"
                aria-label="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="p-4 overflow-y-auto space-y-1.5 flex-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer text-left min-h-[50px] ${
                      isActive 
                        ? 'bg-amber-600 text-white shadow-sm' 
                        : 'bg-white hover:bg-amber-50/80 border border-amber-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isActive ? 'bg-amber-700/80 text-amber-100' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {item.label}
                        </div>
                        <div className={`text-[11px] truncate ${isActive ? 'text-amber-100' : 'text-slate-500'}`}>
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {item.badge && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}

              {/* Histórico de Devocionais Shortcut */}
              {onOpenHistoryModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenHistoryModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-amber-50 border border-amber-100 text-slate-800 transition-colors cursor-pointer min-h-[50px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-amber-950">
                        Histórico dos Dias Anteriores
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Consultar devocionais passados arquivados
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Install App on Phone CTA */}
              <div className="pt-2 space-y-2">
                <ShareAppButton variant="drawer" />
                <PWAInstallButton variant="drawer" />
              </div>
            </div>

            {/* Bottom Account Card inside Mobile Drawer */}
            <div className="p-4 border-t border-amber-200/80 bg-amber-50/50 shrink-0">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Conectado via Supabase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenProfileModal();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100/70 cursor-pointer"
                      title="Sair"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <UserIcon className="w-4 h-4 text-amber-200" />
                  <span>Entrar ou Criar Conta Gratuita</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
