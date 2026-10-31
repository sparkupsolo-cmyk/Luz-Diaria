import React, { useState } from 'react';
import { Share2, Heart } from 'lucide-react';
import { ShareAppModal } from './ShareAppModal';

interface ShareAppButtonProps {
  variant?: 'header' | 'drawer' | 'card-banner' | 'pill' | 'footer';
  className?: string;
}

export const ShareAppButton: React.FC<ShareAppButtonProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    // If mobile device with native share, try triggering directly or open modal
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://luzdiaria.app';
    if (typeof navigator !== 'undefined' && 'share' in navigator && window.innerWidth < 640 && variant !== 'header') {
      try {
        await navigator.share({
          title: 'Luz Diária - Devocional Bíblico Diário',
          text: 'Conheça o Luz Diária: devocionais bíblicos diários edificantes e acompanhamento de leitura bíblica gratuito!',
          url: appUrl,
        });
        return;
      } catch {
        // Fallback to opening modal if share was dismissed or unsupported
      }
    }
    setIsModalOpen(true);
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Compartilhar o aplicativo Luz Diária com amigos"
          className={`hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80 text-xs font-semibold cursor-pointer transition-all shadow-2xs ${className}`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="hidden sm:inline">Compartilhar App</span>
          <span className="sm:hidden">Indicar</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-amber-50/90 border border-amber-200/90 text-slate-800 transition-all cursor-pointer min-h-[50px] shadow-2xs ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-amber-950 flex items-center gap-1.5">
                <span>Compartilhar o Aplicativo</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Convide amigos e familiares para ler o devocional
              </div>
            </div>
          </div>
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 shrink-0" />
        </button>
      )}

      {variant === 'card-banner' && (
        <div className={`p-4 rounded-2xl bg-linear-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Share2 className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-amber-950 leading-tight">
                Gostou do devocional de hoje? Compartilhe o Luz Diária!
              </h5>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Envie o aplicativo para seu grupo de oração, família e amigos
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-200" />
            <span>Compartilhar App</span>
          </button>
        </div>
      )}

      {variant === 'pill' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors ${className}`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-200" />
          <span>Compartilhar Luz Diária</span>
        </button>
      )}

      {variant === 'footer' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 font-semibold cursor-pointer underline underline-offset-2 transition-colors ${className}`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Indicar o aplicativo</span>
        </button>
      )}

      {/* Share Modal Dialog */}
      <ShareAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
