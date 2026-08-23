import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Wrench, 
  Baby, 
  Eye, 
  Split, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
  Columns,
  RefreshCw,
  Printer
} from 'lucide-react';
import { FilterContentForAudience } from '../../wailsjs/go/main/App';

export default function DualPaneView({
  content = '',
  activeFile = '',
  onUpdateContent,
  onOpenDerivationModal,
  editorComponent
}) {
  const [audience, setAudience] = useState('student'); // 'student', 'instructor', 'simplified', 'workshop'
  const [filteredContent, setFilteredContent] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filtrar contenido cada vez que cambia el texto o la audiencia
  useEffect(() => {
    let isCancelled = false;
    async function filter() {
      setIsFiltering(true);
      try {
        const res = await FilterContentForAudience(content, audience);
        if (!isCancelled) {
          setFilteredContent(res);
        }
      } catch (err) {
        console.error("Error filtrando contenido para audiencia:", err);
      } finally {
        if (!isCancelled) setIsFiltering(false);
      }
    }
    filter();
    return () => { isCancelled = true; };
  }, [content, audience]);

  const handleCopyFiltered = () => {
    navigator.clipboard.writeText(filteredContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeFile || 'Documento'} - Vista ${audience}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
            .admonition-block { border-left: 4px solid #6366f1; padding: 12px 16px; background: #f8fafc; margin: 16px 0; border-radius: 4px; }
            .admonition-student { border-color: #10b981; background: #f0fdf4; }
            .admonition-workshop { border-color: #f59e0b; background: #fffbeb; }
            .admonition-instructor { border-color: #8b5cf6; background: #faf5ff; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div>${filteredContent}</div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Top Bar de Vista Dual */}
      <div className="h-14 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Izquierda: Info de Vista Dual */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Split size={16} />
            </div>
            <div>
              <span className="font-bold text-xs text-white block">Vista Dual Sincronizada</span>
              <span className="text-[10px] text-slate-400 font-mono">Single-Source Authoring</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          {/* Selector de Audiencia en Vivo */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setAudience('student')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                audience === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Oculta notas de profesor y muestra fichas/preguntas del alumno"
            >
              <GraduationCap size={13} />
              <span>🧑‍🎓 Ficha Alumno</span>
            </button>

            <button
              onClick={() => setAudience('instructor')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                audience === 'instructor'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista completa del profesor con notas didácticas y soluciones"
            >
              <Users size={13} />
              <span>👨‍🏫 Guía Profesor</span>
            </button>

            <button
              onClick={() => setAudience('simplified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                audience === 'simplified'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Lenguaje sencillo / Catequesis infantil"
            >
              <Baby size={13} />
              <span>🧒 Infantil / Fácil</span>
            </button>

            <button
              onClick={() => setAudience('workshop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                audience === 'workshop'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo taller y dinámicas de grupo"
            >
              <Wrench size={13} />
              <span>🛠️ Taller Práctico</span>
            </button>
          </div>
        </div>

        {/* Derecha: Botones de Acción */}
        <div className="flex items-center gap-2">
          {onOpenDerivationModal && (
            <button
              onClick={onOpenDerivationModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
              title="Derivar automáticamente un documento independiente para alumnos o infantil"
            >
              <Sparkles size={13} />
              <span>Asistente de Derivación</span>
            </button>
          )}

          <button
            onClick={handleCopyFiltered}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Copiar texto filtrado al portapapeles"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Imprimir / Exportar a PDF"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 w-full h-full flex flex-row divide-x divide-slate-800 overflow-hidden">
        
        {/* Panel Izquierdo: Editor Maestro */}
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950/60">
          <div className="h-8 px-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Columns size={12} className="text-indigo-400" />
              Documento Maestro (Fuente Única)
            </span>
            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
              {activeFile || 'Borrador'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {editorComponent}
          </div>
        </div>

        {/* Panel Derecho: Previsualizador Filtrado en Tiempo Real */}
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-900/30">
          <div className="h-8 px-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Eye size={12} />
              Vista Filtrada para: {
                audience === 'student' ? '🧑‍🎓 Alumno / Ficha Didáctica' :
                audience === 'instructor' ? '👨‍🏫 Guía del Profesor' :
                audience === 'simplified' ? '🧒 Infantil / Lectura Fácil' : '🛠️ Taller Práctico'
              }
            </span>
            {isFiltering && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-400">
                <RefreshCw size={10} className="animate-spin" />
                Sincronizando...
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto select-text prose prose-invert max-w-none">
            {/* Si el contenido es HTML se inyecta directamente, si es AsciiDoc/texto se preformatea */}
            {filteredContent && (filteredContent.includes('<p>') || filteredContent.includes('<div')) ? (
              <div 
                className="text-sm leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: filteredContent }} 
              />
            ) : (
              <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap text-slate-200">
                {filteredContent || (
                  <p className="text-slate-500 italic text-center py-12">
                    Escribe en el panel maestro para ver la adaptación en vivo para esta audiencia.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
