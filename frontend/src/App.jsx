import React, { useState, useRef } from 'react';
import { Mic, MicOff, BookOpen, Cpu, Settings, Play, Info, Brain, X, RefreshCw, Save } from 'lucide-react';
import Editor from './components/Editor';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { EventsOn } from '../wailsjs/runtime/runtime';

import { 
  GetConfig, 
  UpdateConfig, 
  ProcessText, 
  ConnectCanva, 
  ProcessDiagramStep, 
  GetDiagramSteps, 
  ResetDiagram, 
  SaveProject,
  GetAvailableWhisperModels,
  GetDownloadedWhisperModels,
  ChangeWhisperModel
} from '../wailsjs/go/main/App';
import IdeaGraph from './components/IdeaGraph';
import { Share2, FileText, ChevronRight } from 'lucide-react';

function App() {
  const [mode, setMode] = useState('Ficción');
  const [isAiMode, setIsAiMode] = useState(false);
  const [config, setConfig] = useState(null);
  const [devices, setDevices] = useState([]);
  const [view, setView] = useState('Escritura'); // 'Escritura' o 'Diagrama'
  const [diagramSteps, setDiagramSteps] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTttInput, setShowTttInput] = useState(false);
  const [tttValue, setTttValue] = useState('');
  
  // Whisper Model Management
  const [availableModels, setAvailableModels] = useState([]);
  const [downloadedModels, setDownloadedModels] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(null); // { model: string, percent: number }
  
  const editorRef = useRef(null);

  const handleTranscribed = (text) => {
    if (editorRef.current) {
      editorRef.current.insertText(text);
    }
  };

  React.useEffect(() => {
    GetConfig().then(setConfig);

    // Cargar modelos de Whisper
    GetAvailableWhisperModels().then(setAvailableModels);
    GetDownloadedWhisperModels().then(setDownloadedModels);

    // Cargar dispositivos al inicio
    window.go.main.App.GetAudioDevices().then(setDevices).catch(console.error);

    console.log("Suscribiendo a eventos...");
    const unsubscribeMcp = EventsOn('mcp:insert_text', (text) => {
      console.log("Evento mcp:insert_text recibido:", text);
      if (editorRef.current) {
        editorRef.current.insertText(text);
      }
    });

    const unsubscribeDownload = EventsOn('whisper:download_progress', (data) => {
      console.log("Progreso de descarga:", data);
      setDownloadProgress(data);
      if (data.percent === 100) {
        setTimeout(() => {
          setDownloadProgress(null);
          window.go.main.App.GetDownloadedWhisperModels().then(setDownloadedModels);
        }, 1000);
      }
    });

    return () => {
      unsubscribeMcp();
      unsubscribeDownload();
    };
  }, []);

  const handleModelChange = async (modelName) => {
    try {
      await ChangeWhisperModel(modelName);
      const newConfig = await GetConfig();
      setConfig(newConfig);
    } catch (err) {
      alert("Error al cambiar modelo: " + err);
    }
  };

  const toggleTtt = async () => {
    const newConfig = { ...config, only_ttt: !config.only_ttt };
    await UpdateConfig(newConfig);
    setConfig(newConfig);
  };

  const { isRecording, status, startRecording, stopRecording } = useAudioRecorder(handleTranscribed, mode, isAiMode);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-white font-inter relative overflow-hidden selection:bg-brand-accent/30">
      {/* Background Ambience - Más sutil y dinámico */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-accent/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Header (Auto-hide) */}
      <div className="fixed top-0 left-0 w-full z-[60] h-2 hover:h-24 group">
        <header className="absolute top-0 w-full h-20 flex items-center justify-between px-8 bg-brand-panel/95 backdrop-blur-xl border-b border-white/10 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 shadow-2xl">
          {/* Left: Logo, Title, Tabs */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold font-outfit shadow-lg shadow-brand-accent/30">
                <span>A</span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight font-outfit hidden lg:block">Antigravity Writer</h1>
            </div>

            <div className="flex bg-black/30 p-1 rounded-full border border-white/5">
              <button
                onClick={() => setView('Escritura')}
                className={`flex items-center gap-2 px-6 py-1.5 rounded-full transition-all duration-300 text-sm font-medium ${
                  view === 'Escritura' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span>Escritura</span>
              </button>
              <button
                onClick={() => setView('Diagrama')}
                className={`flex items-center gap-2 px-6 py-1.5 rounded-full transition-all duration-300 text-sm font-medium ${
                  view === 'Diagrama' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Share2 size={16} />
                <span>Diagrama</span>
              </button>
            </div>
          </div>

          {/* Center: Action Buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            <div className="flex flex-col items-center gap-1 group/btn">
              <button
                onClick={() => {
                  if (config?.only_ttt) {
                    setIsAiMode(false);
                    setShowTttInput(!showTttInput || isAiMode);
                  } else {
                    if (isRecording) stopRecording();
                    else { setIsAiMode(false); startRecording(); }
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  (isRecording && !isAiMode) || (showTttInput && !isAiMode) 
                  ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                  : 'bg-brand-accent hover:bg-brand-accent-hover shadow-lg shadow-brand-accent/30'
                } transform hover:scale-110 active:scale-95`}
              >
                {(isRecording && !isAiMode) || (showTttInput && !isAiMode) ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                (isRecording && !isAiMode) || (showTttInput && !isAiMode) ? 'text-red-400' : 'text-gray-400 group-hover/btn:text-white'
              }`}>
                {config?.only_ttt ? 'Escribir' : (isRecording && !isAiMode ? 'Detener' : 'Dictar')}
              </span>
            </div>

            <div className="w-[1px] h-8 bg-white/10" />
            
            <div className="flex flex-col items-center gap-1 group/btn">
              <button
                onClick={() => {
                  if (config?.only_ttt) {
                    setIsAiMode(true);
                    setShowTttInput(!showTttInput || !isAiMode);
                  } else {
                    if (isRecording) stopRecording();
                    else { setIsAiMode(true); startRecording(); }
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  (isRecording && isAiMode) || (showTttInput && isAiMode) 
                  ? 'bg-amber-500 shadow-lg shadow-amber-500/30' 
                  : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/30'
                } transform hover:scale-110 active:scale-95`}
              >
                <Brain size={20} />
              </button>
              <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                (isRecording && isAiMode) || (showTttInput && isAiMode) ? 'text-amber-400' : 'text-gray-400 group-hover/btn:text-white'
              }`}>
                {isAiMode && showTttInput ? 'Enviar' : 'Cerebro'}
              </span>
            </div>

            <div className="w-[1px] h-8 bg-white/10" />

            <div className="w-[1px] h-8 bg-white/10" />

            <button className="flex flex-col items-center gap-1 group/btn">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/btn:bg-white/10 group-hover/btn:text-white transition-all transform group-hover/btn:rotate-12">
                <Play size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover/btn:text-white transition-colors">Escuchar</span>
            </button>

            <div className="w-[1px] h-8 bg-white/10" />

            <button 
              className="flex flex-col items-center gap-1 group/btn"
              onClick={async () => {
                const content = editorRef.current?.getContent() || '';
                const jsonDiagram = JSON.stringify(diagramSteps);
                try {
                  const path = await SaveProject(content, jsonDiagram);
                  if (path) {
                    alert(`Proyecto guardado en:\n${path}`);
                  }
                } catch (e) {
                  alert(`Error al guardar: ${e}`);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/btn:bg-indigo-500/20 group-hover/btn:text-indigo-400 transition-all transform group-hover/btn:-translate-y-1">
                <Save size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover/btn:text-indigo-400 transition-colors">Guardar</span>
            </button>
          </div>

          {/* Right: Settings */}
          <div className="flex items-center">
            <button 
              className="p-2 text-gray-400 hover:text-white transition-colors" 
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </button>
          </div>
          
          {/* TTT Input Dropdown */}
          {showTttInput && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[500px] bg-brand-panel/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
              <input
                autoFocus
                className="w-full bg-transparent border-none outline-none text-lg text-white placeholder-gray-500"
                placeholder={isAiMode ? "Instrucción para la IA..." : "Escribe para dictar..."}
                value={tttValue}
                onChange={(e) => setTttValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    ProcessText(tttValue, isAiMode);
                    setTttValue('');
                    setShowTttInput(false);
                  } else if (e.key === 'Escape') {
                    setShowTttInput(false);
                  }
                }}
              />
            </div>
          )}
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full h-screen z-10 transition-all duration-700 bg-brand-panel/40 backdrop-blur-md">
        <div className="w-full h-full flex flex-col overflow-hidden relative transition-all duration-500">
          
          {view === 'Escritura' ? (
            <Editor 
              ref={editorRef} 
              initialContent={editorContent} 
              onUpdate={setEditorContent} 
            />
          ) : (
            <IdeaGraph steps={diagramSteps} />
          )}

          {/* Botón flotante para procesar diagrama */}
          {view === 'Escritura' && (
            <button
              onClick={async () => {
                setIsProcessing(true);
                const content = editorRef.current?.getContent() || '';
                // Extraer párrafos limpios
                const paragraphs = content
                  .replace(/<p>/g, '')
                  .split('</p>')
                  .map(p => p.replace(/<[^>]*>/g, '').trim())
                  .filter(p => p.length > 5); // Evitar párrafos vacíos o muy cortos

                const newParagraphs = paragraphs.slice(processedCount);
                
                if (newParagraphs.length > 0) {
                  try {
                    let lastSteps = "";
                    for (const p of newParagraphs) {
                      lastSteps = await ProcessDiagramStep(p);
                    }
                    setDiagramSteps(JSON.parse(lastSteps));
                    setProcessedCount(paragraphs.length);
                    setView('Diagrama');
                  } catch (err) {
                    console.error("Error procesando diagrama:", err);
                    alert("Error en el análisis: " + err);
                  }
                } else {
                  console.log("No hay párrafos nuevos para procesar");
                  setView('Diagrama'); // Al menos cambiar de vista si ya está procesado
                }
                setIsProcessing(false);
              }}
              disabled={isProcessing}
              className="absolute top-4 right-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 transition-all group z-30"
            >
              <RefreshCw size={16} className={isProcessing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span>{isProcessing ? 'Procesando...' : 'Analizar último párrafo'}</span>
            </button>
          )}
          
          {/* Status Bar */}
          <div className="h-10 px-6 flex items-center justify-between bg-black/20 text-xs text-gray-400 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className="font-medium">{config?.only_ttt ? 'Modo Solo Texto (TTT)' : status}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Info size={12} />
                <span>{config?.whisper?.use_local ? 'Local' : 'Remote'} | {config?.whisper?.language}</span>
              </div>
            </div>
          </div>
        </div>
      </main>



      {/* Settings Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-brand-panel/95 backdrop-blur-3xl border-l border-white/5 shadow-2xl transition-transform duration-500 z-[60] ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold font-outfit">Configuración</h2>
          <button className="p-2 text-gray-400 hover:text-white transition-colors" onClick={() => setShowSettings(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-8 pb-32">
          {/* General Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent">General</h3>
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <span className="text-sm font-medium">Modo Solo Texto (TTT)</span>
              <button 
                onClick={toggleTtt}
                className={`w-12 h-6 rounded-full transition-colors relative ${config?.only_ttt ? 'bg-brand-accent' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config?.only_ttt ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>

          {/* Whisper Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent">Whisper (Voz a Texto)</h3>
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-gray-300">Usar Whisper Local</span>
              <button 
                onClick={() => {
                  const nc = { ...config };
                  nc.whisper.use_local = !nc.whisper.use_local;
                  setConfig(nc);
                  UpdateConfig(nc);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${config?.whisper?.use_local ? 'bg-brand-accent' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config?.whisper?.use_local ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 px-1">Idioma (es, en, auto)</label>
              <input 
                type="text" 
                value={config?.whisper?.language || ''} 
                onChange={(e) => {
                  const nc = { ...config };
                  nc.whisper.language = e.target.value;
                  setConfig(nc);
                }}
                onBlur={() => UpdateConfig(config)}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            {config?.whisper?.use_local ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 px-1">Modelo Local</label>
                  <div className="relative group">
                    <select 
                      value={config?.whisper?.local?.model || 'tiny'} 
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors appearance-none cursor-pointer"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m} className="bg-brand-bg">
                          {m.toUpperCase()} {downloadedModels.includes(m) ? '✓' : '(Requiere descarga)'}
                        </option>
                      ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors rotate-90" />
                  </div>
                  
                  {/* Download Progress Bar */}
                  {downloadProgress && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-brand-accent">Descargando {downloadProgress.model}...</span>
                        <span>{downloadProgress.percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-accent transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--brand-accent-rgb),0.5)]"
                          style={{ width: `${downloadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 px-1">Hilos CPU (Threads)</label>
                  <input 
                    type="number" 
                    value={config?.whisper?.local?.threads || 4} 
                    onChange={(e) => {
                      const nc = { ...config };
                      nc.whisper.local.threads = parseInt(e.target.value);
                      setConfig(nc);
                    }}
                    onBlur={() => UpdateConfig(config)}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 px-1">URL Whisper Remoto</label>
                <input 
                  type="text" 
                  value={config?.whisper?.remote?.url || ''} 
                  onChange={(e) => {
                    const nc = { ...config };
                    nc.whisper.remote.url = e.target.value;
                    setConfig(nc);
                  }}
                  onBlur={() => UpdateConfig(config)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            )}
          </section>

          {/* AI Services Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent">Servicios IA</h3>
            
            {/* GLiNER Section */}
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Extracción Local (GLiNER2)</span>
                  <span className="text-[10px] text-gray-500">Usa tu hardware para diagramas</span>
                </div>
                <button 
                  onClick={() => {
                    const nc = { ...config };
                    nc.gliner.use_local = !nc.gliner.use_local;
                    setConfig(nc);
                    UpdateConfig(nc);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config?.gliner?.use_local ? 'bg-brand-accent' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config?.gliner?.use_local ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {config?.gliner?.use_local && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-medium text-gray-500">Sensibilidad (Threshold)</label>
                    <span className="text-[11px] font-mono text-brand-accent">{config?.gliner?.threshold?.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.05"
                    value={config?.gliner?.threshold || 0.3} 
                    onChange={(e) => {
                      const nc = { ...config };
                      nc.gliner.threshold = parseFloat(e.target.value);
                      setConfig(nc);
                    }}
                    onMouseUp={() => UpdateConfig(config)}
                    className="w-full accent-brand-accent h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 px-1">URL del LLM</label>
              <input 
                type="text" 
                value={config?.llm_url || ''} 
                onChange={(e) => {
                  const nc = { ...config };
                  nc.llm_url = e.target.value;
                  setConfig(nc);
                }}
                onBlur={() => UpdateConfig(config)}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 px-1">URL de Kokoro (TTS)</label>
              <input 
                type="text" 
                value={config?.kokoro_url || ''} 
                onChange={(e) => {
                  const nc = { ...config };
                  nc.kokoro_url = e.target.value;
                  setConfig(nc);
                }}
                onBlur={() => UpdateConfig(config)}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent">Hardware</h3>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 px-1">Dispositivo de Grabación</label>
              <select 
                value={config?.recording_device || ''} 
                onChange={(e) => {
                  const nc = { ...config, recording_device: e.target.value };
                  setConfig(nc);
                  UpdateConfig(nc);
                }}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-accent transition-colors appearance-none cursor-pointer"
              >
                {devices.length === 0 ? (
                  <option value="">Detectando dispositivos...</option>
                ) : (
                  devices.map((d, i) => (
                    <option key={i} value={d} className="bg-brand-bg text-white">{d}</option>
                  ))
                )}
              </select>
              <p className="text-[10px] text-gray-500 px-1 italic">
                Selecciona el micrófono que quieres usar para el dictado.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Overlay */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
          onClick={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}

export default App;
