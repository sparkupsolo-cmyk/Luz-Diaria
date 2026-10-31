import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Search, 
  BookOpen, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles,
  Layers,
  Filter,
  CheckCheck
} from 'lucide-react';
import { BIBLE_BOOKS, TOTAL_BIBLE_CHAPTERS, TOTAL_VT_CHAPTERS, TOTAL_NT_CHAPTERS, BibleBook } from '../data/bibleBooks';
import { BibleProgress } from '../types';

interface BibleReadingTrackerProps {
  progress: BibleProgress;
  onUpdateProgress: (newProgress: BibleProgress) => void;
}

export const BibleReadingTracker: React.FC<BibleReadingTrackerProps> = ({
  progress,
  onUpdateProgress
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState<'ALL' | 'VT' | 'NT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [activeBookModal, setActiveBookModal] = useState<BibleBook | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalRead = 0;
    let vtRead = 0;
    let ntRead = 0;
    let completedBooksCount = 0;

    BIBLE_BOOKS.forEach(book => {
      const readChaptersForBook = progress.readChapters[book.id] || [];
      const count = readChaptersForBook.length;
      totalRead += count;

      if (book.testament === 'VT') {
        vtRead += count;
      } else {
        ntRead += count;
      }

      if (count >= book.chapters) {
        completedBooksCount++;
      }
    });

    const totalPercentage = Math.round((totalRead / TOTAL_BIBLE_CHAPTERS) * 100);
    const vtPercentage = Math.round((vtRead / TOTAL_VT_CHAPTERS) * 100);
    const ntPercentage = Math.round((ntRead / TOTAL_NT_CHAPTERS) * 100);

    return {
      totalRead,
      totalRemaining: TOTAL_BIBLE_CHAPTERS - totalRead,
      totalPercentage,
      vtRead,
      vtPercentage,
      ntRead,
      ntPercentage,
      completedBooksCount
    };
  }, [progress]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    BIBLE_BOOKS.forEach(b => set.add(b.category));
    return Array.from(set);
  }, []);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter(book => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = book.name.toLowerCase().includes(query);
        const matchesAbbrev = book.abbrev.toLowerCase().includes(query);
        if (!matchesName && !matchesAbbrev) return false;
      }

      // Testament
      if (selectedTestament !== 'ALL' && book.testament !== selectedTestament) {
        return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && book.category !== selectedCategory) {
        return false;
      }

      // Status
      const readCount = (progress.readChapters[book.id] || []).length;
      if (statusFilter === 'COMPLETED' && readCount < book.chapters) return false;
      if (statusFilter === 'UNREAD' && readCount > 0) return false;
      if (statusFilter === 'IN_PROGRESS' && (readCount === 0 || readCount >= book.chapters)) return false;

      return true;
    });
  }, [searchQuery, selectedTestament, selectedCategory, statusFilter, progress]);

  // Handle toggling single chapter
  const toggleChapter = (bookId: string, chapterNum: number) => {
    const currentList = progress.readChapters[bookId] || [];
    const isAlreadyRead = currentList.includes(chapterNum);
    
    let updatedList: number[];
    if (isAlreadyRead) {
      updatedList = currentList.filter(c => c !== chapterNum);
    } else {
      updatedList = [...currentList, chapterNum].sort((a, b) => a - b);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = progress.readingStreak || 1;
    if (progress.lastReadDate !== todayStr && !isAlreadyRead) {
      newStreak += 1;
    }

    onUpdateProgress({
      ...progress,
      readChapters: {
        ...progress.readChapters,
        [bookId]: updatedList
      },
      lastUpdated: new Date().toISOString(),
      lastReadDate: todayStr,
      readingStreak: newStreak
    });
  };

  // Mark all chapters of a book
  const markEntireBook = (book: BibleBook, markAsRead: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedList = markAsRead 
      ? Array.from({ length: book.chapters }, (_, i) => i + 1)
      : [];

    onUpdateProgress({
      ...progress,
      readChapters: {
        ...progress.readChapters,
        [book.id]: updatedList
      },
      lastUpdated: new Date().toISOString(),
      lastReadDate: todayStr
    });
  };

  // Mark chapters up to X
  const markChaptersUpTo = (book: BibleBook, targetChapter: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedList = Array.from({ length: targetChapter }, (_, i) => i + 1);

    onUpdateProgress({
      ...progress,
      readChapters: {
        ...progress.readChapters,
        [book.id]: updatedList
      },
      lastUpdated: new Date().toISOString(),
      lastReadDate: todayStr
    });
  };

  // Export progress
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(progress, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `luz-diaria-progresso-biblia-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import progress
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.readChapters) {
          onUpdateProgress(parsed);
          alert('Progresso bíblico importado com sucesso!');
        }
      } catch (err) {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Title & Overview Banner */}
      <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-semibold backdrop-blur-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Plano Completo de Leitura Bíblica</span>
            </div>
            <h2 className="font-heading-cinzel text-2xl sm:text-3xl font-bold tracking-wide">
              Tabela de Leitura da Bíblia
            </h2>
            <p className="text-amber-100/90 text-sm max-w-xl">
              Acompanhe sua jornada pelos 66 livros e 1.189 capítulos da Palavra de Deus. Marque cada capítulo lido e veja seu progresso diário.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-5 min-w-[240px]">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-amber-950/40"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-300 transition-all duration-500 ease-out"
                  strokeDasharray={`${stats.totalPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-bold text-base text-white">
                {stats.totalPercentage}%
              </span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-200 font-semibold">
                Capítulos Lidos
              </div>
              <div className="text-xl font-bold text-white">
                {stats.totalRead} <span className="text-sm font-normal text-amber-200/80">/ {TOTAL_BIBLE_CHAPTERS}</span>
              </div>
              <div className="text-xs text-amber-200/90">
                {stats.completedBooksCount} de 66 livros concluídos
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/15">
          {/* Velho Testamento */}
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Antigo Testamento (39 Livros)</span>
              <span className="text-amber-200">{stats.vtRead} / {TOTAL_VT_CHAPTERS} caps ({stats.vtPercentage}%)</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                style={{ width: `${stats.vtPercentage}%` }} 
              />
            </div>
          </div>

          {/* Novo Testamento */}
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Novo Testamento (27 Livros)</span>
              <span className="text-emerald-300">{stats.ntRead} / {TOTAL_NT_CHAPTERS} caps ({stats.ntPercentage}%)</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                style={{ width: `${stats.ntPercentage}%` }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar livro bíblico (ex: Gênesis, Salmos, Mateus)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Backup / Export Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Exportar backup do progresso"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Salvar Backup</span>
            </button>
            <label 
              title="Importar progresso anterior"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Restaurar</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          
          {/* Testament Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-700">
            <button
              onClick={() => setSelectedTestament('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTestament === 'ALL' ? 'bg-white text-amber-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Toda a Bíblia
            </button>
            <button
              onClick={() => setSelectedTestament('VT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTestament === 'VT' ? 'bg-white text-amber-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Antigo Testamento (39)
            </button>
            <button
              onClick={() => setSelectedTestament('NT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTestament === 'NT' ? 'bg-white text-amber-900 shadow-2xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Novo Testamento (27)
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-700">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-amber-900 shadow-2xs font-semibold' : ''
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'IN_PROGRESS' ? 'bg-white text-amber-900 shadow-2xs font-semibold' : ''
              }`}
            >
              Em Leitura
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : ''
              }`}
            >
              Concluídos
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Todas as Seções Bíblicas</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

        </div>

      </div>

      {/* Bible Books Table / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
          <span>Exibindo {filteredBooks.length} livros encontrados</span>
          <span>Clique em um livro para marcar capítulos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBooks.map((book) => {
            const readList = progress.readChapters[book.id] || [];
            const readCount = readList.length;
            const isCompleted = readCount >= book.chapters;
            const pct = Math.round((readCount / book.chapters) * 100);

            return (
              <div
                key={book.id}
                onClick={() => setActiveBookModal(book)}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                  isCompleted 
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs hover:shadow-xs' 
                    : readCount > 0 
                    ? 'bg-amber-50/50 border-amber-200 shadow-2xs hover:border-amber-400' 
                    : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading-cinzel font-bold text-base text-slate-900 group-hover:text-amber-900 transition-colors">
                        {book.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {book.abbrev}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-1">
                      {book.category} • {book.testament === 'VT' ? 'Antigo Testamento' : 'Novo Testamento'}
                    </span>
                  </div>

                  {/* Complete status indicator */}
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Lido
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-600">
                      {readCount}/{book.chapters}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>{book.chapters} {book.chapters === 1 ? 'capítulo' : 'capítulos'}</span>
                  <span className="font-medium text-amber-800 group-hover:translate-x-0.5 transition-transform flex items-center">
                    Ver capítulos <ChevronRight className="w-3 h-3 inline ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-600">Nenhum livro encontrado com esses filtros.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTestament('ALL');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-amber-700 font-semibold underline cursor-pointer"
            >
              Redefinir filtros
            </button>
          </div>
        )}
      </div>

      {/* Interactive Chapter Modal / Drawer */}
      {activeBookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-amber-600 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-semibold">
                    {activeBookModal.testament === 'VT' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </span>
                  <span className="text-xs text-amber-100 font-medium">
                    {activeBookModal.category}
                  </span>
                </div>
                <h3 className="font-heading-cinzel font-bold text-2xl sm:text-3xl text-white mt-1">
                  {activeBookModal.name}
                </h3>
                <p className="text-xs text-amber-100/90 mt-1 max-w-lg">
                  {activeBookModal.summary}
                </p>
              </div>

              <button
                onClick={() => setActiveBookModal(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Tools inside Modal */}
            <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-semibold text-amber-950">
                {(progress.readChapters[activeBookModal.id] || []).length} de {activeBookModal.chapters} capítulos marcados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => markEntireBook(activeBookModal, true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Marcar Todos</span>
                </button>
                <button
                  onClick={() => markEntireBook(activeBookModal, false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Chapter Badges Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              <div className="text-xs text-slate-500 font-medium mb-2">
                Toque em cada capítulo para marcar como lido:
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: activeBookModal.chapters }, (_, i) => i + 1).map((chNum) => {
                  const isRead = (progress.readChapters[activeBookModal.id] || []).includes(chNum);
                  return (
                    <button
                      key={chNum}
                      onClick={() => toggleChapter(activeBookModal.id, chNum)}
                      className={`h-11 rounded-xl font-semibold text-sm transition-all duration-150 flex flex-col items-center justify-center cursor-pointer border ${
                        isRead
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-102 font-bold ring-2 ring-amber-300'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <span>{chNum}</span>
                      {isRead && <CheckCircle2 className="w-2.5 h-2.5 text-amber-200" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                O progresso é salvo automaticamente.
              </span>
              <button
                onClick={() => setActiveBookModal(null)}
                className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
