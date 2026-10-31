import { Sparkles, Bell, Flame, Bookmark, SunMedium, User as UserIcon, LogOut } from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  readingStreak: number;
  favoritesCount: number;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  readingStreak,
  favoritesCount,
  onOpenAuthModal,
  onOpenProfileModal
}) => {
  const { user, signOut } = useAuth();
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

          {/* User Account / Cloud Sync */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={onOpenProfileModal}
                title="Ver meu perfil e estatísticas"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="max-w-[70px] truncate sm:max-w-[100px]">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              </button>
              <button
                onClick={() => signOut()}
                title="Sair da conta"
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Conectar com Supabase"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/90 hover:bg-amber-200/80 border border-amber-300 text-amber-950 text-xs font-semibold cursor-pointer transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
