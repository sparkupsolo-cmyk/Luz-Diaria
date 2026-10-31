import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Flame, 
  Bookmark, 
  BookOpen, 
  LogOut, 
  Check, 
  Edit3, 
  History, 
  KeyRound, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TOTAL_BIBLE_CHAPTERS } from '../data/bibleBooks';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoritesCount: number;
  totalChaptersRead: number;
  readingStreak: number;
  onOpenHistory: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  favoritesCount,
  totalChaptersRead,
  readingStreak,
  onOpenHistory
}) => {
  const { user, signOut, updateProfileName, resetPasswordForEmail } = useAuth();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.full_name || '');
  const [updating, setUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Irmão na Fé';
  const email = user.email || '';
  const memberSince = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Recentemente';

  // Extract initials
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  const biblePercentage = Math.round((totalChaptersRead / TOTAL_BIBLE_CHAPTERS) * 100);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setUpdating(true);
    setFeedbackMsg(null);
    try {
      const { error } = await updateProfileName(newName.trim());
      if (error) throw error;
      setIsEditingName(false);
      setFeedbackMsg({ text: 'Nome atualizado com sucesso!', type: 'success' });
    } catch (e: any) {
      setFeedbackMsg({ text: e?.message || 'Erro ao atualizar o nome.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    setUpdating(true);
    setFeedbackMsg(null);
    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) throw error;
      setFeedbackMsg({ text: 'Link de redefinição de senha enviado para o seu e-mail!', type: 'success' });
    } catch (e: any) {
      setFeedbackMsg({ text: e?.message || 'Erro ao enviar redefinição de senha.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Profile Header */}
        <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/90 text-amber-950 font-heading-cinzel font-bold text-2xl flex items-center justify-center border-2 border-amber-200 shadow-md shrink-0">
              {initials || 'LD'}
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
                Perfil de Usuário
              </span>
              <h3 className="font-heading-cinzel font-bold text-xl text-white truncate">
                {displayName}
              </h3>
              <p className="text-xs text-amber-100/80 truncate">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : null}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Account Metrics Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Sua Jornada Bíblica
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                <div className="flex items-center justify-center text-amber-700 mb-1">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-amber-950">
                  {totalChaptersRead}
                </div>
                <div className="text-[10px] text-amber-800/80 font-medium">
                  {biblePercentage}% da Bíblia
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/70">
                <div className="flex items-center justify-center text-orange-600 mb-1">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <div className="text-lg font-bold text-orange-950">
                  {readingStreak} {readingStreak === 1 ? 'dia' : 'dias'}
                </div>
                <div className="text-[10px] text-orange-800/80 font-medium">
                  Sequência Ativa
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/70">
                <div className="flex items-center justify-center text-rose-600 mb-1">
                  <Bookmark className="w-4 h-4 fill-rose-500" />
                </div>
                <div className="text-lg font-bold text-rose-950">
                  {favoritesCount}
                </div>
                <div className="text-[10px] text-rose-800/80 font-medium">
                  Favoritos Salvos
                </div>
              </div>

            </div>
          </div>

          {/* User Details & Edit Name */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Dados da Conta
              </span>
              {!isEditingName && (
                <button
                  onClick={() => { setIsEditingName(true); setNewName(displayName); }}
                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Nome</span>
                </button>
              )}
            </div>

            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome de exibição"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={updating}
                  className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 cursor-pointer disabled:opacity-60"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="px-2.5 py-2 text-slate-500 rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Membro desde {memberSince}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Conta protegida com Supabase RLS</span>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Devotionals History Button */}
          <button
            onClick={() => {
              onClose();
              onOpenHistory();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-amber-700" />
              <span>Ver Histórico de Devocionais na Nuvem</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </button>

          {/* Reset Password Button */}
          <button
            onClick={handleResetPassword}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Redefinir Minha Senha</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer border border-rose-200/80"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta (Logout)</span>
          </button>

        </div>

      </div>
    </div>
  );
};
