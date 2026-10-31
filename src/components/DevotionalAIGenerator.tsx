import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Heart, 
  BookOpen, 
  RefreshCw, 
  Sun, 
  Feather, 
  CheckCircle2,
  Compass,
  Smile,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { Devotional } from '../types';

interface DevotionalAIGeneratorProps {
  onDevotionalGenerated: (dev: Devotional) => void;
  isGenerating: boolean;
  setIsGenerating: (state: boolean) => void;
}

export const DevotionalAIGenerator: React.FC<DevotionalAIGeneratorProps> = ({
  onDevotionalGenerated,
  isGenerating,
  setIsGenerating
}) => {
  const [toneMode, setToneMode] = useState<'confronting' | 'edifying'>('confronting');
  const [selectedTheme, setSelectedTheme] = useState<string>('Tomar a Cruz Diária e Morrer para Si');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [mood, setMood] = useState<string>('Quebrantado');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confrontationalThemes = [
    { 
      title: 'Tomar a Cruz Diária e Morrer para Si', 
      icon: '✝️', 
      desc: 'O discipulado radical que exige a renúncia do próprio ego e o senhorio de Cristo.' 
    },
    { 
      title: 'A Mentira de "Seguir o Próprio Coração"', 
      icon: '⚔️', 
      desc: 'Desmascarando a ilusão de justificar pecados com sentimentos e emoções caídas.' 
    },
    { 
      title: 'Deus Resiste aos Soberbos', 
      icon: '🛡️', 
      desc: 'O perigo mortal do orgulho, da autojustificação e a necessidade de humilhação no pó.' 
    },
    { 
      title: 'A Farsa da Religiosidade Sem Obediência', 
      icon: '⚖️', 
      desc: 'O alerta solene de Mateus 7:21: santidade real em secreto vs. fachada exterior.' 
    },
    { 
      title: 'De Deus Não se Zomba: A Lei da Semeadura', 
      icon: '🌱', 
      desc: 'As consequências inevitáveis de brincar com o pecado e alimentar a carne.' 
    },
    { 
      title: 'O Perigo do Evangelho Fácil e Sem Cruz', 
      icon: '🔥', 
      desc: 'Confrontando a falsa teologia de conveniência que massageia a vaidade humana.' 
    },
    { 
      title: 'Arrependimento e Quebrantamento Sincero', 
      icon: '🕊️', 
      desc: 'A dor segundo Deus que gera tristeza pelo pecado e volta real ao Pai.' 
    },
    { 
      title: 'Desmascarando a Autossuficiência e o Controle', 
      icon: '⛓️', 
      desc: 'Reconhecer que somos pó e que o controle da vida nunca nos pertenceu.' 
    }
  ];

  const edifyingThemes = [
    { title: 'Paz em Meio à Tempestade', icon: '🕊️', desc: 'Descanso na soberania de Deus diante do caos terreno.' },
    { title: 'Sabedoria para Tomar Decisões', icon: '🧭', desc: 'Direção clara e discernimento bíblico nos caminhos.' },
    { title: 'Gratidão & Reconhecimento da Graça', icon: '☀️', desc: 'Reconhecer que tudo o que temos vem da pura misericórdia divina.' },
    { title: 'Família e Aliança no Senhor', icon: '🏡', desc: 'Amor sacrificial, paciência, diálogo e proteção do lar.' }
  ];

  const moodOptions = [
    { label: 'Quebrantado', emoji: '🧎' },
    { label: 'Em Luta Contra o Pecado', emoji: '⚔️' },
    { label: 'Necessitado de Correção', emoji: '📖' },
    { label: 'Arrependido', emoji: '💧' },
    { label: 'Cansado de Si Mesmo', emoji: '🥀' },
    { label: 'Desejoso de Santidade', emoji: '✨' }
  ];

  const activeThemesList = toneMode === 'confronting' ? confrontationalThemes : edifyingThemes;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/devotional/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme: selectedTheme,
          customPrompt: customPrompt.trim() || undefined,
          mood: mood,
          toneMode: toneMode
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o servidor');
      }

      const data = await response.json();
      if (data.success && data.devotional) {
        onDevotionalGenerated(data.devotional);
      } else {
        throw new Error(data.error || 'Erro ao gerar devocional');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Não foi possível gerar no momento. Mas carregamos uma palavra contundente das Escrituras para você!');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-linear-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-amber-900/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs border border-amber-400/20">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Palavra Viva & Espada de Dois Gumes</span>
          </div>
          <h2 className="font-heading-cinzel text-2xl sm:text-3xl font-bold tracking-wide">
            Palavra para o seu Coração
          </h2>
          <p className="text-amber-100/80 text-sm max-w-xl">
            Devocionais fundamentados na verdade nua das Escrituras. Sem massagens no ego humano, confrontando o pecado, desmascarando a soberba e apontando para a suficiência da cruz de Cristo.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-xs space-y-6">
        
        {/* Tone Selector: Confronting vs Edifying */}
        <div className="space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Abordagem Teológica Desejada</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setToneMode('confronting');
                setSelectedTheme('Tomar a Cruz Diária e Morrer para Si');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                toneMode === 'confronting'
                  ? 'bg-amber-950 text-white border-amber-900 shadow-md ring-2 ring-amber-600'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-amber-700'
              }`}
            >
              <div className="text-xl shrink-0 mt-0.5">⚔️</div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm">
                  Confronto Bíblico & Quebrantamento
                </h4>
                <p className={`text-[11px] mt-0.5 ${toneMode === 'confronting' ? 'text-amber-200' : 'text-stone-500'}`}>
                  Corta o ego, desafia a carne e chama ao arrependimento radical sem panos quentes.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setToneMode('edifying');
                setSelectedTheme('Paz em Meio à Tempestade');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                toneMode === 'edifying'
                  ? 'bg-amber-950 text-white border-amber-900 shadow-md ring-2 ring-amber-600'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-amber-700'
              }`}
            >
              <div className="text-xl shrink-0 mt-0.5">🌿</div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm">
                  Edificação Sóbria & Sabedoria
                </h4>
                <p className={`text-[11px] mt-0.5 ${toneMode === 'edifying' ? 'text-amber-200' : 'text-stone-500'}`}>
                  Encorajamento focado na graça e na soberania de Deus, sem autoajuda humanista.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* State of Mind / Attitude */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-amber-600" />
            <span>Como você se apresenta diante de Deus hoje?</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => setMood(item.label)}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  mood === item.label
                    ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Themes Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Selecione a Linha de Confronto ou Reflexão</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeThemesList.map((item) => {
              const isSelected = selectedTheme === item.title;
              return (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => setSelectedTheme(item.title)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-700 ring-2 ring-amber-600/50 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-amber-300'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Personal Prayer / Situation */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <Feather className="w-4 h-4 text-amber-600" />
            <span>Situação Específica que Precisa ser Confrontada pela Palavra (Opcional)</span>
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            placeholder="Exemplo: Estou enfrentando orgulho, dificuldade de perdoar uma pessoa e justifiquei minha falta de oração com desculpas de cansaço. Preciso ser confrontado..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 placeholder:text-slate-400"
          />
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-linear-to-r from-amber-800 to-stone-900 hover:from-amber-900 hover:to-black text-white font-bold text-base shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-amber-200" />
              <span>Sondando as Escrituras para a sua Alma...</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5 text-orange-400" />
              <span>{toneMode === 'confronting' ? 'Confrontar meu Ego com a Verdade Bíblica' : 'Receber Palavra para o Coração'}</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
};
