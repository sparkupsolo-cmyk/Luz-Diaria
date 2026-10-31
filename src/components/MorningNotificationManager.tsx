import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Sun,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { NotificationConfig, Devotional } from '../types';

interface MorningNotificationManagerProps {
  config: NotificationConfig;
  onUpdateConfig: (newConfig: NotificationConfig) => void;
  todayDevotional: Devotional;
}

export const MorningNotificationManager: React.FC<MorningNotificationManagerProps> = ({
  config,
  onUpdateConfig,
  todayDevotional
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testAlertModal, setTestAlertModal] = useState<boolean>(false);
  const [lastTestedVerse, setLastTestedVerse] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          onUpdateConfig({ ...config, enabled: true });
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    } else {
      alert('Seu navegador atual não suporta notificações web nativas, mas o alerta dentro do app continuará funcionando!');
    }
  };

  const playSoftChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      // AudioContext not allowed or unsupported
    }
  };

  // Test Notification Trigger
  const triggerTestNotification = () => {
    if (config.soundAlert) {
      playSoftChime();
    }

    const title = `🌅 Luz Diária • Bom dia!`;
    const body = `"${todayDevotional.verse.slice(0, 90)}..." — ${todayDevotional.reference}\nToque para ler a reflexão de hoje.`;

    // Try native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.log('Native notification error:', e);
      }
    }

    // Show in-app interactive preview simulation
    setLastTestedVerse(`"${todayDevotional.verse}" — ${todayDevotional.reference}`);
    setTestAlertModal(true);
  };

  const morningTimes = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];
  const themeTones = [
    'Inspiração & Força',
    'Paz em Meio à Ansiedade',
    'Gratidão & Louvor',
    'Sabedoria & Propósito',
    'Superação e Coragem'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-amber-200 text-xs font-semibold backdrop-blur-xs">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Despertar Espiritual</span>
            </div>
            <h2 className="font-heading-cinzel text-2xl sm:text-3xl font-bold tracking-wide">
              Notificações Matinais
            </h2>
            <p className="text-amber-100/90 text-sm max-w-lg">
              Receba todas as manhãs uma mensagem edificante com o versículo do dia e uma reflexão inspiradora gerada sob medida para o seu coração.
            </p>
          </div>

          <button
            onClick={triggerTestNotification}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm shadow-md hover:scale-102 transition-all cursor-pointer shrink-0"
          >
            <BellRing className="w-4 h-4 text-amber-950" />
            <span>Testar Notificação Agora</span>
          </button>
        </div>
      </div>

      {/* Permission Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl ${permissionState === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Permissão de Notificação no Navegador
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {permissionState === 'granted'
                ? 'Notificações ativadas no seu dispositivo! Você receberá os versículos pela manhã.'
                : permissionState === 'denied'
                ? 'Notificações foram bloqueadas no navegador. Para reativar, clique no cadeado da barra de endereço.'
                : 'Permita as notificações para que o app envie a palavra do dia assim que o dia amanhecer.'}
            </p>
          </div>
        </div>

        {permissionState !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            Ativar Notificações
          </button>
        )}
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-xs space-y-6">
        
        {/* Toggle On/Off */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              Lembrete Diário Ativado
            </h4>
            <p className="text-xs text-slate-500">
              Lembrete matinal automático com versículo e reflexão
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onUpdateConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {/* Delivery Time Selection */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Horário de Envio pela Manhã</span>
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {morningTimes.map((time) => (
              <button
                key={time}
                onClick={() => onUpdateConfig({ ...config, time })}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  config.time === time
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Spiritual Tone / Theme Preference */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Tom Espiritual Preferido para as Manhãs</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {themeTones.map((tone) => (
              <button
                key={tone}
                onClick={() => onUpdateConfig({ ...config, themePreference: tone })}
                className={`p-3 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                  config.themePreference === tone
                    ? 'bg-amber-50/70 border-amber-600 text-amber-950 font-bold ring-1 ring-amber-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                }`}
              >
                <span>{tone}</span>
                {config.themePreference === tone && (
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Chime Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-sm text-slate-900">
                Sinal Sonoro Suave
              </h5>
              <p className="text-xs text-slate-500">
                Tocar sino celestial harmonioso ao entregar o devocional
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.soundAlert}
            onChange={(e) => onUpdateConfig({ ...config, soundAlert: e.target.checked })}
            className="w-4 h-4 text-amber-600 rounded-md border-slate-300 focus:ring-amber-500 cursor-pointer"
          />
        </div>

      </div>

      {/* In-App Morning Alert Simulation Modal */}
      {testAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  🌅
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700">
                    Notificação das {config.time}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">
                    Luz Diária • Mensagem Matinal
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setTestAlertModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
              <div className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Versículo de Hoje:</span>
              </div>
              <p className="font-serif-scripture italic text-sm text-slate-800 leading-relaxed">
                {lastTestedVerse}
              </p>
              <p className="text-xs text-slate-600 pt-1 border-t border-amber-200/50">
                "{todayDevotional.reflection.slice(0, 140)}..."
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400">
                Assim você acordará todas as manhãs!
              </span>
              <button
                onClick={() => setTestAlertModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
