import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  SunMedium, 
  ArrowRight,
  Database,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { signInWithEmail, signUpWithEmail, resetPasswordForEmail, isConfigured } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw error;
        }
        onClose();
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
          }
          throw error;
        }
        setSuccessMsg('Conta criada com sucesso! Você já está conectado.');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (mode === 'forgot') {
        const { error } = await resetPasswordForEmail(email);
        if (error) throw error;
        setSuccessMsg('Enviamos o link de redefinição de senha para o seu e-mail. Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-600/90 flex items-center justify-center text-white border border-white/20 shadow-xs">
              <SunMedium className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-amber-200 tracking-wider">
                Conta & Nuvem
              </span>
              <h3 className="font-heading-cinzel font-bold text-xl text-white">
                Luz Diária
              </h3>
            </div>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            {mode === 'login' && 'Acesse sua conta para sincronizar seus favoritos e o progresso bíblico.'}
            {mode === 'signup' && 'Cadastre-se gratuitamente para salvar seu progresso na nuvem.'}
            {mode === 'forgot' && 'Recuperação de acesso à sua conta.'}
          </p>
        </div>

        {/* Supabase Not Configured Warning */}
        {!isConfigured && (
          <div className="m-4 mb-0 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Supabase pronto para ser conectado</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Quando você adicionar as chaves <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">SUPABASE_URL</code> e <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">SUPABASE_PUBLISHABLE_KEY</code> no Vercel ou <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code>, o login será ativado instantaneamente.
            </p>
          </div>
        )}

        {/* Tab switchers: Login / Cadastro */}
        {mode !== 'forgot' ? (
          <div className="flex border-b border-slate-100 px-6 pt-3 shrink-0">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center transition-all cursor-pointer border-b-2 ${
                mode === 'login'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center transition-all cursor-pointer border-b-2 ${
                mode === 'signup'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Criar Conta
            </button>
          </div>
        ) : (
          <div className="px-6 pt-3 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className="text-xs font-semibold text-slate-600 hover:text-amber-900 flex items-center gap-1 cursor-pointer py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o Login</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Seu Nome</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Senha</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                      className="text-[11px] text-amber-700 hover:text-amber-900 cursor-pointer font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Aguarde um momento...</span>
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Luz Diária</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <span>Criar Minha Conta Gratuita</span>
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <span>Enviar Link de Recuperação</span>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">ou</span>
            </div>
          </div>

          {/* Opção 4: Continuar sem cadastro (Modo Visitante) */}
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 text-slate-700 hover:text-amber-950 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continuar sem cadastro (Modo Visitante)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            No modo visitante, suas leituras e favoritos continuam salvos com segurança no navegador.
          </p>
        </div>

      </div>
    </div>
  );
};
