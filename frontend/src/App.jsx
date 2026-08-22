import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, BookOpen, Cpu, Settings, Play, Info, Brain, X, RefreshCw, Save, GitBranch, History, FolderPlus, FolderOpen, FilePlus, Layers, Volume2, Sparkles, Globe } from 'lucide-react';
import Editor from './components/Editor';
import ProjectSidebar from './components/ProjectSidebar';
import TimelineModal from './components/TimelineModal';
import NewCompendiumModal from './components/NewCompendiumModal';
import NewFileModal from './components/NewFileModal';
import NewModuleModal from './components/NewModuleModal';
import EditModuleModal from './components/EditModuleModal';
import EditFileModal from './components/EditFileModal';
import NewJournalEntryModal from './components/NewJournalEntryModal';
import SitePreviewModal from './components/SitePreviewModal';
import CompendiumWizardModal from './components/CompendiumWizardModal';
import WorkspaceSelector from './components/WorkspaceSelector';
import ModelManagerModal from './components/ModelManagerModal';
import { asciidocToHtml, htmlToAsciidoc } from './utils/asciidoc';
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
  ChangeWhisperModel,
  GetAudioDevices,
  SaveDiagramStep,
  SelectFolderDialog,
  CreateCompendium,
  OpenCompendium,
  GetActiveCompendium,
  GetCompendiumTree,
  ReadCompendiumFile,
  SaveCompendiumFile,
  GetFileTimeline,
  CloseCompendium,
  ConvertDraftToCompendium,
  GetRecentCompendiums,
  GetInitialSessionState,
  DeleteCompendiumModule,
  DeleteCompendiumFile
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
  const [showSettings, setShowSettings] = useState(false);

  // Compendium and Workspace State
  const [activeCompendium, setActiveCompendium] = useState(null);
  const [recentCompendiums, setRecentCompendiums] = useState([]);
  const [fileTree, setFileTree] = useState([]);
  const [activeFile, setActiveFile] = useState('');
  const [showNewCompendiumModal, setShowNewCompendiumModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [editingFileNode, setEditingFileNode] = useState(null);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewJournalModal, setShowNewJournalModal] = useState(false);
  const [showSitePreviewModal, setShowSitePreviewModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showModelManagerModal, setShowModelManagerModal] = useState(false);
  const [initialDraftToConvert, setInitialDraftToConvert] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const editorRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const handleTranscribed = (text) => {
    if (editorRef.current) {
      editorRef.current.insertText(text);
    }
  };

  const refreshTree = async () => {
    try {
      const tree = await GetCompendiumTree();
      setFileTree(tree || []);
      const comp = await GetActiveCompendium();
      setActiveCompendium(comp);
      const recents = await GetRecentCompendiums();
      setRecentCompendiums(recents || []);
    } catch (e) {
      console.error("Error refreshing compendium tree:", e);
    }
  };

  const handleSelectFile = async (relPath) => {
    try {
      const rawContent = await ReadCompendiumFile(relPath);
      setActiveFile(relPath);
      const htmlContent = (relPath.endsWith('.adoc') || relPath.endsWith('.md'))
        ? asciidocToHtml(rawContent)
        : rawContent;
      setEditorContent(htmlContent);
      if (editorRef.current) {
        editorRef.current.setContent(htmlContent);
      }
    } catch (err) {
      alert("Error abriendo archivo: " + err);
    }
  };

  const handleOpenCompendium = async () => {
    try {
      const dir = await SelectFolderDialog("Seleccionar Carpeta del Compendio");
      if (dir) {
        const info = await OpenCompendium(dir);
        setActiveCompendium(info);
        await refreshTree();
        const defaultSession = "content/modulo-1/sesion-01.adoc";
        handleSelectFile(defaultSession);
      }
    } catch (err) {
      alert("Error abriendo compendio: " + err);
    }
  };

  const handleSelectRecent = async (path) => {
    try {
      const info = await OpenCompendium(path);
      setActiveCompendium(info);
      await refreshTree();
      const defaultSession = "content/modulo-1/sesion-01.adoc";
      handleSelectFile(defaultSession);
    } catch (err) {
      alert("Error abriendo compendio reciente: " + err);
    }
  };

  const handleCloseCompendium = async () => {
    try {
      await CloseCompendium();
      setActiveCompendium(null);
      setActiveFile('');
      setFileTree([]);
      // Cargar borrador libre guardado en localStorage si existe
      const cachedDraft = localStorage.getItem('antigravity_free_draft') || '';
      setEditorContent(cachedDraft);
      if (editorRef.current) {
        editorRef.current.setContent(cachedDraft);
      }
      const recents = await GetRecentCompendiums();
      setRecentCompendiums(recents || []);
    } catch (err) {
      console.error("Error cerrando compendio:", err);
    }
  };

  const handleConvertDraft = () => {
    setInitialDraftToConvert(editorContent);
    setShowNewCompendiumModal(true);
  };

  const handleEditorUpdate = (html) => {
    setEditorContent(html);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (activeCompendium && activeFile) {
      // Auto-save con debounce de 3 segundos
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveCompendium();
      }, 3000);
    } else {
      // Persistir borrador libre en localStorage
      localStorage.setItem('antigravity_free_draft', html);
    }
  };

  const handleSaveCompendium = async () => {
    if (!activeCompendium || !activeFile) {
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
      return;
    }

    setIsSaving(true);
    try {
      const html = editorRef.current?.getContent() || editorContent;
      const fileName = activeFile.split('/').pop();
      const contentToSave = (activeFile.endsWith('.adoc') || activeFile.endsWith('.md'))
        ? htmlToAsciidoc(html)
        : html;
      await SaveCompendiumFile(activeFile, contentToSave, `Guardar ${fileName}`);
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      await refreshTree();
    } catch (err) {
      alert("Error guardando en Git: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (historicalContent, commit) => {
    const htmlContent = (activeFile.endsWith('.adoc') || activeFile.endsWith('.md'))
      ? asciidocToHtml(historicalContent)
      : historicalContent;
    if (editorRef.current) {
      editorRef.current.setContent(htmlContent);
    }
    setEditorContent(htmlContent);
    if (activeCompendium && activeFile) {
      await SaveCompendiumFile(activeFile, historicalContent, `Restaurar versión ${commit.short_hash}`);
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      await refreshTree();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCompendium();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCompendium, activeFile]);

  React.useEffect(() => {
    GetConfig().then(cfg => setConfig(cfg || {}));
    
    // Auto-recuperar sesión y compendios recientes
    GetInitialSessionState().then(state => {
      if (state) {
        if (state.recent_compendiums) {
          setRecentCompendiums(state.recent_compendiums);
        }
        if (state.active_compendium) {
          setActiveCompendium(state.active_compendium);
          setActiveFile(state.active_file || 'content/modulo-1/sesion-01.adoc');
          if (state.initial_content) {
            const htmlContent = (state.active_file?.endsWith('.adoc') || state.active_file?.endsWith('.md'))
              ? asciidocToHtml(state.initial_content)
              : state.initial_content;
            setEditorContent(htmlContent);
            if (editorRef.current) {
              editorRef.current.setContent(htmlContent);
            }
          }
          refreshTree();
        } else {
          // Cargar borrador libre guardado en localStorage si existe
          const cachedDraft = localStorage.getItem('antigravity_free_draft');
          if (cachedDraft) {
            setEditorContent(cachedDraft);
            if (editorRef.current) {
              editorRef.current.setContent(cachedDraft);
            }
          }
        }
      }
    }).catch(err => console.error("Error cargando sesión:", err));

    // Cargar modelos de Whisper
    GetAvailableWhisperModels().then(m => setAvailableModels(m || [])).catch(() => setAvailableModels([]));
    GetDownloadedWhisperModels().then(m => setDownloadedModels(m || [])).catch(() => setDownloadedModels([]));
    
    // Cargar pasos del diagrama
    GetDiagramSteps().then(json => {
      if (json) {
        try {
          const steps = JSON.parse(json);
          setDiagramSteps(steps || []);
          setProcessedCount((steps || []).length);
        } catch (e) {
          console.error(e);
        }
      }
    });

    // Cargar dispositivos al inicio
    GetAudioDevices().then(d => setDevices(d || [])).catch(() => setDevices([]));

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
          GetDownloadedWhisperModels().then(setDownloadedModels);
        }, 1000);
      }
    });

    const unsubscribeDiagram = EventsOn('diagram:step_added', (json) => {
      console.log("Evento diagram:step_added recibido");
      if (json) setDiagramSteps(JSON.parse(json));
    });

    return () => {
      unsubscribeMcp();
      unsubscribeDownload();
      unsubscribeDiagram();
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

  const handleEditModule = (mod) => {
    setEditingModule(mod);
    setShowEditModuleModal(true);
  };

  const handleDeleteModule = async (moduleSlug) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el módulo "${moduleSlug}" y todas sus lecciones? Esta acción creará un commit en Git.`)) {
      try {
        await DeleteCompendiumModule(moduleSlug);
        await refreshTree();
        if (activeFile && activeFile.startsWith(`content/${moduleSlug}/`)) {
          setActiveFile('');
          setEditorContent('');
          if (editorRef.current) {
            editorRef.current.setContent('');
          }
        }
      } catch (err) {
        alert("Error eliminando módulo: " + err);
      }
    }
  };

  const handleEditFile = (fileNode) => {
    setEditingFileNode(fileNode);
    setShowEditFileModal(true);
  };

  const handleDeleteFile = async (relPath) => {
    try {
      await DeleteCompendiumFile(relPath);
      await refreshTree();
      if (activeFile === relPath) {
        setActiveFile('');
        setEditorContent('');
        if (editorRef.current) {
          editorRef.current.setContent('');
        }
      }
    } catch (err) {
      alert("Error eliminando archivo: " + err);
    }
  };


  return (
    <div className="flex flex-col h-screen w-screen bg-brand-bg text-white font-inter overflow-hidden select-none">
      {/* Background Ambience sutil */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-accent/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Header Fijo y Limpio (Sin solapamientos ni auto-hide invasivo) */}
      <header className="w-full h-14 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between px-4 z-40 shrink-0 shadow-md backdrop-blur-md relative">
        
        {/* Zona 1: Contexto y Navegación (Izquierda) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center font-bold font-outfit shadow-md shadow-brand-accent/30 text-sm">
              <span>A</span>
            </div>
            <h1 className="text-sm font-semibold tracking-tight font-outfit hidden xl:block">Antigravity Writer</h1>
            
            {/* Workspace Selector Dropdown */}
            <WorkspaceSelector
              activeCompendium={activeCompendium}
              recentCompendiums={recentCompendiums}
              onSelectRecent={handleSelectRecent}
              onNewCompendium={() => {
                setInitialDraftToConvert('');
                setShowNewCompendiumModal(true);
              }}
              onOpenWizard={() => {
                setShowWizardModal(true);
              }}
              onOpenFolder={handleOpenCompendium}
              onCloseCompendium={handleCloseCompendium}
              onConvertDraft={handleConvertDraft}
              hasDraftContent={Boolean(editorContent && editorContent.trim() && editorContent !== '<p></p>')}
            />
          </div>

          {/* Selector de Vista (Escritura / Grafo) */}
          <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setView('Escritura')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-xs font-medium ${
                view === 'Escritura' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={13} />
              <span>Escritura</span>
            </button>
            <button
              onClick={() => setView('Diagrama')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-xs font-medium ${
                view === 'Diagrama' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 size={13} />
              <span>Diagrama</span>
            </button>
          </div>
        </div>

        {/* Zona 2: Cápsula Central de Captura e IA (Centro) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 shadow-md">
          {/* Dictar / Mic */}
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              (isRecording && !isAiMode) || (showTttInput && !isAiMode)
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
            title={config?.only_ttt ? 'Escribir texto libre' : 'Dictado por voz'}
          >
            {(isRecording && !isAiMode) || (showTttInput && !isAiMode) ? <MicOff size={14} /> : <Mic size={14} />}
            <span>{config?.only_ttt ? 'Escribir' : (isRecording && !isAiMode ? 'Detener' : 'Dictar')}</span>
          </button>

          {/* Cerebro / IA */}
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              (isRecording && isAiMode) || (showTttInput && isAiMode)
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20'
            }`}
            title="Modo Asistente / Cerebro IA"
          >
            <Brain size={14} />
            <span>{isAiMode && showTttInput ? 'Enviar' : 'Cerebro'}</span>
          </button>

          {/* Escuchar / TTS */}
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Lectura en voz alta de la sesión"
          >
            <Volume2 size={13} />
            <span>Escuchar</span>
          </button>
        </div>

        {/* Zona 3: Persistencia, Git y Ajustes (Derecha) */}
        <div className="flex items-center gap-2">
          {/* Botón Previsualizar Sitio Web (Hugo) */}
          {activeCompendium && (
            <button
              onClick={() => setShowSitePreviewModal(true)}
              title="Previsualizar sitio web del curso y blog DevLog (Hugo)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all shadow-sm"
            >
              <Globe size={13} className="text-indigo-400" />
              <span>Previsualizar</span>
            </button>
          )}

          {/* Botón Guardar */}
          <button
            onClick={handleSaveCompendium}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSaving
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:text-white'
            }`}
            title={activeFile ? `Guardar ${activeFile} en Git (Ctrl+S)` : 'Guardar borrador'}
          >
            <Save size={14} className={isSaving ? 'animate-spin' : ''} />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>

          {/* Badge Git */}
          {activeCompendium && (
            <button
              onClick={() => setShowTimelineModal(true)}
              title="Historial de versiones Git (Deshacer infinito)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
            >
              <GitBranch size={13} className="text-emerald-400" />
              <span className="font-mono text-[11px] text-emerald-300">
                {activeCompendium.last_commit ? activeCompendium.last_commit.substring(0, 7) : 'main'}
              </span>
            </button>
          )}

          {/* Settings */}
          <button 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
            onClick={() => setShowSettings(true)}
            title="Configuración"
          >
            <Settings size={17} />
          </button>
        </div>
        
        {/* TTT Input Dropdown */}
        {showTttInput && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-slate-900/98 backdrop-blur-2xl border border-slate-800 rounded-xl p-3 shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-150">
            <input
              autoFocus
              className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500"
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

      {/* Workspace Area: ProjectSidebar + Main Content */}
      <div className="flex-1 flex flex-row w-full overflow-hidden">
        <ProjectSidebar
          activeCompendium={activeCompendium}
          fileTree={fileTree}
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
          onNewCompendium={() => setShowNewCompendiumModal(true)}
          onOpenWizard={() => setShowWizardModal(true)}
          onOpenCompendium={handleOpenCompendium}
          onNewFile={() => setShowNewFileModal(true)}
          onNewModule={() => setShowNewModuleModal(true)}
          onEditModule={handleEditModule}
          onDeleteModule={handleDeleteModule}
          onEditFile={handleEditFile}
          onDeleteFile={handleDeleteFile}
          onNewJournalEntry={() => setShowNewJournalModal(true)}
          onOpenTimeline={() => setShowTimelineModal(true)}
          lastSaved={lastSavedTime}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full z-10 bg-slate-950/40 overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden relative">
            
            {view === 'Escritura' ? (
              <Editor 
                ref={editorRef} 
                initialContent={editorContent} 
                onUpdate={handleEditorUpdate} 
              />
            ) : (
              <IdeaGraph steps={diagramSteps} />
            )}
            
            {/* Status Bar */}
            <div className="h-9 px-4 flex items-center justify-between bg-slate-950/90 text-xs text-slate-400 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="font-medium text-[11px]">{config?.only_ttt ? 'Modo Solo Texto (TTT)' : status}</span>
                </div>
                {activeFile && (
                  <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                    {activeFile}
                  </span>
                )}
                {lastSavedTime && (
                  <span className="text-[10px] text-slate-500">
                    Guardado: {lastSavedTime}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Botón no intrusivo para procesar diagrama */}
                {view === 'Escritura' && (
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      const content = editorRef.current?.getContent() || '';
                      const paragraphs = content
                        .replace(/<p>/g, '')
                        .split('</p>')
                        .map(p => p.replace(/<[^>]*>/g, '').trim())
                        .filter(p => p.length > 5);

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
                        setView('Diagrama');
                      }
                      setIsProcessing(false);
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isProcessing ? 'Analizando...' : 'Analizar en Grafo'}</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-[11px]">
                  <Info size={11} />
                  <span>{config?.whisper?.use_local ? 'Local' : 'Remote'} | {config?.whisper?.language}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modales Punto 1.1, 1.2, 1.3 y Workspaces */}
      <CompendiumWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        onCompendiumGenerated={async (info) => {
          setActiveCompendium(info);
          setInitialDraftToConvert('');
          await refreshTree();
          const tree = await GetCompendiumTree();
          if (tree && tree.length > 0) {
            // Select first session found
            let firstFile = '';
            for (const n of tree) {
              if (n.category === 'content' && n.children) {
                for (const mod of n.children) {
                  if (mod.children) {
                    for (const f of mod.children) {
                      if (f.name.endsWith('.adoc') && f.name !== '_index.adoc') {
                        firstFile = f.relative_path;
                        break;
                      }
                    }
                  }
                  if (firstFile) break;
                }
              }
              if (firstFile) break;
            }
            if (firstFile) handleSelectFile(firstFile);
          }
        }}
      />

      <NewCompendiumModal
        isOpen={showNewCompendiumModal}
        onClose={() => setShowNewCompendiumModal(false)}
        initialDraft={initialDraftToConvert}
        onCompendiumCreated={async (info) => {
          setActiveCompendium(info);
          setInitialDraftToConvert('');
          await refreshTree();
          const defaultSession = "content/modulo-1/sesion-01.adoc";
          handleSelectFile(defaultSession);
        }}
      />

      <NewModuleModal
        isOpen={showNewModuleModal}
        onClose={() => setShowNewModuleModal(false)}
        onModuleCreated={async () => {
          await refreshTree();
        }}
      />

      <EditModuleModal
        isOpen={showEditModuleModal}
        module={editingModule}
        onClose={() => {
          setShowEditModuleModal(false);
          setEditingModule(null);
        }}
        onModuleUpdated={async () => {
          await refreshTree();
        }}
      />

      <EditFileModal
        isOpen={showEditFileModal}
        fileNode={editingFileNode}
        onClose={() => {
          setShowEditFileModal(false);
          setEditingFileNode(null);
        }}
        onFileUpdated={async (finalPath) => {
          await refreshTree();
          handleSelectFile(finalPath);
        }}
      />


      <NewJournalEntryModal
        isOpen={showNewJournalModal}
        onClose={() => setShowNewJournalModal(false)}
        onEntryCreated={async (relPath) => {
          await refreshTree();
          handleSelectFile(relPath);
        }}
      />

      <SitePreviewModal
        isOpen={showSitePreviewModal}
        onClose={() => setShowSitePreviewModal(false)}
        compendiumInfo={activeCompendium}
        onSelectFile={handleSelectFile}
      />

      <NewFileModal
        isOpen={showNewFileModal}
        onClose={() => setShowNewFileModal(false)}
        onFileCreated={async (relPath) => {
          await refreshTree();
          handleSelectFile(relPath);
        }}
      />

      <TimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        activeFile={activeFile}
        onRestoreVersion={handleRestoreVersion}
      />

      <ModelManagerModal
        isOpen={showModelManagerModal}
        onClose={() => setShowModelManagerModal(false)}
      />

      {/* Settings Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-brand-panel/95 backdrop-blur-3xl border-l border-white/5 shadow-2xl transition-transform duration-500 z-[60] ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold font-outfit">Configuración</h2>
          <button className="p-2 text-gray-400 hover:text-white transition-colors" onClick={() => setShowSettings(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto space-y-8 pb-32">
          {/* Updates & Model Hub Banner */}
          <div className="bg-gradient-to-r from-brand-accent/20 to-purple-500/10 border border-brand-accent/30 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles size={14} className="text-brand-accent" />
                <span>Actualizaciones y Modelos</span>
              </div>
              <p className="text-[11px] text-gray-400">Verificar versiones y pesos de IA</p>
            </div>
            <button
              onClick={() => {
                setShowSettings(false);
                setShowModelManagerModal(true);
              }}
              className="px-3 py-1.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
            >
              Abrir
            </button>
          </div>

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
                {(devices || []).length === 0 ? (
                  <option value="">Detectando dispositivos...</option>
                ) : (
                  (devices || []).map((d, i) => (
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
