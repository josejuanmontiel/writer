import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  ChevronDown, 
  FolderPlus, 
  FolderOpen, 
  Sparkles, 
  XCircle, 
  Clock, 
  Check, 
  BookOpen,
  Edit3
} from 'lucide-react';

export default function WorkspaceSelector({
  activeCompendium,
  recentCompendiums,
  onSelectRecent,
  onNewCompendium,
  onOpenWizard,
  onOpenFolder,
  onCloseCompendium,
  onConvertDraft,
  hasDraftContent
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-xs text-slate-200 transition-all shadow-sm max-w-[210px]"
      >
        <div className={`p-1 rounded-md shrink-0 ${activeCompendium ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {activeCompendium ? <Compass className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
        </div>
        <div className="flex flex-col text-left truncate min-w-0">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-none mb-0.5">
            {activeCompendium ? 'Workspace' : 'Modo Libre'}
          </span>
          <span className="font-semibold text-slate-100 truncate text-xs">
            {activeCompendium ? (activeCompendium.meta?.name || 'Compendio Activo') : 'Borrador Sin Guardar'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Active Workspace Header */}
          {activeCompendium ? (
            <div className="p-2.5 mb-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Activo</span>
                <span className="text-[10px] font-mono text-slate-400">{activeCompendium.last_commit ? activeCompendium.last_commit.substring(0, 7) : 'main'}</span>
              </div>
              <div className="font-semibold text-white truncate text-xs mb-0.5">{activeCompendium.meta?.name || 'Compendio'}</div>
              <div className="text-[11px] text-slate-400 truncate font-mono" title={activeCompendium.path}>
                {activeCompendium.path}
              </div>
            </div>
          ) : (
            <div className="p-2.5 mb-2 rounded-lg bg-amber-950/30 border border-amber-500/20">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Modo Borrador Libre</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Estás escribiendo o dictando de forma autónoma. Puedes estructurarlo como compendio en cualquier momento.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-1 mb-2 pb-2 border-b border-slate-800">
            {!activeCompendium && hasDraftContent && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onConvertDraft();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/20 transition-colors font-medium text-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Convertir borrador en Compendio</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenWizard) onOpenWizard();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-purple-950/40 border border-purple-500/20 transition-colors font-medium text-xs"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>🧙‍♂️ Asistente de Estructuración (Wizard)...</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNewCompendium();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>Nuevo Compendio Rápido...</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFolder();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <span>Abrir Carpeta de Compendio...</span>
            </button>

            {activeCompendium && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCloseCompendium();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-950/30 transition-colors"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Cerrar Workspace (Volver a Modo Libre)</span>
              </button>
            )}
          </div>

          {/* Recent Workspaces List */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Compendios Recientes
            </div>

            {recentCompendiums && recentCompendiums.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                {recentCompendiums.map((item) => {
                  const isCurrent = activeCompendium && activeCompendium.path === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setIsOpen(false);
                        if (!isCurrent) onSelectRecent(item.path);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        isCurrent 
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-medium text-xs truncate">{item.name || 'Sin título'}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{item.path}</div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-500 text-[11px]">
                No hay compendios recientes
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
