import React, { useState } from 'react';
import { 
  Heart, 
  Trash2, 
  Share2, 
  BookOpen, 
  Quote, 
  ArrowRight,
  Search
} from 'lucide-react';
import { Devotional } from '../types';

interface FavoritesArchiveProps {
  favorites: Devotional[];
  onSelectDevotional: (dev: Devotional) => void;
  onRemoveFavorite: (id: string) => void;
  onShareDevotional: (dev: Devotional) => void;
}

export const FavoritesArchive: React.FC<FavoritesArchiveProps> = ({
  favorites,
  onSelectDevotional,
  onRemoveFavorite,
  onShareDevotional
}) => {
  const [search, setSearch] = useState('');

  const filtered = favorites.filter((item) => {
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>Devocionais Guardados</span>
            </div>
            <h2 className="font-heading-cinzel text-2xl sm:text-3xl font-bold text-amber-950">
              Seus Favoritos
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Coleção de palavras, versículos e orações que falaram fundo ao seu coração.
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold text-amber-900">{favorites.length}</span>
            <span className="text-xs text-slate-500 block">salvos no dispositivo</span>
          </div>
        </div>

        {/* Search */}
        {favorites.length > 0 && (
          <div className="mt-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nos favoritos por versículo, livro ou tema..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* Favorites List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-amber-200/70 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                    {item.theme}
                  </span>
                  <span className="text-[11px] text-slate-400">{item.date}</span>
                </div>

                <h3 className="font-heading-cinzel font-bold text-lg text-slate-900 line-clamp-1">
                  {item.title}
                </h3>

                <p className="font-serif-scripture italic text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 line-clamp-3">
                  "{item.verse}"
                </p>

                <div className="text-xs font-semibold text-amber-900">
                  {item.reference}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => onRemoveFavorite(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remover dos favoritos"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onShareDevotional(item)}
                    className="p-1.5 text-slate-500 hover:text-amber-800 transition-colors cursor-pointer"
                    title="Compartilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectDevotional(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    <span>Ler Completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-amber-200 p-8 space-y-3">
          <Heart className="w-10 h-10 text-amber-300 mx-auto" />
          <h4 className="font-heading-cinzel font-bold text-slate-800 text-lg">
            Nenhum favorito ainda
          </h4>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Ao ler um devocional diário, clique no ícone de coração para salvá-lo aqui e reler sempre que desejar.
          </p>
        </div>
      )}

    </div>
  );
};
