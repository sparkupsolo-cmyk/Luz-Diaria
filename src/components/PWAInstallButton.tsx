import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'banner' | 'pill';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running inside standalone installed app, hide install CTA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    // If Android/Chromium with native prompt ready, try direct prompt first
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        // If user didn't accept or browser cancelled, open modal with guide
        setIsModalOpen(true);
      }
    } else {
      // For iOS or browsers without native prompt event yet, open instructions modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Instalar aplicativo Luz Diária no celular ou computador"
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80 text-xs font-semibold cursor-pointer transition-all shadow-2xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Instalar App</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3 rounded-2xl bg-linear-to-r from-amber-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200/80 border border-amber-300/80 text-amber-950 transition-all cursor-pointer min-h-[50px] shadow-2xs ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 shadow-xs">
              <Download className="w-5 h-5 text-amber-100" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <span>Instalar Luz Diária no Celular</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-extrabold uppercase tracking-wider">
                  Grátis
                </span>
              </div>
              <div className="text-[11px] text-amber-800/80">
                Acesse direto da tela inicial como aplicativo
              </div>
            </div>
          </div>
          <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
        </button>
      )}

      {variant === 'pill' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-200" />
          <span>Instalar Aplicativo</span>
        </button>
      )}

      {/* Instructions Modal */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
