import React from 'react';
import { SunMedium, Loader2 } from 'lucide-react';

interface DevotionalSkeletonProps {
  error?: string | null;
  onRetry?: () => void;
}

export const DevotionalSkeleton: React.FC<DevotionalSkeletonProps> = ({ error, onRetry }) => {
  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-amber-200 p-8 sm:p-12 text-center shadow-md shadow-amber-950/5 space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <SunMedium className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="font-heading-cinzel font-bold text-xl sm:text-2xl text-amber-950">
          Sincronização do Devocional Diário
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {error || 'Não foi possível carregar o devocional oficial de hoje do Supabase. Verifique sua conexão com a internet.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Tentar Novamente</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-amber-100 shadow-md shadow-amber-950/5 overflow-hidden animate-pulse">
      
      {/* Top Banner Skeleton */}
      <div className="bg-linear-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-6 sm:px-8 pt-7 pb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/20">
              <SunMedium className="w-3.5 h-3.5 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-100">
                Sincronizando com o Supabase...
              </span>
            </div>
            <div className="h-8 w-64 sm:w-80 bg-white/30 rounded-xl" />
            <div className="h-4 w-40 bg-white/20 rounded-md" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20" />
            <div className="w-9 h-9 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 sm:p-8 space-y-6">

        {/* Verse Card Skeleton */}
        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
          <div className="h-4 w-28 bg-amber-200/70 rounded-md" />
          <div className="space-y-2">
            <div className="h-5 w-full bg-amber-200/50 rounded-md" />
            <div className="h-5 w-4/5 bg-amber-200/50 rounded-md" />
          </div>
          <div className="h-4 w-32 bg-amber-300/60 rounded-md ml-auto" />
        </div>

        {/* Reflection Section Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-md" />
            <div className="h-4 w-full bg-slate-100 rounded-md" />
            <div className="h-4 w-11/12 bg-slate-100 rounded-md" />
            <div className="h-4 w-4/5 bg-slate-100 rounded-md" />
          </div>
        </div>

        {/* Prayer Skeleton */}
        <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-2">
          <div className="h-4 w-32 bg-amber-200/60 rounded-md" />
          <div className="h-4 w-full bg-amber-100/70 rounded-md" />
          <div className="h-4 w-3/4 bg-amber-100/70 rounded-md" />
        </div>

        {/* Action Step Skeleton */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
          <div className="h-4 w-40 bg-emerald-200/60 rounded-md" />
          <div className="h-4 w-full bg-emerald-100/70 rounded-md" />
        </div>

        {/* Sync Status Badge */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-amber-800/80 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          <span>Carregando devocional oficial compartilhado...</span>
        </div>

      </div>

    </div>
  );
};
