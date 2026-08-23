import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Video, 
  Presentation, 
  Mic, 
  Save, 
  Clock, 
  FileText, 
  Play, 
  Layers, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Edit3
} from 'lucide-react';
import { 
  BuildVideoScriptPrompt, 
  BuildCanvaSlidesPrompt, 
  BuildAudioCapsulePrompt, 
  GenerateMultimediaScript, 
  SaveSessionScript, 
  GetSessionScript, 
  ParseAndImportScript, 
  ExportScriptToMarkdown 
} from '../../wailsjs/go/main/App';

export default function PromptStudioModal({ isOpen, onClose, activeFile, compendiumMeta }) {
  const [mode, setMode] = useState('video'); // 'video' | 'slides' | 'audio'
  const [duration, setDuration] = useState(10);
  const [tone, setTone] = useState('didáctico, dinámico y ameno');
  
  // Prompt state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [fullPrompt, setFullPrompt] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('clipboard'); // 'clipboard' | 'direct' | 'editor'

  // Pasting & Result state
  const [pastedResponse, setPastedResponse] = useState('');
  const [scriptData, setScriptData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMarkdownExport, setShowMarkdownExport] = useState(false);
  const [markdownText, setMarkdownText] = useState('');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  useEffect(() => {
    if (isOpen && activeFile) {
      loadSavedScriptOrBuildPrompt();
    }
  }, [isOpen, activeFile, mode, duration, tone]);

  const loadSavedScriptOrBuildPrompt = async () => {
    setErrorMsg(null);
    try {
      // 1. Intentar cargar escaleta previa guardada
      const saved = await GetSessionScript(activeFile);
      if (saved && saved.sections && saved.sections.length > 0) {
        setScriptData(saved);
      }

      // 2. Construir el prompt estructurado para la sesión actual
      let promptRes;
      if (mode === 'slides') {
        promptRes = await BuildCanvaSlidesPrompt(activeFile);
      } else if (mode === 'audio') {
        promptRes = await BuildAudioCapsulePrompt(activeFile, tone);
      } else {
        promptRes = await BuildVideoScriptPrompt(activeFile, parseInt(duration) || 10, tone);
      }

      if (promptRes) {
        setSystemPrompt(promptRes.system_prompt || '');
        setUserPrompt(promptRes.user_prompt || '');
        setFullPrompt(promptRes.full_prompt || '');
      }
    } catch (err) {
      console.error('Error cargando prompt/script:', err);
      setErrorMsg(err.toString());
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleOpenWebLLM = (url) => {
    window.open(url, '_blank');
  };

  const handleParsePasted = async () => {
    if (!pastedResponse.trim()) return;
    setErrorMsg(null);
    try {
      const parsed = await ParseAndImportScript(activeFile, pastedResponse);
      if (parsed) {
        setScriptData(parsed);
        setActiveTab('editor');
        setSuccessMsg('¡Escaleta importada con éxito!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg('No se pudo interpretar el formato: ' + err.toString());
    }
  };

  const handleDirectGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const generated = await GenerateMultimediaScript(activeFile, mode, parseInt(duration) || 10, tone);
      if (generated) {
        setScriptData(generated);
        setActiveTab('editor');
        setSuccessMsg('¡Escaleta generada por IA con éxito!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg('Error en generación directa: ' + err.toString() + ' (Prueba el modo Clipboard si no tienes API configurada)');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveScript = async () => {
    if (!scriptData) return;
    setIsSaving(true);
    try {
      await SaveSessionScript(activeFile, scriptData);
      setSuccessMsg('Escaleta guardada en el compendio (.writer/scripts/)');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Error al guardar: ' + err.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!scriptData) return;
    try {
      const md = await ExportScriptToMarkdown(scriptData);
      setMarkdownText(md);
      setShowMarkdownExport(true);
    } catch (err) {
      console.error('Error exportando markdown:', err);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSectionChange = (index, field, value) => {
    if (!scriptData) return;
    const newSections = [...scriptData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setScriptData({ ...scriptData, sections: newSections });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Multimedia Prompt & Script Studio</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Punto 1.9
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Producción de escaletas de vídeo, esquemas para Canva y guiones de audio para <span className="text-slate-200 font-medium">{activeFile || 'la sesión activa'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar de Formatos & Pestañas */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs gap-3">
          {/* Selector de Tipo de Contenido */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'video' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video size={14} />
              <span>Vídeo / YouTube</span>
            </button>
            <button
              onClick={() => setMode('slides')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'slides' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Presentation size={14} />
              <span>Canva / Diapositivas</span>
            </button>
            <button
              onClick={() => setMode('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'audio' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic size={14} />
              <span>Cápsula de Audio</span>
            </button>
          </div>

          {/* Opciones de Duración & Tono */}
          <div className="flex items-center gap-3">
            {mode === 'video' && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                <Clock size={13} className="text-slate-400" />
                <span className="text-slate-400">Duración:</span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer"
                >
                  <option value="5" className="bg-slate-900">5 min (Resumen)</option>
                  <option value="10" className="bg-slate-900">10 min (Estándar)</option>
                  <option value="15" className="bg-slate-900">15 min (Detallado)</option>
                  <option value="25" className="bg-slate-900">25 min (Masterclass)</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Tono:</span>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="didáctico, dinámico..."
                className="bg-transparent text-slate-200 font-medium outline-none w-36 text-xs"
              />
            </div>
          </div>

          {/* Selector de Flujo */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('clipboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'clipboard' 
                  ? 'bg-amber-600/90 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Copy size={13} />
              <span>Clipboard (Gemini Web)</span>
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'direct' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={13} />
              <span>Generación Directa</span>
            </button>
            {scriptData && (
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'editor' 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers size={13} />
                <span>Escaleta Activa ({scriptData.sections?.length || 0})</span>
              </button>
            )}
          </div>
        </div>

        {/* Notificaciones */}
        {errorMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={15} className="shrink-0 text-emerald-400" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: CLIPBOARD WORKFLOW (Gemini Web / ChatGPT) */}
          {activeTab === 'clipboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              
              {/* Columna Izquierda: Prompt Preparado */}
              <div className="flex flex-col bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-white">Copiar Prompt Estructurado</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">100% Gratis sin API Key</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Writer empaqueta el contenido de la lección con instrucciones estrictas de formato JSON y marcas de tiempo para el LLM web.
                </p>

                <div className="flex-1 min-h-[220px] bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-all">
                  {fullPrompt || 'Generando prompt...'}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleCopyPrompt}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                      promptCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-950/30'
                    }`}
                  >
                    {promptCopied ? <Check size={15} /> : <Copy size={15} />}
                    <span>{promptCopied ? '¡Prompt Copiado!' : '📋 Copiar Prompt con Contexto'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenWebLLM('https://gemini.google.com/app')}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="Abrir Gemini Web en una nueva pestaña"
                  >
                    <span>Abrir Gemini</span>
                    <ExternalLink size={13} />
                  </button>

                  <button
                    onClick={() => handleOpenWebLLM('https://chatgpt.com')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="Abrir ChatGPT"
                  >
                    <span>ChatGPT</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Pegar Resultado e Importar */}
              <div className="flex flex-col bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-white">Pegar Respuesta e Importar</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Formateo Automático</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Pega aquí la respuesta generada por Gemini o ChatGPT. Writer la analizará y creará la escaleta interactiva con timestamps.
                </p>

                <textarea
                  value={pastedResponse}
                  onChange={(e) => setPastedResponse(e.target.value)}
                  placeholder="Pega aquí el JSON o texto generado por el LLM..."
                  className="flex-1 min-h-[220px] bg-slate-900/90 border border-slate-800 focus:border-emerald-500/60 rounded-xl p-3.5 font-mono text-xs text-slate-200 outline-none resize-none transition-colors"
                />

                <button
                  onClick={handleParsePasted}
                  disabled={!pastedResponse.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition-all"
                >
                  <Layers size={15} />
                  <span>📥 Importar y Generar Escaleta Interactiva</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: DIRECT GENERATION (API Gemini / Ollama / Groq) */}
          {activeTab === 'direct' && (
            <div className="max-w-2xl mx-auto bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles size={26} />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Generación Directa con Motor LLM</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Genera la escaleta multimedia completa en background usando la API configurada (Google Gemini API, Ollama local, Groq u OpenAI).
                </p>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Modo de Producción:</span>
                  <span className="font-semibold capitalize text-white">{mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duración Estimada:</span>
                  <span className="font-semibold text-white">{duration} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estilo / Tono:</span>
                  <span className="font-semibold text-white">{tone}</span>
                </div>
              </div>

              <button
                onClick={handleDirectGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/50 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Invocando LLM... Por favor espera...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>⚡ Generar Escaleta con 1 Clic</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500">
                ¿No tienes API configurada? Puedes configurar tu Gemini API Key en Ajustes o usar la pestaña <strong>Clipboard (Gemini Web)</strong>.
              </p>
            </div>
          )}

          {/* TAB 3: SCRIPT / TIMELINE EDITOR */}
          {activeTab === 'editor' && scriptData && (
            <div className="space-y-6">
              
              {/* Resumen del Guion */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Título del Guion</span>
                    <input
                      type="text"
                      value={scriptData.title || ''}
                      onChange={(e) => setScriptData({ ...scriptData, title: e.target.value })}
                      className="w-full bg-transparent text-base font-bold text-white outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportMarkdown}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                      title="Ver y copiar formato Markdown"
                    >
                      <FileText size={13} />
                      <span>Teleprompter / MD</span>
                    </button>

                    <button
                      onClick={handleSaveScript}
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/30 transition-all"
                    >
                      <Save size={13} />
                      <span>{isSaving ? 'Guardando...' : 'Guardar en Compendio'}</span>
                    </button>
                  </div>
                </div>

                {/* Gancho y CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-[11px] font-bold text-amber-400">🪝 Gancho de Apertura (Hook 0-30s)</label>
                    <textarea
                      value={scriptData.hook || ''}
                      onChange={(e) => setScriptData({ ...scriptData, hook: e.target.value })}
                      className="w-full bg-transparent text-xs text-slate-300 outline-none resize-none h-16"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-[11px] font-bold text-purple-400">🚀 Llamada a la Acción (CTA)</label>
                    <textarea
                      value={scriptData.call_to_action || ''}
                      onChange={(e) => setScriptData({ ...scriptData, call_to_action: e.target.value })}
                      className="w-full bg-transparent text-xs text-slate-300 outline-none resize-none h-16"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline de Secciones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Bloques Temporales & Diapositivas ({scriptData.sections?.length || 0})
                  </h3>
                  <button
                    onClick={() => {
                      const nextTimestamp = `${String(scriptData.sections.length * 2).padStart(2, '0')}:00`;
                      setScriptData({
                        ...scriptData,
                        sections: [
                          ...scriptData.sections,
                          { timestamp: nextTimestamp, title: 'Nuevo Bloque', speaker_notes: '', visual_cue: '', slide_text: '' }
                        ]
                      });
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Añadir Bloque
                  </button>
                </div>

                <div className="space-y-3">
                  {scriptData.sections?.map((sec, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={sec.timestamp || ''}
                            onChange={(e) => handleSectionChange(idx, 'timestamp', e.target.value)}
                            className="w-16 px-2 py-1 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-indigo-300 font-mono font-bold text-xs text-center outline-none"
                            placeholder="00:00"
                          />
                          <input
                            type="text"
                            value={sec.title || ''}
                            onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                            className="flex-1 bg-transparent font-semibold text-sm text-white outline-none border-b border-transparent focus:border-slate-600 transition-colors"
                            placeholder="Título del bloque..."
                          />
                        </div>

                        <button
                          onClick={() => {
                            const filtered = scriptData.sections.filter((_, i) => i !== idx);
                            setScriptData({ ...scriptData, sections: filtered });
                          }}
                          className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Notas del orador */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Guion Verbal / Teleprompter</label>
                          <textarea
                            value={sec.speaker_notes || ''}
                            onChange={(e) => handleSectionChange(idx, 'speaker_notes', e.target.value)}
                            className="w-full bg-slate-900/90 border border-slate-800 focus:border-slate-600 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none h-20"
                            placeholder="Texto que dice el formador..."
                          />
                        </div>

                        {/* Indicación visual & Slide */}
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">👁️ Cámara / Visual</label>
                            <input
                              type="text"
                              value={sec.visual_cue || ''}
                              onChange={(e) => handleSectionChange(idx, 'visual_cue', e.target.value)}
                              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                              placeholder="Plano medio, Gráfico..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-purple-400 uppercase">📊 Diapositiva / Slide</label>
                            <input
                              type="text"
                              value={sec.slide_text || ''}
                              onChange={(e) => handleSectionChange(idx, 'slide_text', e.target.value)}
                              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                              placeholder="Titular + viñetas..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal de Exportación Markdown */}
        {showMarkdownExport && (
          <div className="absolute inset-0 bg-black/90 z-20 flex flex-col p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Guion Markdown Exportable (Teleprompter / YouTube)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedMarkdown ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedMarkdown ? '¡Copiado!' : 'Copiar Markdown'}</span>
                </button>
                <button
                  onClick={() => setShowMarkdownExport(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={markdownText}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 outline-none resize-none select-all"
            />
          </div>
        )}

      </div>
    </div>
  );
}
