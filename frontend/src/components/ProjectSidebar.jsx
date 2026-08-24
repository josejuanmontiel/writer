import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, 
  FolderOpen, 
  FilePlus, 
  Folder, 
  FolderCheck, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  GitBranch, 
  History, 
  Clock, 
  BookMarked,
  Sparkles,
  Layers,
  Archive,
  Compass,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Mic
} from 'lucide-react';

export default function ProjectSidebar({
  activeCompendium,
  fileTree,
  activeFile,
  onSelectFile,
  onNewCompendium,
  onOpenWizard,
  onOpenCompendium,
  onNewFile,
  onNewModule,
  onEditModule,
  onDeleteModule,
  onEditFile,
  onDeleteFile,
  onNewJournalEntry,
  onNewUnassignedTopic,
  onQuickVoiceCapture,
  onOpenPlacementAssistant,
  onOpenTimeline,
  lastSaved
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('antigravity_sidebar_collapsed') === 'true';
  });
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('antigravity_sidebar_width');
    return saved ? parseInt(saved, 10) : 300;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('antigravity_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('antigravity_sidebar_width', width.toString());
  }, [width]);

  // Resizing mouse events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.min(650, Math.max(220, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const toggleCategory = (path) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getCategoryIcon = (categoryName) => {
    if (categoryName.includes('Contenido')) return <Layers className="w-4 h-4 text-indigo-400" />;
    if (categoryName.includes('Ideas Flotantes')) return <Sparkles className="w-4 h-4 text-amber-400" />;
    if (categoryName.includes('Diario')) return <BookMarked className="w-4 h-4 text-emerald-400" />;
    if (categoryName.includes('Plantillas')) return <Archive className="w-4 h-4 text-purple-400" />;
    return <Folder className="w-4 h-4 text-slate-400" />;
  };

  const isModuleFolder = (relPath) => {
    return relPath.startsWith('content/') && relPath !== 'content/unassigned' && relPath !== 'content/journal' && relPath.split('/').length === 2;
  };

  // Render tree item
  const renderTree = (nodes) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <ul className="space-y-0.5">
        {nodes.map((node) => {
          const isSelected = activeFile === node.relative_path;
          const isCategoryCollapsed = collapsedCategories[node.relative_path];
          const isModule = isModuleFolder(node.relative_path);

          if (node.is_dir) {
            return (
              <li key={node.relative_path} className="group/item">
                <div 
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    isModule ? 'bg-slate-900/50 border border-slate-800/80 mb-1' : ''
                  }`}
                  onClick={() => toggleCategory(node.relative_path)}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    <span className="text-slate-500">
                      {isCategoryCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                    {getCategoryIcon(node.name)}
                    <span className={`truncate font-medium ${isModule ? 'text-indigo-300 font-semibold' : 'text-slate-300'}`}>
                      {node.name}
                    </span>
                  </div>

                  {/* Acciones de Módulo: Editar / Eliminar */}
                  {isModule && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const slug = node.relative_path.replace('content/', '');
                          if (onEditModule) {
                            onEditModule({
                              slug: slug,
                              title: node.name,
                              path: node.relative_path
                            });
                          }
                        }}
                        title="Editar nombre y metadatos del módulo"
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const slug = node.relative_path.replace('content/', '');
                          if (window.confirm(`¿Estás seguro de eliminar el módulo "${node.name}" y todos sus archivos? Esta acción quedará registrada en Git.`)) {
                            if (onDeleteModule) {
                              onDeleteModule(slug);
                            }
                          }
                        }}
                        title="Eliminar módulo"
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Acciones para Bandeja de Ideas Flotantes */}
                  {(node.relative_path === 'content/unassigned' || node.name.includes('Ideas Flotantes')) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {onQuickVoiceCapture && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickVoiceCapture();
                          }}
                          title="Captura Rápida de Voz (Whisper Directo a Flotante)"
                          className="p-1 rounded hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Mic className="w-3 h-3" />
                        </button>
                      )}
                      {onNewUnassignedTopic && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewUnassignedTopic();
                          }}
                          title="Crear nuevo tema o idea flotante (Staging)"
                          className="p-1 rounded hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <FilePlus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {node.children && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                      node.name.includes('Ideas Flotantes') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {node.children.length}
                    </span>
                  )}
                </div>
                {!isCategoryCollapsed && node.children && (
                  <div className="border-l border-slate-800 ml-3.5 pl-1 my-1">
                    {renderTree(node.children)}
                  </div>
                )}
              </li>
            );
          }

          // File Node
          const isUnassigned = node.relative_path.startsWith('content/unassigned/') || node.relative_path.includes('/unassigned/');

          return (
            <li key={node.relative_path} className="group/file">
              <div
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all ${
                  isSelected 
                    ? isUnassigned
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                      : 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm' 
                    : isUnassigned
                      ? 'text-amber-200/80 hover:bg-amber-950/20 hover:text-amber-200'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <button
                  onClick={() => onSelectFile(node.relative_path)}
                  className="flex items-center gap-2 truncate flex-1 text-left"
                >
                  {isUnassigned ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-amber-500/70'}`} />
                      {node.readiness === 'ready' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="🟢 Listo para ubicar en el curso" />
                      )}
                      {node.readiness === 'blocked' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="🟡 Requiere prerrequisitos previos" />
                      )}
                      {node.readiness === 'root' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="🟣 Concepto raíz independiente" />
                      )}
                    </div>
                  ) : (
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  )}
                  <span className="truncate">{node.name}</span>
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                  {isUnassigned && onOpenPlacementAssistant && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPlacementAssistant(node.relative_path);
                      }}
                      title="Asistente de Reubicación por Dependencias (Punto 1.4)"
                      className="p-1 rounded hover:bg-amber-900/40 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onEditFile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFile(node);
                      }}
                      title="Editar título didáctico / renombrar tema"
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteFile && node.name !== '_index.adoc' && node.name !== '_index.md' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Estás seguro de eliminar el archivo "${node.name}"? Esta acción se registrará en Git.`)) {
                          onDeleteFile(node.relative_path);
                        }
                      }}
                      title="Eliminar tema/sesión"
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  {isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1 ${isUnassigned ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // 1. ESTADO COLAPSADO (SLIM BAR)
  if (isCollapsed) {
    return (
      <aside className="w-14 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full items-center py-3 justify-between select-none shrink-0 z-20">
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expandir barra lateral (Compendio y Estructura)"
            className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-105"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>

          <div className="w-8 h-[1px] bg-slate-800 my-1" />

          <button
            onClick={onOpenCompendium}
            title="Abrir Compendio"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <button
            onClick={onNewModule}
            title="Nuevo Módulo"
            className="p-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={onNewJournalEntry}
            title="Nueva Entrada de Diario (DevLog)"
            className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
          >
            <BookMarked className="w-4 h-4" />
          </button>

          <button
            onClick={onNewFile}
            title="Nueva Sesión / Archivo"
            className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 transition-colors"
          >
            <FilePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          {activeCompendium && (
            <button
              onClick={onOpenTimeline}
              title="Ver Historial Git / Timeline"
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
            >
              <History className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // 2. ESTADO EXPANDIDO CON REDIMENSIONADO SUAVE
  return (
    <aside 
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="relative bg-slate-900/90 border-r border-slate-800 flex flex-col h-full select-none backdrop-blur-md shrink-0 z-20"
    >
      {/* Drag handle on right edge */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute -right-1 top-0 bottom-0 w-2.5 hover:w-3 cursor-col-resize z-30 group flex items-center justify-center transition-all"
        title="Arrastra para cambiar la anchura del panel"
      >
        <div className="w-[2px] h-8 bg-slate-700/60 rounded-full group-hover:bg-indigo-400 group-hover:h-16 transition-all" />
      </div>

      {/* Header / Project info */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="truncate flex-1">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Compendio
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {activeCompendium ? activeCompendium.meta.name : 'Sin proyecto'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenCompendium}
              title="Abrir Compendio existente"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNewCompendium}
              title="Nuevo Compendio..."
              className="p-1.5 rounded-md text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              title="Colapsar panel lateral"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-0.5"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeCompendium && (
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono truncate mr-2">
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate" title={`Último commit: ${activeCompendium.last_commit || 'main'}`}>
                {activeCompendium.last_commit ? activeCompendium.last_commit.substring(0, 7) : 'main'}
              </span>
            </div>
            <button
              onClick={onOpenTimeline}
              title="Ver Historial Git / Deshacer infinito"
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 px-2 py-0.5 rounded transition-colors text-[11px] shrink-0"
            >
              <History className="w-3 h-3" />
              <span>Timeline</span>
            </button>
          </div>
        )}
      </div>

      {/* File Explorer Tree */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800">
        {activeCompendium ? (
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              <span>Estructura</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onNewModule}
                  title="Crear nuevo módulo de contenido"
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 px-1.5 py-0.5 rounded hover:bg-purple-950/40 transition-colors capitalize font-normal border border-purple-500/20"
                >
                  <Layers className="w-3 h-3" />
                  <span>+ Módulo</span>
                </button>
                <button
                  onClick={onNewJournalEntry}
                  title="Crear nueva reflexión en el diario de construcción (DevLog)"
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded hover:bg-emerald-950/40 transition-colors capitalize font-normal border border-emerald-500/20"
                >
                  <BookMarked className="w-3 h-3" />
                  <span>+ Diario</span>
                </button>
                <button
                  onClick={onNewFile}
                  title="Crear nueva lección o nota"
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded hover:bg-indigo-950/40 transition-colors capitalize font-normal border border-indigo-500/20"
                >
                  <FilePlus className="w-3 h-3" />
                  <span>+ Sesión</span>
                </button>
              </div>
            </div>
            {renderTree(fileTree)}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="p-3 rounded-full bg-slate-800/60 text-slate-500 mb-3">
              <FolderCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-semibold text-slate-300 mb-1">
              Ningún compendio abierto
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 max-w-[180px]">
              Crea o abre una carpeta con estructura Git integrada para empezar a redactar.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[190px]">
              <button
                onClick={onOpenWizard}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-950/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Usar Asistente (Wizard)</span>
              </button>
              <button
                onClick={onNewCompendium}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nuevo Rápido</span>
              </button>
              <button
                onClick={onOpenCompendium}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Abrir Carpeta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status */}
      {activeCompendium && (
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{lastSaved ? `Guardado: ${lastSaved}` : 'Git 100% Offline'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 shrink-0">
            Local-First
          </span>
        </div>
      )}
    </aside>
  );
}
