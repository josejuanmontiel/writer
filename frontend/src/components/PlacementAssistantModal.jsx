import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FolderPlus, 
  Layers, 
  AlertCircle, 
  BookOpen,
  Compass,
  MoveRight,
  FilePlus,
  Paperclip,
  Bookmark
} from 'lucide-react';
import { 
  AnalyzeUnassignedPlacement, 
  PromoteUnassignedTopic,
  EmbedUnassignedTopicIntoSession,
  GetCompendiumModules,
  GetCompendiumTree
} from '../../wailsjs/go/main/App';

export default function PlacementAssistantModal({
  topicRelPath,
  isOpen,
  onClose,
  onPromoted
}) {
  const [analysis, setAnalysis] = useState(null);
  const [modules, setModules] = useState([]);
  const [courseSessions, setCourseSessions] = useState([]);
  const [actionType, setActionType] = useState('promote'); // 'promote' (nueva sesión) o 'embed' (incrustar)
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedSessionToEmbed, setSelectedSessionToEmbed] = useState('');
  const [embedMode, setEmbedMode] = useState('note'); // 'note' ([NOTE]) o 'section' (=== Titulo)
  const [sessionTitle, setSessionTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && topicRelPath) {
      loadAnalysis();
    }
  }, [isOpen, topicRelPath]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, mods, tree] = await Promise.all([
        AnalyzeUnassignedPlacement(topicRelPath),
        GetCompendiumModules(),
        GetCompendiumTree()
      ]);
      setAnalysis(res);
      setModules(mods || []);

      // Extraer todas las sesiones del árbol
      const sess = [];
      if (tree) {
        for (const cat of tree) {
          if (cat.category === 'content' && cat.children) {
            for (const mod of cat.children) {
              if (mod.children) {
                for (const f of mod.children) {
                  if (f.name.endsWith('.adoc') && f.name !== '_index.adoc') {
                    sess.push({
                      relPath: f.relative_path,
                      title: f.title || f.name,
                      module: mod.name
                    });
                  }
                }
              }
            }
          }
        }
      }
      setCourseSessions(sess);

      if (res) {
        setSelectedModule(res.suggested_module_slug || (mods[0]?.slug || 'modulo-1'));
        setSessionTitle(res.topic_title || '');
        if (res.suggested_after_session) {
          setSelectedSessionToEmbed(res.suggested_after_session);
        } else if (sess.length > 0) {
          setSelectedSessionToEmbed(sess[0].relPath);
        }
      }
    } catch (err) {
      console.error("Error analizando ubicación:", err);
      setError(err?.toString() || "Error al analizar dependencias del tema flotante.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      if (actionType === 'promote') {
        if (!selectedModule) {
          alert("Selecciona un módulo destino.");
          return;
        }
        const newPath = await PromoteUnassignedTopic(
          topicRelPath,
          selectedModule,
          sessionTitle
        );
        if (onPromoted) {
          onPromoted(newPath);
        }
      } else {
        if (!selectedSessionToEmbed) {
          alert("Selecciona la sesión destino para incrustar.");
          return;
        }
        await EmbedUnassignedTopicIntoSession(
          topicRelPath,
          selectedSessionToEmbed,
          embedMode
        );
        if (onPromoted) {
          onPromoted(selectedSessionToEmbed);
        }
      }
      onClose();
    } catch (err) {
      alert("Error al procesar tema flotante: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Asistente de Reubicación Curricular
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                  Dependencias Semánticas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Organiza ideas flotantes asegurando el orden lógico de los conceptos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Analizando grafo conceptual y dependencias...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : analysis ? (
            <>
              {/* Tarjeta de Sugerencia */}
              <div className="bg-gradient-to-br from-amber-500/10 via-slate-800/40 to-indigo-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Ubicación Óptima Recomendada
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                    <span>Confianza:</span>
                    <span>{Math.round(analysis.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm font-medium text-slate-100 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">
                    Módulo: <strong className="text-amber-300">{analysis.suggested_module_title || analysis.suggested_module_slug}</strong>
                  </span>
                  <MoveRight className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-300">
                    Posición sugerida: <strong className="text-emerald-300">Clase #{analysis.suggested_position}</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50 leading-relaxed">
                  <span className="font-semibold text-amber-300 block mb-1">🧠 Justificación Pedagógica:</span>
                  {analysis.reasoning}
                </div>
              </div>

              {/* Lista de Prerrequisitos y Dependencias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Conceptos Previos Requeridos
                  </span>
                  {analysis.prerequisites_met && analysis.prerequisites_met.length > 0 ? (
                    <ul className="space-y-1 text-xs text-slate-400">
                      {analysis.prerequisites_met.map((p, idx) => (
                        <li key={idx} className="bg-slate-900/50 px-2 py-1 rounded text-slate-300 border border-slate-800/50">
                          • {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No requiere prerrequisitos rígidos anteriores.</p>
                  )}
                </div>

                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Sesiones Posteriores que Dependen
                  </span>
                  {analysis.dependent_sessions && analysis.dependent_sessions.length > 0 ? (
                    <ul className="space-y-1 text-xs text-slate-400">
                      {analysis.dependent_sessions.map((d, idx) => (
                        <li key={idx} className="bg-slate-900/50 px-2 py-1 rounded text-slate-300 border border-slate-800/50">
                          • {d}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Ninguna sesión posterior depende estrictamente de este tema.</p>
                  )}
                </div>
              </div>

              {/* Selector de Modo de Asignación */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">
                  Elige cómo deseas integrar esta idea:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType('promote')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      actionType === 'promote'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-white">
                      <FilePlus className="w-4 h-4 text-amber-400" />
                      <span>Nueva Sesión</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Crea un archivo de clase completo en el módulo.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('embed')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      actionType === 'embed'
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-white">
                      <Paperclip className="w-4 h-4 text-indigo-400" />
                      <span>Incrustar en Sesión</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Inserta como apunte o sección dentro de una clase existente.
                    </p>
                  </button>
                </div>

                {actionType === 'promote' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Módulo Destino</label>
                      <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        {modules.map((m) => (
                          <option key={m.slug} value={m.slug}>
                            {m.title || m.slug}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Título de la Sesión</label>
                      <input
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        placeholder="Título oficial de la sesión..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Sesión Destino para Incrustar</label>
                      <select
                        value={selectedSessionToEmbed}
                        onChange={(e) => setSelectedSessionToEmbed(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {courseSessions.map((s) => (
                          <option key={s.relPath} value={s.relPath}>
                            [{s.module}] {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Formato de Incrustación</label>
                      <select
                        value={embedMode}
                        onChange={(e) => setEmbedMode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="note">Bloque de Nota [NOTE] (Apunte destacado)</option>
                        <option value="section">Subsección propia (=== Título)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleExecute}
            disabled={isLoading || isProcessing || !analysis}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === 'promote'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/20'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando...</span>
              </>
            ) : actionType === 'promote' ? (
              <>
                <MoveRight className="w-4 h-4" />
                <span>Asignar como Nueva Sesión</span>
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4" />
                <span>Incrustar en la Clase Elegida</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
