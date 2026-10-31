import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  QrCode, 
  Sparkles, 
  HeartHandshake
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Resolve current app URL dynamically
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://luzdiaria.app';

  const shareTitle = 'Luz Diária - Devocional Bíblico Diário';
  const shareText = `🕊️ *Luz Diária - Devocional Bíblico Diário*
Estou usando o aplicativo Luz Diária para começar minhas manhãs na presença de Deus, com um devocional compartilhado e acompanhamento de leitura bíblica.

É 100% gratuito, sem anúncios e muito leve!
Acesse e instale no seu celular:
${appUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent('🕊️ Luz Diária - Devocional Bíblico Diário. Gratuito e edificante:')}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: 'Conheça o Luz Diária: devocionais bíblicos diários e progresso da Bíblia.',
          url: appUrl,
        });
      } catch (err) {
        // User cancelled or aborted
        console.debug('Compartilhamento nativo cancelado ou ignorado:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(appUrl)}&color=78-35-15&bgcolor=253-251-247`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl border border-amber-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header with App Identity */}
        <div className="relative px-6 pt-6 pb-5 bg-linear-to-br from-amber-700 via-amber-600 to-amber-800 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/40 p-1 shadow-lg shadow-black/20 mb-3 flex items-center justify-center">
            <img 
              src="/icon.svg" 
              alt="Luz Diária" 
              className="w-full h-full rounded-xl object-contain"
            />
          </div>

          <h3 className="font-heading-cinzel font-bold text-xl sm:text-2xl text-amber-50">
            Compartilhe o Luz Diária
          </h3>
          <p className="text-xs text-amber-100/90 font-medium mt-1 tracking-wide">
            Abençoe amigos, familiares e sua igreja com a Palavra de Deus
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-amber-900/40 border border-amber-400/30 text-amber-200 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Gratuito • Rápido • Funciona em qualquer celular</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Enviar no WhatsApp</span>
            </button>

            {/* Native Share / Outras Opções */}
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Mais Opções...</span>
              </button>
            ) : (
              <button
                onClick={handleShareTelegram}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar no Telegram</span>
              </button>
            )}
          </div>

          {/* Copy Direct Link Section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">
              Link direto do aplicativo:
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 bg-transparent px-2.5 text-xs text-slate-700 font-mono focus:outline-hidden select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-700 font-medium pl-1 animate-in fade-in">
                ✓ Link copiado para a área de transferência!
              </p>
            )}
          </div>

          {/* Toggle QR Code for in-person sharing */}
          <div className="pt-2 border-t border-amber-200/70">
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/70 text-amber-900 border border-amber-200/80 text-xs font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-700" />
                <span>Mostrar QR Code para escanear com a câmera</span>
              </div>
              <span className="text-[11px] text-amber-700 font-bold">
                {showQR ? 'Ocultar' : 'Exibir'}
              </span>
            </button>

            {showQR && (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-amber-200 text-center animate-in fade-in duration-200 space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  Aponte a câmera do celular para abrir o aplicativo instantaneamente:
                </p>
                <div className="mx-auto w-40 h-40 bg-amber-50/50 p-2 rounded-xl border border-amber-100 flex items-center justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Luz Diária"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-amber-800 font-mono truncate">
                  {appUrl}
                </p>
              </div>
            )}
          </div>

          {/* Fellowship Message */}
          <div className="p-3 bg-amber-100/60 rounded-2xl border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-950">
            <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              "Ide por todo o mundo e pregai o evangelho a toda criatura." Compartilhar a Palavra edifica e transforma vidas!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>

        </div>

      </div>
    </div>
  );
};
