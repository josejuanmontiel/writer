import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Copy, Trash2, X, Search, Check, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import { GetAppLogs, ClearAppLogs } from '../../wailsjs/go/main/App';

export default function LogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await GetAppLogs();
      setLogs(data || '');
    } catch (err) {
      console.error('Error al obtener logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchLogs();

    let interval = null;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, autoRefresh]);

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = async () => {
    if (window.confirm('¿Deseas limpiar el archivo de registros writer.log?')) {
      try {
        await ClearAppLogs();
        setLogs('');
      } catch (err) {
        alert('Error al limpiar logs: ' + err);
      }
    }
  };

  const lines = logs.split('\n');
  const filteredLines = lines.filter((line) => {
    if (!line.trim()) return false;
    const lower = line.toLowerCase();
    
    // Level filter
    if (selectedLevel === 'ERROR') {
      if (!lower.includes('error') && !lower.includes('falló') && !lower.includes('❌') && !lower.includes('fail')) return false;
    } else if (selectedLevel === 'WARN') {
      if (!lower.includes('warn') && !lower.includes('⚠️')) return false;
    } else if (selectedLevel === 'WHISPER') {
      if (!lower.includes('whisper') && !lower.includes('transcri') && !lower.includes('stt') && !lower.includes('ggml')) return false;
    } else if (selectedLevel === 'AUDIO') {
      if (!lower.includes('audio') && !lower.includes('mic') && !lower.includes('graba') && !lower.includes('capture')) return false;
    } else if (selectedLevel === 'MCP') {
      if (!lower.includes('mcp') && !lower.includes('sse') && !lower.includes('tool')) return false;
    }

    // Text search filter
    if (filter && !lower.includes(filter.toLowerCase())) {
      return false;
    }

    return true;
  });

  const formatLine = (line) => {
    const lower = line.toLowerCase();
    if (lower.includes('error') || lower.includes('falló') || lower.includes('❌') || lower.includes('fail')) {
      return 'text-rose-400 font-medium';
    }
    if (lower.includes('warn') || lower.includes('⚠️')) {
      return 'text-amber-300';
    }
    if (lower.includes('success') || lower.includes('✅') || lower.includes('✨') || lower.includes('📝')) {
      return 'text-emerald-400';
    }
    if (lower.includes('mcp') || lower.includes('tool')) {
      return 'text-cyan-300';
    }
    if (lower.includes('whisper') || lower.includes('transcri')) {
      return 'text-indigo-300';
    }
    if (lower.includes('startup') || lower.includes('🚀') || lower.includes('⚡')) {
      return 'text-blue-300';
    }
    return 'text-slate-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden font-inter">
        {/* Header */}
        <div className="h-14 bg-slate-900/90 border-b border-slate-800/80 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Terminal size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                Registros de Ejecución (Logs)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  writer.log
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Supervisión en tiempo real de inicialización, audio, Whisper STT y MCP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                autoRefresh
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Actualizar automáticamente cada 2 segundos"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Auto-refresco</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Actualizar ahora"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
              title="Copiar registros al portapapeles"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition-colors"
              title="Limpiar archivo de logs"
            >
              <Trash2 size={15} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search box */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 w-72 focus-within:border-indigo-500 transition-colors">
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              placeholder="Buscar en logs (ej: whisper, error, cuda)..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-white placeholder-slate-500 w-full text-xs"
            />
            {filter && (
              <button onClick={() => setFilter('')} className="text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'ERROR', label: 'Errores' },
              { id: 'WARN', label: 'Avisos' },
              { id: 'WHISPER', label: 'Whisper STT' },
              { id: 'AUDIO', label: 'Audio / Micro' },
              { id: 'MCP', label: 'MCP Server' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedLevel === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Auto Scroll toggle */}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-indigo-600 rounded"
            />
            <span>Auto-scroll</span>
          </label>
        </div>

        {/* Log Viewer Content */}
        <div
          ref={logsContainerRef}
          className="flex-1 bg-slate-950 p-4 font-mono text-[11.5px] leading-relaxed overflow-y-auto select-text scrollbar-thin scrollbar-thumb-slate-800"
        >
          {filteredLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <AlertCircle size={32} className="mb-2 opacity-50 text-indigo-400" />
              <p>No hay registros coincidentes con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredLines.map((line, idx) => (
              <div
                key={idx}
                className={`py-0.5 hover:bg-white/[0.03] px-1.5 rounded transition-colors whitespace-pre-wrap break-all ${formatLine(
                  line
                )}`}
              >
                <span className="text-slate-600 select-none mr-3 text-[10px]">
                  {String(idx + 1).padStart(3, '0')}
                </span>
                {line}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="h-9 bg-slate-900/80 border-t border-slate-800 px-5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Líneas visibles: {filteredLines.length} / Total: {lines.length}</span>
          <span>Tip: Para depurar modelos locales o audio, revisa las líneas con [STARTUP] y Whisper</span>
        </div>
      </div>
    </div>
  );
}
