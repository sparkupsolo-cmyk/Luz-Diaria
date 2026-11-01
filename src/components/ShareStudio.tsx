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

  // Theme palettes and styling definitions - Uplifting, luminous, and full of hope
  const themesConfig: Record<CardVisualTheme, {
    name: string;
    subtitle: string;
    bgColors: string[];
    sunGlowColor: string;
    cardBg: string;
    cardBorder: string;
    brandBadgeBg: string;
    brandBadgeBorder: string;
    brandBadgeText: string;
    refPillBg: string;
    refPillBorder: string;
    refPillText: string;
    accentColor: string;
    verseColor: string;
    subtextColor: string;
    reflectionBoxBg: string;
    reflectionBoxBorder: string;
    footerText: string;
    sparkleColor: string;
  }> = {
    'aurora-dourada': {
      name: 'Amanhecer Radiante',
      subtitle: 'Luz do sol & esperança',
      bgColors: ['#b45309', '#d97706', '#ea580c', '#f59e0b', '#fbbf24'],
      sunGlowColor: 'rgba(254, 243, 199, 0.45)',
      cardBg: 'rgba(255, 255, 255, 0.16)',
      cardBorder: 'rgba(255, 255, 255, 0.45)',
      brandBadgeBg: 'rgba(255, 255, 255, 0.25)',
      brandBadgeBorder: 'rgba(255, 255, 255, 0.50)',
      brandBadgeText: '#ffffff',
      refPillBg: 'rgba(255, 255, 255, 0.28)',
      refPillBorder: 'rgba(255, 255, 255, 0.60)',
      refPillText: '#ffffff',
      accentColor: '#fef08a',
      verseColor: '#ffffff',
      subtextColor: '#fef9c3',
      reflectionBoxBg: 'rgba(0, 0, 0, 0.12)',
      reflectionBoxBorder: 'rgba(255, 255, 255, 0.28)',
      footerText: 'rgba(255, 255, 255, 0.90)',
      sparkleColor: '#ffffff'
    },
    'ceu-celestial': {
      name: 'Céu & Graça Divina',
      subtitle: 'Paz serena & amplitude',
      bgColors: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'],
      sunGlowColor: 'rgba(224, 242, 254, 0.50)',
      cardBg: 'rgba(255, 255, 255, 0.18)',
      cardBorder: 'rgba(255, 255, 255, 0.48)',
      brandBadgeBg: 'rgba(255, 255, 255, 0.28)',
      brandBadgeBorder: 'rgba(255, 255, 255, 0.55)',
      brandBadgeText: '#ffffff',
      refPillBg: 'rgba(255, 255, 255, 0.32)',
      refPillBorder: 'rgba(255, 255, 255, 0.65)',
      refPillText: '#ffffff',
      accentColor: '#ffffff',
      verseColor: '#ffffff',
      subtextColor: '#f0f9ff',
      reflectionBoxBg: 'rgba(2, 44, 75, 0.16)',
      reflectionBoxBorder: 'rgba(255, 255, 255, 0.30)',
      footerText: 'rgba(255, 255, 255, 0.92)',
      sparkleColor: '#ffffff'
    },
    'floresta-serena': {
      name: 'Vida & Pastos Verdes',
      subtitle: 'Renovação & paz (Salmo 23)',
      bgColors: ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'],
      sunGlowColor: 'rgba(236, 253, 245, 0.45)',
      cardBg: 'rgba(255, 255, 255, 0.16)',
      cardBorder: 'rgba(255, 255, 255, 0.45)',
      brandBadgeBg: 'rgba(255, 255, 255, 0.25)',
      brandBadgeBorder: 'rgba(255, 255, 255, 0.50)',
      brandBadgeText: '#ffffff',
      refPillBg: 'rgba(255, 255, 255, 0.28)',
      refPillBorder: 'rgba(255, 255, 255, 0.60)',
      refPillText: '#ffffff',
      accentColor: '#d1fae5',
      verseColor: '#ffffff',
      subtextColor: '#ecfdf5',
      reflectionBoxBg: 'rgba(2, 44, 34, 0.15)',
      reflectionBoxBorder: 'rgba(255, 255, 255, 0.28)',
      footerText: 'rgba(255, 255, 255, 0.88)',
      sparkleColor: '#ffffff'
    },
    'pergaminho-sagrado': {
      name: 'Manhã de Sol (Linho Claro)',
      subtitle: 'Luminoso, acolhedor & limpo',
      bgColors: ['#fffbeb', '#fef3c7', '#fde68a', '#fef3c7'],
      sunGlowColor: 'rgba(245, 158, 11, 0.22)',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      cardBorder: 'rgba(217, 119, 6, 0.35)',
      brandBadgeBg: 'rgba(245, 158, 11, 0.18)',
      brandBadgeBorder: 'rgba(217, 119, 6, 0.35)',
      brandBadgeText: '#92400e',
      refPillBg: 'rgba(217, 119, 6, 0.16)',
      refPillBorder: 'rgba(217, 119, 6, 0.40)',
      refPillText: '#78350f',
      accentColor: '#b45309',
      verseColor: '#451a03',
      subtextColor: '#78350f',
      reflectionBoxBg: 'rgba(254, 243, 199, 0.55)',
      reflectionBoxBorder: 'rgba(217, 119, 6, 0.22)',
      footerText: '#92400e',
      sparkleColor: '#d97706'
    },
    'minimalista-ouro': {
      name: 'Alegria & Alvorecer',
      subtitle: 'Coral vivo & entusiasmo',
      bgColors: ['#c2410c', '#ea580c', '#e11d48', '#f59e0b', '#fbbf24'],
      sunGlowColor: 'rgba(254, 240, 138, 0.42)',
      cardBg: 'rgba(255, 255, 255, 0.16)',
      cardBorder: 'rgba(255, 255, 255, 0.45)',
      brandBadgeBg: 'rgba(255, 255, 255, 0.25)',
      brandBadgeBorder: 'rgba(255, 255, 255, 0.50)',
      brandBadgeText: '#ffffff',
      refPillBg: 'rgba(255, 255, 255, 0.28)',
      refPillBorder: 'rgba(255, 255, 255, 0.58)',
      refPillText: '#ffffff',
      accentColor: '#fef08a',
      verseColor: '#ffffff',
      subtextColor: '#fff7ed',
      reflectionBoxBg: 'rgba(0, 0, 0, 0.12)',
      reflectionBoxBorder: 'rgba(255, 255, 255, 0.28)',
      footerText: 'rgba(255, 255, 255, 0.88)',
      sparkleColor: '#ffffff'
    },
    'noite-estrelada': {
      name: 'Paz Celestial & Estrelas',
      subtitle: 'Azul safira & constelações',
      bgColors: ['#1e1b4b', '#312e81', '#3730a3', '#4f46e5', '#6366f1'],
      sunGlowColor: 'rgba(199, 210, 254, 0.38)',
      cardBg: 'rgba(255, 255, 255, 0.14)',
      cardBorder: 'rgba(255, 255, 255, 0.38)',
      brandBadgeBg: 'rgba(255, 255, 255, 0.22)',
      brandBadgeBorder: 'rgba(255, 255, 255, 0.48)',
      brandBadgeText: '#ffffff',
      refPillBg: 'rgba(255, 255, 255, 0.26)',
      refPillBorder: 'rgba(255, 255, 255, 0.52)',
      refPillText: '#ffffff',
      accentColor: '#fef08a',
      verseColor: '#ffffff',
      subtextColor: '#e0e7ff',
      reflectionBoxBg: 'rgba(15, 23, 42, 0.25)',
      reflectionBoxBorder: 'rgba(255, 255, 255, 0.25)',
      footerText: 'rgba(255, 255, 255, 0.88)',
      sparkleColor: '#fef08a'
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

  // Helper for cross-browser rounded rectangles
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  };

  // Draw card on HTML5 canvas with vibrant, inspiring, and dynamic aesthetics
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getDimensions(selectedFormat);
    canvas.width = width;
    canvas.height = height;

    const theme = themesConfig[selectedTheme];

    // 1. Draw radiant background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    theme.bgColors.forEach((color, i) => {
      grad.addColorStop(i / (theme.bgColors.length - 1), color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Radiant sunburst / morning light flare at top center
    const radialSun = ctx.createRadialGradient(width / 2, height * 0.12, 10, width / 2, height * 0.12, width * 0.65);
    radialSun.addColorStop(0, theme.sunGlowColor);
    radialSun.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radialSun;
    ctx.fillRect(0, 0, width, height);

    // 3. Gentle ambient sparkles to bring life, joy, and inspiration
    const sparkles = [
      { x: width * 0.12, y: height * 0.08, s: width * 0.016, alpha: 0.65 },
      { x: width * 0.88, y: height * 0.09, s: width * 0.014, alpha: 0.70 },
      { x: width * 0.08, y: height * 0.32, s: width * 0.012, alpha: 0.45 },
      { x: width * 0.92, y: height * 0.38, s: width * 0.015, alpha: 0.55 },
      { x: width * 0.14, y: height * 0.88, s: width * 0.013, alpha: 0.50 },
      { x: width * 0.86, y: height * 0.85, s: width * 0.016, alpha: 0.65 },
    ];
    sparkles.forEach(sp => {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = theme.sparkleColor;
      ctx.font = `${Math.round(sp.s)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', sp.x, sp.y);
      ctx.restore();
    });

    // 4. Modern Frosted Glass Card Architecture (No funeral rectangular frames or corner brackets!)
    const cardMargin = width * 0.055;
    const cardY = height * (selectedFormat === 'story' ? 0.045 : selectedFormat === 'feed' ? 0.04 : 0.045);
    const cardW = width - cardMargin * 2;
    const cardH = height - cardY * 2;
    const cardRadius = width * 0.045;

    drawRoundedRect(ctx, cardMargin, cardY, cardW, cardH, cardRadius);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();

    // 5. Header: Floating Brand Pill Badge "☀️ LUZ DIÁRIA"
    const badgeW = width * 0.48;
    const badgeH = height * (selectedFormat === 'story' ? 0.038 : selectedFormat === 'feed' ? 0.050 : 0.062);
    const badgeX = width / 2 - badgeW / 2;
    const badgeY = cardY + height * (selectedFormat === 'story' ? 0.035 : selectedFormat === 'feed' ? 0.032 : 0.035);

    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = theme.brandBadgeBg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.brandBadgeBorder;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandBadgeText;
    ctx.font = `700 ${Math.round(width * 0.024)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '3px';
    ctx.fillText('☀️ LUZ DIÁRIA', width / 2, badgeY + badgeH / 2);

    // Subtitle & Date
    const dateY = badgeY + badgeH + height * (selectedFormat === 'story' ? 0.022 : selectedFormat === 'feed' ? 0.020 : 0.025);
    ctx.fillStyle = theme.subtextColor;
    ctx.font = `500 ${Math.round(width * 0.019)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.fillText(`DEVOCIONAL DIÁRIO • ${devotional.date}`, width / 2, dateY);

    // Helper to calculate wrapped lines for text
    const getWrappedLines = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(currentLine);
          currentLine = words[n];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    // Helper for drawing wrapped text directly
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const lines = getWrappedLines(text, maxWidth);
      let currentY = y;
      for (const line of lines) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
      }
      return currentY;
    };

    // 6. Inspiring "✦ PALAVRA DE HOJE ✦" Section Tag
    const tagY = dateY + height * (selectedFormat === 'story' ? 0.038 : selectedFormat === 'feed' ? 0.032 : 0.035);
    ctx.fillStyle = theme.accentColor;
    ctx.font = `600 ${Math.round(width * 0.020)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '3px';
    ctx.fillText('✦ PALAVRA DE HOJE ✦', width / 2, tagY);

    // 7. Scripture Verse (Warm, inspiring, literary typography in Lora)
    const contentMaxWidth = cardW - width * 0.08;
    const verseFontSize = includeReflectionSnippet
      ? (selectedFormat === 'story' 
          ? Math.round(width * 0.038) 
          : selectedFormat === 'feed' 
          ? Math.round(width * 0.032) 
          : Math.round(width * 0.028))
      : (selectedFormat === 'story' 
          ? Math.round(width * 0.048) 
          : selectedFormat === 'feed' 
          ? Math.round(width * 0.042) 
          : Math.round(width * 0.036));

    const verseLineHeight = Math.round(verseFontSize * 1.45);
    ctx.font = `italic 500 ${verseFontSize}px 'Lora', Georgia, serif`;
    ctx.fillStyle = theme.verseColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const verseStartY = tagY + height * (selectedFormat === 'story' ? 0.028 : selectedFormat === 'feed' ? 0.024 : 0.028);
    const afterVerseY = wrapText(`"${devotional.verse}"`, width / 2, verseStartY, contentMaxWidth, verseLineHeight);

    // 8. Scripture Reference Capsule Chip (Modern rounded pill)
    const refPillText = `📖 ${devotional.reference} (${devotional.version})`;
    ctx.font = `700 ${Math.round(width * 0.022)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '1.5px';
    const refMetrics = ctx.measureText(refPillText);
    const refPillW = Math.max(refMetrics.width + width * 0.08, width * 0.38);
    const refPillH = height * (selectedFormat === 'story' ? 0.036 : selectedFormat === 'feed' ? 0.046 : 0.058);
    const refPillX = width / 2 - refPillW / 2;
    const refPillY = afterVerseY + height * (selectedFormat === 'story' ? 0.020 : selectedFormat === 'feed' ? 0.018 : 0.022);

    drawRoundedRect(ctx, refPillX, refPillY, refPillW, refPillH, refPillH / 2);
    ctx.fillStyle = theme.refPillBg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.refPillBorder;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.refPillText;
    ctx.fillText(refPillText, width / 2, refPillY + refPillH / 2);

    // Footer Position
    const footerY = cardY + cardH - height * (selectedFormat === 'story' ? 0.032 : selectedFormat === 'feed' ? 0.030 : 0.035);

    // 9. Reflection Section (In an uplifting, dedicated frosted sub-card)
    if (includeReflectionSnippet) {
      const refBoxX = cardMargin + width * 0.035;
      const refBoxW = cardW - width * 0.07;
      const refBoxY = refPillY + refPillH + height * (selectedFormat === 'story' ? 0.026 : selectedFormat === 'feed' ? 0.022 : 0.024);
      const refBoxH = footerY - height * 0.025 - refBoxY;

      if (refBoxH > height * 0.12) {
        // Draw modern frosted reflection container
        drawRoundedRect(ctx, refBoxX, refBoxY, refBoxW, refBoxH, width * 0.035);
        ctx.fillStyle = theme.reflectionBoxBg;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme.reflectionBoxBorder;
        ctx.stroke();

        // Reflection Header Label
        const refHeaderY = refBoxY + height * (selectedFormat === 'story' ? 0.024 : selectedFormat === 'feed' ? 0.026 : 0.032);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = theme.accentColor;
        ctx.font = `600 ${Math.round(width * 0.019)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.letterSpacing = '2px';
        ctx.fillText('🌿 REFLEXÃO & ESPERANÇA', width / 2, refHeaderY);

        // Calculate and dynamically scale font size so 100% of reflection fits cleanly
        const reflectionTextStartY = refHeaderY + height * (selectedFormat === 'story' ? 0.022 : selectedFormat === 'feed' ? 0.022 : 0.028);
        const availableReflectionH = (refBoxY + refBoxH) - reflectionTextStartY - height * 0.020;
        const fullReflection = devotional.reflection.trim();
        const refTextMaxWidth = refBoxW - width * 0.06;

        let snippetFontSize = selectedFormat === 'story'
          ? Math.round(width * 0.025)
          : selectedFormat === 'feed'
          ? Math.round(width * 0.022)
          : Math.round(width * 0.019);
        let snippetLineHeight = Math.round(snippetFontSize * 1.48);

        for (let attempt = 0; attempt < 12; attempt++) {
          ctx.font = `400 ${snippetFontSize}px 'Plus Jakarta Sans', sans-serif`;
          const testLines = getWrappedLines(fullReflection, refTextMaxWidth);
          const totalH = testLines.length * snippetLineHeight;
          if (totalH <= availableReflectionH || snippetFontSize <= Math.round(width * 0.014)) {
            break;
          }
          snippetFontSize -= 1;
          snippetLineHeight = Math.round(snippetFontSize * 1.44);
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = theme.subtextColor;
        ctx.font = `400 ${snippetFontSize}px 'Plus Jakarta Sans', sans-serif`;
        wrapText(fullReflection, width / 2, reflectionTextStartY, refTextMaxWidth, snippetLineHeight);
      }
    }

    // 10. Footer Watermark & Blessing
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.footerText;
    ctx.font = `500 ${Math.round(width * 0.021)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.fillText('☀️ Que a paz e a luz de Deus iluminem o seu dia • Luz Diária', width / 2, footerY);
  };

  useEffect(() => {
    drawCard();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        drawCard();
      });
    }
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
                      className="w-7 h-7 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ background: `linear-gradient(135deg, ${item.bgColors[0]}, ${item.bgColors[item.bgColors.length - 1]})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1 block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 block">
                        {item.subtitle}
                      </span>
                    </div>
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
              <span>Incluir texto completo da reflexão além do versículo</span>
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
