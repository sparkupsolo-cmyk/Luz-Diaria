import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Sparkles, 
  Palette, 
  Smartphone, 
  Square, 
  Layout, 
  RefreshCw 
} from 'lucide-react';
import { Devotional, CardVisualTheme, CardFormat } from '../types';

interface ShareStudioProps {
  devotional: Devotional;
  onClose?: () => void;
}

export const ShareStudio: React.FC<ShareStudioProps> = ({ devotional, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>('story');
  const [selectedTheme, setSelectedTheme] = useState<CardVisualTheme>('aurora-dourada');
  const [includeReflectionSnippet, setIncludeReflectionSnippet] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Theme palettes and styling definitions
  const themesConfig: Record<CardVisualTheme, {
    name: string;
    bgColors: string[];
    accentColor: string;
    textColor: string;
    subtextColor: string;
    borderColor: string;
  }> = {
    'aurora-dourada': {
      name: 'Amanhecer Dourado',
      bgColors: ['#78350f', '#b45309', '#d97706', '#f59e0b'],
      accentColor: '#fef3c7',
      textColor: '#ffffff',
      subtextColor: '#fde68a',
      borderColor: 'rgba(254, 243, 199, 0.3)'
    },
    'ceu-celestial': {
      name: 'Céu Celestial',
      bgColors: ['#0f172a', '#1e293b', '#0369a1', '#38bdf8'],
      accentColor: '#bae6fd',
      textColor: '#ffffff',
      subtextColor: '#e0f2fe',
      borderColor: 'rgba(186, 230, 253, 0.3)'
    },
    'noite-estrelada': {
      name: 'Noite Sagrada',
      bgColors: ['#09090b', '#18181b', '#312e81', '#4c1d95'],
      accentColor: '#e9d5ff',
      textColor: '#ffffff',
      subtextColor: '#c4b5fd',
      borderColor: 'rgba(233, 213, 255, 0.3)'
    },
    'pergaminho-sagrado': {
      name: 'Pergaminho Rústico',
      bgColors: ['#fef3c7', '#fde68a', '#f5d082', '#ebd197'],
      accentColor: '#78350f',
      textColor: '#451a03',
      subtextColor: '#78350f',
      borderColor: 'rgba(120, 53, 15, 0.25)'
    },
    'floresta-serena': {
      name: 'Paz & Esmeralda',
      bgColors: ['#064e3b', '#065f46', '#047857', '#10b981'],
      accentColor: '#a7f3d0',
      textColor: '#ffffff',
      subtextColor: '#d1fae5',
      borderColor: 'rgba(167, 243, 208, 0.3)'
    },
    'minimalista-ouro': {
      name: 'Elegância Minimalista',
      bgColors: ['#1c1917', '#292524', '#44403c', '#1c1917'],
      accentColor: '#facc15',
      textColor: '#ffffff',
      subtextColor: '#fde047',
      borderColor: 'rgba(250, 204, 21, 0.35)'
    }
  };

  // Dimensions based on format
  const getDimensions = (format: CardFormat) => {
    switch (format) {
      case 'story':
        return { width: 1080, height: 1920 }; // 9:16
      case 'feed':
        return { width: 1080, height: 1080 }; // 1:1
      case 'compact':
        return { width: 1200, height: 800 };  // Landscape / card
    }
  };

  // Draw card on HTML5 canvas
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getDimensions(selectedFormat);
    canvas.width = width;
    canvas.height = height;

    const theme = themesConfig[selectedTheme];

    // 1. Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    theme.bgColors.forEach((color, i) => {
      grad.addColorStop(i / (theme.bgColors.length - 1), color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle radial light glow in the top center
    const radial = ctx.createRadialGradient(width / 2, height * 0.25, 50, width / 2, height * 0.25, width * 0.7);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    radial.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw refined frame border
    const margin = width * 0.06;
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    // Subtle inner corner accents
    const cornerSize = width * 0.03;
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.accentColor;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerSize, margin);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin, height - margin - cornerSize);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin + cornerSize, height - margin);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin - cornerSize);
    ctx.stroke();

    // 3. Header badge: "LUZ DIÁRIA • DEVOCIONAL"
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.accentColor;
    ctx.font = `600 ${Math.round(width * 0.026)}px 'Cinzel', serif`;
    ctx.letterSpacing = '4px';
    ctx.fillText('✦ LUZ DIÁRIA • DEVOCIONAL ✦', width / 2, margin + height * 0.07);

    // Date
    ctx.fillStyle = theme.subtextColor;
    ctx.font = `400 ${Math.round(width * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(devotional.date, width / 2, margin + height * 0.095);

    // Decorative quote mark
    ctx.fillStyle = theme.accentColor;
    ctx.globalAlpha = 0.4;
    ctx.font = `italic ${Math.round(width * 0.13)}px 'Lora', serif`;
    const quoteY = selectedFormat === 'story' ? height * 0.28 : height * 0.26;
    ctx.fillText('“', width / 2, quoteY);
    ctx.globalAlpha = 1.0;

    // Helper for wrapping text
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, currentY);
      return currentY + lineHeight;
    };

    // 4. Scripture Verse
    ctx.fillStyle = theme.textColor;
    const verseFontSize = selectedFormat === 'story' 
      ? Math.round(width * 0.046) 
      : selectedFormat === 'feed' 
      ? Math.round(width * 0.044) 
      : Math.round(width * 0.038);
    
    ctx.font = `italic 500 ${verseFontSize}px 'Lora', Georgia, serif`;
    const contentMaxWidth = width - margin * 3.5;
    const verseStartY = selectedFormat === 'story' ? height * 0.33 : height * 0.31;
    const verseLineHeight = verseFontSize * 1.5;

    const afterVerseY = wrapText(`"${devotional.verse}"`, width / 2, verseStartY, contentMaxWidth, verseLineHeight);

    // 5. Reference
    ctx.fillStyle = theme.accentColor;
    const refFontSize = Math.round(width * 0.032);
    ctx.font = `700 ${refFontSize}px 'Cinzel', serif`;
    ctx.letterSpacing = '2px';
    const refY = afterVerseY + height * 0.02;
    ctx.fillText(`— ${devotional.reference} (${devotional.version}) —`, width / 2, refY);

    // 6. Reflection snippet (if requested and fits)
    if (includeReflectionSnippet) {
      const snippetY = refY + height * 0.04;
      
      // Divider line
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - width * 0.15, refY + height * 0.02);
      ctx.lineTo(width / 2 + width * 0.15, refY + height * 0.02);
      ctx.stroke();

      ctx.fillStyle = theme.subtextColor;
      const snippetFontSize = Math.round(width * 0.027);
      ctx.font = `400 ${snippetFontSize}px 'Plus Jakarta Sans', sans-serif`;
      
      const snippet = devotional.reflection.length > 220 
        ? devotional.reflection.slice(0, 220).trim() + '...' 
        : devotional.reflection;

      wrapText(snippet, width / 2, snippetY, contentMaxWidth * 0.9, snippetFontSize * 1.5);
    }

    // 7. Footer Watermark / Signature
    ctx.fillStyle = theme.accentColor;
    ctx.font = `500 ${Math.round(width * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '1px';
    const footerY = height - margin - height * 0.04;
    ctx.fillText('Compartilhado com amor • Luz Diária Devocionais', width / 2, footerY);
  };

  useEffect(() => {
    drawCard();
  }, [selectedFormat, selectedTheme, includeReflectionSnippet, devotional]);

  // Handle Download Image
  const handleDownload = () => {
    setIsGeneratingImage(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `luz-diaria-${devotional.reference.replace(/\s+/g, '-').toLowerCase()}-${selectedFormat}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Error downloading card image:', e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle Native Share or WhatsApp
  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const shareText = `📖 *${devotional.title}*\n"${devotional.verse}" (${devotional.reference})\n\n🕊️ *Luz Diária Devocional:* ${devotional.reflection.slice(0, 160)}...`;

    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'devocional-luz-diaria.png', { type: 'image/png' });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: devotional.title,
              text: shareText
            });
            return;
          }
        } catch (e) {
          console.log('File share fallback:', e);
        }

        // Text fallback
        try {
          await navigator.share({
            title: devotional.title,
            text: shareText
          });
        } catch (err) {
          console.log(err);
        }
      });
    } else {
      handleWhatsAppShare();
    }
  };

  // Direct WhatsApp Share
  const handleWhatsAppShare = () => {
    const message = `📖 *${devotional.title}*
✨ _"${devotional.verse}"_
📍 *${devotional.reference} (${devotional.version})*

🌿 *Reflexão:*
${devotional.reflection}

🕊️ *Oração da Manhã:*
_${devotional.prayer}_

🎯 *Desafio do Dia:*
${devotional.actionStep}

✨ Compartilhado pelo app *Luz Diária*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Copy text
  const handleCopyFormattedText = async () => {
    const message = `📖 *${devotional.title}*
✨ _"${devotional.verse}"_ (${devotional.reference})

🌿 *Reflexão de Hoje:*
${devotional.reflection}

🕊️ *Oração:*
${devotional.prayer}

🎯 *Aplicação Prática:*
${devotional.actionStep}

📲 Compartilhado via *Luz Diária*`;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Studio Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
              <Share2 className="w-3.5 h-3.5" />
              <span>Estúdio de Compartilhamento</span>
            </div>
            <h2 className="font-heading-cinzel text-2xl sm:text-3xl font-bold text-amber-950">
              Criar Cartão & Compartilhar
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Gere cartões visuais para Instagram Stories, WhatsApp Status e envie mensagens formatadas com versículo e reflexão.
            </p>
          </div>

          {/* Quick WhatsApp Action */}
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Compartilhar no WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Visual Customizer Controls */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Format Selector */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200/70 shadow-xs space-y-3">
            <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-amber-600" />
              <span>Formato do Cartão</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedFormat('story')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedFormat === 'story'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">Stories / Status</span>
                <span className="text-[10px] opacity-80">(9:16)</span>
              </button>

              <button
                onClick={() => setSelectedFormat('feed')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedFormat === 'feed'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <Square className="w-5 h-5" />
                <span className="text-xs">Feed Quadrado</span>
                <span className="text-[10px] opacity-80">(1:1)</span>
              </button>

              <button
                onClick={() => setSelectedFormat('compact')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedFormat === 'compact'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <Layout className="w-5 h-5" />
                <span className="text-xs">Horizontal</span>
                <span className="text-[10px] opacity-80">(4:3)</span>
              </button>
            </div>
          </div>

          {/* Theme Palette Selector */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200/70 shadow-xs space-y-3">
            <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>Estilo Visual & Fundo</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(themesConfig).map(([key, item]) => {
                const isSelected = selectedTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key as CardVisualTheme)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected 
                        ? 'border-amber-600 ring-2 ring-amber-400 bg-amber-50/50' 
                        : 'border-slate-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ background: `linear-gradient(135deg, ${item.bgColors[0]}, ${item.bgColors[item.bgColors.length - 1]})` }}
                    />
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Content Toggles */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200/70 shadow-xs space-y-3">
            <label className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Opções de Texto no Cartão
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeReflectionSnippet}
                onChange={(e) => setIncludeReflectionSnippet(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-md border-slate-300 focus:ring-amber-500"
              />
              <span>Incluir trecho da reflexão além do versículo</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleDownload}
              disabled={isGeneratingImage}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Cartão em Alta Resolução (PNG)</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-semibold text-sm transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>Compartilhar via Celular / Aplicativos</span>
            </button>

            <button
              onClick={handleCopyFormattedText}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Mensagem Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar Mensagem Formatada</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Live Card Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Pré-visualização ao vivo do cartão</span>
          </div>

          <div className="w-full max-w-[420px] bg-slate-900/5 rounded-3xl p-3 border border-slate-200/60 shadow-inner flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className={`max-w-full rounded-2xl shadow-xl transition-all duration-300 ${
                selectedFormat === 'story'
                  ? 'max-h-[580px] aspect-9/16'
                  : selectedFormat === 'feed'
                  ? 'max-h-[460px] aspect-square'
                  : 'max-h-[360px] aspect-3/2'
              }`}
            />
          </div>

          <div className="text-center text-xs text-slate-500 mt-4 max-w-sm">
            💡 Dica: Salve a imagem e poste nos Stories do Instagram, Status do WhatsApp ou envie diretamente no grupo da igreja ou família!
          </div>
        </div>

      </div>

    </div>
  );
};
