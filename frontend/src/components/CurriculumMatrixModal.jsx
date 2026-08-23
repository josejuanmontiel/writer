import React, { useState, useEffect } from 'react';
import { 
  X, 
  Table as TableIcon, 
  AlertTriangle, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  Info,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { GetCurriculumCoherenceMatrix } from '../../wailsjs/go/main/App';

export default function CurriculumMatrixModal({ isOpen, onClose, onSelectSession }) {
  const [matrixData, setMatrixData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [onlyWarnings, setOnlyWarnings] = useState(false);

  const loadMatrix = async () => {
    setIsLoading(true);
    try {
      const data = await GetCurriculumCoherenceMatrix();
      setMatrixData(data);
    } catch (err) {
      console.error("Error cargando matriz de coherencia curricular:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMatrix();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sessions = matrixData?.sessions || [];
  let concepts = matrixData?.concepts || [];

  if (searchFilter) {
    concepts = concepts.filter(c => 
      c.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.type.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }

  if (onlyWarnings) {
    concepts = concepts.filter(c => c.warnings_count > 0);
  }

  const totalWarnings = matrixData?.total_warnings || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <TableIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold font-outfit text-white">
                  Matriz de Coherencia Curricular
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {concepts.length} Conceptos | {sessions.length} Sesiones
                </span>
                {totalWarnings > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} className="text-rose-400" />
                    {totalWarnings} Alerta{totalWarnings > 1 ? 's' : ''} Pedagógica{totalWarnings > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mapa de calor conceptual: supervisa la introducción (★), refuerzo (●) y orden lógico de prerrequisitos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMatrix}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Recargar matriz"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar por concepto (ej. Bautismo, Gracia, Pecado)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setOnlyWarnings(!onlyWarnings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                onlyWarnings
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle size={13} className={onlyWarnings ? 'text-rose-400' : 'text-slate-500'} />
              <span>Solo avisos ({totalWarnings})</span>
            </button>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 border-l border-slate-800 pl-4">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">★</span>
                <span>Introducción</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-indigo-400 font-bold text-sm leading-none">●</span>
                <span>Refuerzo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">⚠️</span>
                <span>Uso Prematuro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Table View */}
        <div className="flex-1 overflow-auto bg-slate-950/20">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Calculando matriz de dependencias curriculares...</p>
            </div>
          ) : concepts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <TableIcon size={36} className="mb-2 opacity-40" />
              <p className="text-sm font-medium">No se encontraron conceptos en el temario</p>
              <p className="text-xs text-slate-600 mt-1">Escribe sesiones o extrae grafos para poblar la matriz</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20">
                  <th className="py-3 px-4 font-semibold text-xs text-slate-300 sticky left-0 bg-slate-900 z-30 min-w-[220px] max-w-[260px] shadow-sm">
                    Concepto / Doctrina
                  </th>
                  {sessions.map((s, idx) => (
                    <th 
                      key={s.rel_path}
                      onClick={() => onSelectSession && onSelectSession(s.rel_path)}
                      className="py-3 px-2 text-center text-xs font-semibold text-slate-300 min-w-[110px] max-w-[130px] border-l border-slate-800/60 hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      title={`${s.title} (${s.rel_path})\nHaz clic para abrir en el editor`}
                    >
                      <div className="text-[10px] uppercase font-mono text-indigo-400 font-bold truncate">
                        {s.module}
                      </div>
                      <div className="truncate text-slate-200 group-hover:text-white font-medium text-xs mt-0.5">
                        S{idx + 1}: {s.title}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {concepts.map((concept) => (
                  <tr 
                    key={concept.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Concept Name & Badge (Sticky left column) */}
                    <td className="py-2.5 px-4 sticky left-0 bg-slate-900/95 group-hover:bg-slate-850 z-10 border-r border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200 truncate group-hover:text-white">
                            {concept.label}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                              {concept.type || 'Concepto'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {concept.occurrences}x
                            </span>
                          </div>
                        </div>

                        {concept.warnings_count > 0 && (
                          <span 
                            title={`Este concepto presenta ${concept.warnings_count} aviso(s) de coherencia temporal`}
                            className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold shrink-0 flex items-center gap-0.5"
                          >
                            <AlertTriangle size={10} />
                            {concept.warnings_count}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Matrix Cells */}
                    {sessions.map((s) => {
                      const cell = concept.cells?.[s.rel_path] || { type: 'empty' };
                      return (
                        <td 
                          key={s.rel_path}
                          className="py-2 px-2 text-center border-l border-slate-800/50 relative"
                        >
                          {cell.type === 'intro' && (
                            <div 
                              title={`★ ${concept.label}: Introducido aquí por primera vez (${s.title})`}
                              className="w-7 h-7 mx-auto rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs hover:scale-110 transition-transform cursor-help"
                            >
                              ★
                            </div>
                          )}
                          {cell.type === 'reinforce' && (
                            <div 
                              title={`● ${concept.label}: Refuerzo y profundización en ${s.title}`}
                              className="w-7 h-7 mx-auto rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs hover:scale-110 transition-transform cursor-help"
                            >
                              ●
                            </div>
                          )}
                          {cell.type === 'premature_warning' && (
                            <div 
                              title={`⚠️ ALERTA DE COHERENCIA:\n${cell.detail}`}
                              className="w-7 h-7 mx-auto rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-xs shadow-xs animate-pulse hover:scale-110 transition-transform cursor-help"
                            >
                              ⚠️
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info size={13} className="text-indigo-400" />
            <span>Haz clic en el encabezado de cualquier sesión para abrirla en el editor.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Cerrar Matriz
          </button>
        </div>
      </div>
    </div>
  );
}
