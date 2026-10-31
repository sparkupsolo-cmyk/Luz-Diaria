import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Search, 
  Calendar, 
  ArrowRight, 
  Share2, 
  Heart, 
  Sparkles,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { Devotional } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserDevotionalHistoryFromCloud } from '../lib/supabase';

interface DevotionalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDevotional: (dev: Devotional) => void;
  onShareDevotional: (dev: Devotional) => void;
}

export const DevotionalHistoryModal: React.FC<DevotionalHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDevotional,
  onShareDevotional
}) => {
  const { user } = useAuth();
  const [historyList, setHistoryList] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      setLoading(true);
      fetchUserDevotionalHistoryFromCloud(user.id)
        .then((data) => {
          setHistoryList(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const filtered = historyList.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.verse.toLowerCase().includes(q) ||
      item.reference.toLowerCase().includes(q) ||
      item.theme.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-600/90 flex items-center justify-center text-white border border-white/20">
              <History className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-amber-200 tracking-wider">
                Nuvem Pessoal
              </span>
              <h3 className="font-heading-cinzel font-bold text-xl text-white">
                Histórico de Devocionais
              </h3>
            </div>
          </div>
          <p className="text-xs text-amber-100/90">
            Todas as palavras e reflexões geradas na sua conta salvas no Supabase.
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no histórico por versículo, tema ou palavra..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
              <p className="text-xs">Carregando histórico do Supabase...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-amber-200/70 bg-white hover:border-amber-400 transition-all shadow-2xs space-y-2.5 text-left"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                    {item.theme}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                </div>

                <h4 className="font-heading-cinzel font-bold text-sm text-slate-900">
                  {item.title}
                </h4>

                <p className="font-serif-scripture italic text-xs text-slate-700 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60 line-clamp-2">
                  "{item.verse}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-amber-900">
                    {item.reference}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onShareDevotional(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Compartilhar"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectDevotional(item);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      <span>Ler</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <h5 className="font-heading-cinzel font-bold text-slate-700 text-sm">
                Nenhum devocional no histórico
              </h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quando você gera devocionais enquanto está conectado à sua conta, eles ficam guardados aqui para leitura futura.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-amber-900 font-medium cursor-pointer"
          >
            Fechar Histórico
          </button>
        </div>

      </div>
    </div>
  );
};
