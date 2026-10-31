import React from 'react';
import { 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Download, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl border border-amber-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header with Luz Diária Brand Identity */}
        <div className="relative px-6 pt-6 pb-5 bg-linear-to-br from-amber-700 via-amber-600 to-amber-800 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Logo Emblem */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/40 p-1.5 shadow-lg shadow-black/20 mb-3 flex items-center justify-center">
            <img 
              src="/icon.svg" 
              alt="Luz Diária" 
              className="w-full h-full rounded-xl object-contain shadow-xs"
            />
          </div>

          <h3 className="font-heading-cinzel font-bold text-xl sm:text-2xl text-amber-50">
            Luz Diária
          </h3>
          <p className="text-xs text-amber-200/90 font-medium mt-0.5 tracking-wide">
            Devocional Diário & Leitura Bíblica
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-amber-900/40 border border-amber-400/30 text-amber-200 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Aplicativo Leve, Rápido e 100% Gratuito</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">

          {isInstalled ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-slate-800">
                Aplicativo Já Instalado!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                O Luz Diária já está na sua tela inicial pronto para ser aberto como aplicativo nativo.
              </p>
              <button
                onClick={onClose}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Continuar Lendo
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
                <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Como instalar no iPhone ou iPad (Safari):</span>
              </div>

              <ol className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-amber-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      Toque no botão Compartilhar
                      <Share className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Localizado na barra inferior do navegador Safari.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-amber-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      Selecione "Adicionar à Tela de Início"
                      <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline ml-1" />
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Role o menu para baixo até encontrar o ícone de adicionar.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-amber-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      Confirme em "Adicionar"
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      No canto superior direito da tela do iPhone.
                    </p>
                  </div>
                </li>
              </ol>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Entendi, vou adicionar
              </button>
            </div>
          ) : (
            /* Android / Chrome Flow */
            <div className="space-y-3.5 text-center">
              <p className="text-xs text-slate-600 leading-relaxed">
                Instale o Luz Diária para acessar seus devocionais em tela cheia, com carregamento instantâneo e sem precisar digitar o endereço.
              </p>

              {isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-200" />
                  <span>Instalar no Celular Agora</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs space-y-2">
                    <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-700" />
                      Como instalar no Android:
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      1. Toque no menu de <strong>três pontos (⋮)</strong> no topo do navegador Chrome.<br />
                      2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.<br />
                      3. Confirme para ter o Luz Diária como aplicativo nativo.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ocupa menos de 1 MB
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sem anúncios
                </span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
