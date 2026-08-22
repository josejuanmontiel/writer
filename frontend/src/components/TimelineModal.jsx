import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitCommit, 
  RotateCcw, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { GetFileTimeline, GetFileHistoricalContent } from '../../wailsjs/go/main/App';

export default function TimelineModal({
  isOpen,
  onClose,
  activeFile,
  onRestoreVersion
}) {
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [historicalContent, setHistoricalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTimeline();
    } else {
      setSelectedCommit(null);
      setHistoricalContent('');
      setError(null);
    }
  }, [isOpen, activeFile]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await GetFileTimeline(activeFile || '');
      setCommits(data || []);
      if (data && data.length > 0) {
        selectCommit(data[0]);
      }
    } catch (err) {
      console.error('Error cargando timeline:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const selectCommit = async (commit) => {
    setSelectedCommit(commit);
    if (!activeFile) return;

    setLoadingContent(true);
    try {
      const content = await GetFileHistoricalContent(activeFile, commit.hash);
      setHistoricalContent(content);
    } catch (err) {
      console.error('Error leyendo contenido histórico:', err);
      setHistoricalContent('// No se pudo cargar el contenido de esta versión.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleRestore = () => {
    if (selectedCommit && historicalContent && onRestoreVersion) {
      onRestoreVersion(historicalContent, selectedCommit);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Línea de Tiempo Git & Deshacer Infinito
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {activeFile ? activeFile : 'Historial del compendio completo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split view (Commit list + Preview) */}
        <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden divide-x divide-slate-800">
          
          {/* Left: Commit History */}
          <div className="col-span-5 flex flex-col h-full overflow-y-auto p-3 space-y-2 bg-slate-950/20">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Versiones Guardadas ({commits.length})
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Cargando histórico Git...
              </div>
            ) : commits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Aún no hay commits registrados para este archivo.
              </div>
            ) : (
              commits.map((commit, idx) => {
                const isSelected = selectedCommit?.hash === commit.hash;
                return (
                  <div
                    key={commit.hash}
                    onClick={() => selectCommit(commit)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-sm' 
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-medium text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {commit.short_hash}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {commit.date_str}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 line-clamp-2 mb-1.5">
                      {commit.message}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{commit.author_name}</span>
                      {idx === 0 && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Actual
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Content Preview */}
          <div className="col-span-7 flex flex-col h-full overflow-hidden bg-slate-950/40">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Previsualización de versión</span>
                {selectedCommit && (
                  <span className="text-slate-500 font-mono text-[11px]">
                    ({selectedCommit.short_hash})
                  </span>
                )}
              </div>
              {selectedCommit && (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar esta versión</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text bg-slate-950/60">
              {loadingContent ? (
                <div className="text-slate-500 italic">Recuperando blob de Git...</div>
              ) : historicalContent ? (
                historicalContent
              ) : (
                <div className="text-slate-600 italic">Selecciona un commit a la izquierda para inspeccionar su contenido.</div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span>Git Local-First en Go puro (100% Offline)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-medium"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
