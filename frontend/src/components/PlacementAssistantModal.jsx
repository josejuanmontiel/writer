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
  MoveRight
} from 'lucide-react';
import { 
  AnalyzeUnassignedPlacement, 
  PromoteUnassignedTopic,
  GetCompendiumModules
} from '../../wailsjs/go/main/App';

export default function PlacementAssistantModal({
  topicRelPath,
  isOpen,
  onClose,
  onPromoted
}) {
  const [analysis, setAnalysis] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
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
      const [res, mods] = await Promise.all([
        AnalyzeUnassignedPlacement(topicRelPath),
        GetCompendiumModules()
      ]);
      setAnalysis(res);
      setModules(mods || []);
      if (res) {
        setSelectedModule(res.suggested_module_slug || (mods[0]?.slug || 'modulo-1'));
        setSessionTitle(res.topic_title || '');
      }
    } catch (err) {
      console.error("Error analizando ubicación:", err);
      setError(err?.toString() || "Error al analizar dependencias del tema flotante.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedModule) {
      alert("Selecciona un módulo destino.");
      return;
    }
    setIsPromoting(true);
    try {
      const newPath = await PromoteUnassignedTopic(
        topicRelPath,
        selectedModule,
        sessionTitle
      );
      if (onPromoted) {
        onPromoted(newPath);
      }
      onClose();
    } catch (err) {
      alert("Error al promocionar tema: " + err);
    } finally {
      setIsPromoting(false);
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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Asistente de Reubicación Curricular
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                  Punto 1.4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ordenación determinista por dependencias del Grafo Conceptual
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Analizando dependencias y prerrequisitos en el Grafo Global...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error de análisis</p>
                <p className="text-xs text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          ) : analysis ? (
            <>
              {/* Tema Flotante Seleccionado */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 block mb-1">
                  Tema Flotante en Staging
                </span>
                <h3 className="text-base font-semibold text-slate-100">
                  {analysis.topic_title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {analysis.topic_path}
                </p>
              </div>

              {/* Recomendación de Ubicación */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    Ubicación Pedagógica Sugerida
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Confianza: {Math.round((analysis.confidence || 0.85) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Módulo Recomendado</span>
                    <span className="text-sm font-medium text-slate-200">
                      {analysis.suggested_module_title || analysis.suggested_module_slug}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Secuencia Temporal</span>
                    <span className="text-sm font-medium text-amber-300">
                      {analysis.suggested_after_session ? (
                        <>Después de: <span className="font-mono text-xs">{analysis.suggested_after_session.split('/').pop()}</span></>
                      ) : (
                        "Al inicio del módulo"
                      )}
                    </span>
                  </div>
                </div>

                {/* Explicación / Razonamiento */}
                <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
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

              {/* Formulario de Promoción */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">
                  Configurar Asignación al Compendio
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            onClick={handlePromote}
            disabled={isLoading || isPromoting || !analysis}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPromoting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Promocionando...</span>
              </>
            ) : (
              <>
                <MoveRight className="w-4 h-4" />
                <span>Asignar y Ubicar en el Módulo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
