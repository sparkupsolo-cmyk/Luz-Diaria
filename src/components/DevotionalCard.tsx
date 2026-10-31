import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Calendar, 
  Tag, 
  Quote, 
  BookMarked,
  MessageCircle,
  Type
} from 'lucide-react';
import { Devotional } from '../types';
import { AudioNarrator } from '../utils/audioNarrator';

interface DevotionalCardProps {
  devotional: Devotional;
  onToggleFavorite: (dev: Devotional) => void;
  isFavorite: boolean;
  onOpenShareModal: () => void;
}

export const DevotionalCard: React.FC<DevotionalCardProps> = ({
  devotional,
  onToggleFavorite,
  isFavorite,
  onOpenShareModal
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    AudioNarrator.setCallback((playing) => {
      setIsPlayingAudio(playing);
    });
    return () => {
      AudioNarrator.stop();
    };
  }, []);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      AudioNarrator.stop();
    } else {
      const fullNarration = `${devotional.title}. Versículo do dia: ${devotional.verse}. ${devotional.reference}. Reflexão: ${devotional.reflection}. Oração: ${devotional.prayer}. Desafio de hoje: ${devotional.actionStep}`;
      AudioNarrator.speak(fullNarration);
    }
  };

  const handleCopyText = async () => {
    const textToCopy = `📖 *${devotional.title}*
✨ _"${devotional.verse}"_ (${devotional.reference})

🌿 *Reflexão:*
${devotional.reflection}

🕊️ *Oração do Dia:*
${devotional.prayer}

🎯 *Aplicação Prática:*
${devotional.actionStep}

📲 Compartilhado via *Luz Diária - Devocionais Bíblicos*`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDirectWhatsApp = () => {
    const text = `📖 *${devotional.title}*
✨ _"${devotional.verse}"_ (${devotional.reference})

🌿 *Reflexão de Hoje:*
${devotional.reflection.slice(0, 320)}...

🕊️ *Oração:*
${devotional.prayer}

📲 Leia completo no app *Luz Diária*`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Text size classes
  const fontStyles = {
    normal: {
      verse: 'text-lg sm:text-xl',
      body: 'text-base sm:text-lg',
      prayer: 'text-sm sm:text-base'
    },
    large: {
      verse: 'text-xl sm:text-2xl',
      body: 'text-lg sm:text-xl',
      prayer: 'text-base sm:text-lg'
    },
    xlarge: {
      verse: 'text-2xl sm:text-3xl',
      body: 'text-xl sm:text-2xl',
      prayer: 'text-lg sm:text-xl'
    }
  }[fontSize];

  return (
    <article className="max-w-3xl mx-auto bg-white rounded-3xl border border-amber-100 shadow-md shadow-amber-950/5 overflow-hidden transition-all duration-300">
      
      {/* Top Banner with Subtle Radiant Gradient */}
      <div className="bg-linear-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-6 sm:px-8 pt-7 pb-6 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-amber-100 border border-white/20">
              <Calendar className="w-3.5 h-3.5" />
              {devotional.date}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/40 text-xs font-medium text-amber-100 border border-amber-300/30">
              <Tag className="w-3 h-3" />
              {devotional.theme}
            </span>
          </div>

          {/* Action Tools: Audio, Text Size, Favorite */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Narrator */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-amber-400 text-amber-950 shadow-md animate-pulse' 
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isPlayingAudio ? 'Pausar leitura em voz alta' : 'Ouvir devocional narrado'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Font Size Toggle */}
            <button
              onClick={() => {
                if (fontSize === 'normal') setFontSize('large');
                else if (fontSize === 'large') setFontSize('xlarge');
                else setFontSize('normal');
              }}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
              title="Ajustar tamanho da fonte"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => onToggleFavorite(devotional)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isFavorite 
                  ? 'bg-rose-500 text-white shadow-xs' 
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Devotional Title */}
        <h2 className="font-heading-cinzel font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight text-amber-50 tracking-wide relative z-10">
          {devotional.title}
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-7">

        {/* Verse Box - Elegant Biblical Parchment Styling */}
        <div className="relative p-6 sm:p-7 rounded-2xl bg-linear-to-br from-amber-50/90 to-orange-50/60 border border-amber-200/80 shadow-xs">
          <Quote className="w-10 h-10 text-amber-300 absolute top-3 right-4 opacity-40 pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <p className={`font-serif-scripture italic font-medium leading-relaxed text-slate-800 ${fontStyles.verse}`}>
              "{devotional.verse}"
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
              <span className="font-heading-cinzel font-bold text-sm sm:text-base text-amber-900 tracking-wider">
                {devotional.reference} <span className="text-xs font-normal text-amber-700">({devotional.version})</span>
              </span>
              <button
                onClick={handleCopyText}
                className="text-xs flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium py-1 px-2.5 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Reflection Body */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-600 rounded-full" />
            <h3 className="font-heading-cinzel font-bold text-amber-950 text-sm tracking-wider uppercase">
              Reflexão Inspiradora
            </h3>
          </div>

          <div className={`text-slate-700 leading-relaxed font-normal space-y-3.5 ${fontStyles.body}`}>
            {devotional.reflection.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="first-letter:text-2xl first-letter:font-serif-scripture first-letter:font-bold first-letter:text-amber-900 first-letter:mr-0.5">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Prayer Section */}
        <div className="p-6 rounded-2xl bg-linear-to-r from-amber-50/70 via-sky-50/40 to-indigo-50/30 border border-sky-100 space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-sky-900">
            <span className="text-lg">🕊️</span>
            <h4 className="font-heading-cinzel font-bold text-sm tracking-wide uppercase text-slate-800">
              Oração para a Manhã
            </h4>
          </div>
          <p className={`font-serif-scripture italic text-slate-700 leading-relaxed ${fontStyles.prayer}`}>
            "{devotional.prayer}"
          </p>
        </div>

        {/* Daily Action Step */}
        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <BookMarked className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
              Aplicação Prática de Hoje
            </h5>
            <p className="text-sm text-emerald-950 leading-relaxed">
              {devotional.actionStep}
            </p>
          </div>
        </div>

        {/* Share & Interact Toolbar */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* WhatsApp Direct Share */}
            <button
              onClick={handleDirectWhatsApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Enviar no WhatsApp</span>
            </button>

            {/* Social Card Studio Button */}
            <button
              onClick={onOpenShareModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium text-sm transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>Criar Cartão / Redes Sociais</span>
            </button>
          </div>

          {/* Daily Shared Word Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Palavra Oficial do Dia • Compartilhada</span>
          </div>

        </div>

      </div>

    </article>
  );
};
