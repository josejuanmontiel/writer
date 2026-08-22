import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  ArrowUpCircle,
  HardDrive,
  Layers,
  RotateCw
} from 'lucide-react';
import { 
  GetAppVersion, 
  CheckAppUpdate, 
  ApplyAppUpdate, 
  RestartApp, 
  GetModelCatalogStatus, 
  DownloadModel, 
  DeleteModel 
} from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';

export default function ModelManagerModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' | 'models'
  
  // Update state
  const [currentVersion, setCurrentVersion] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateReadyToRestart, setUpdateReadyToRestart] = useState(false);

  // Models state
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelProgress, setModelProgress] = useState({}); // { [modelId]: percent }
  const [modelError, setModelError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    // Escuchar eventos de progreso del backend
    const cancelUpdateEvent = EventsOn('app:update_progress', (data) => {
      if (data && typeof data.percent === 'number') {
        setUpdateProgress(data.percent);
      }
    });

    const cancelModelEvent = EventsOn('model:download_progress', (data) => {
      if (data && data.modelId) {
        setModelProgress(prev => ({
          ...prev,
          [data.modelId]: data.percent
        }));
      }
    });

    return () => {
      if (typeof cancelUpdateEvent === 'function') cancelUpdateEvent();
      if (typeof cancelModelEvent === 'function') cancelModelEvent();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const ver = await GetAppVersion();
      setCurrentVersion(ver || 'v1.1.18');
      await refreshModels();
    } catch (err) {
      console.error('Error cargando versión o modelos:', err);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateError(null);
    setUpdateReadyToRestart(false);
    try {
      const info = await CheckAppUpdate();
      setUpdateInfo(info);
    } catch (err) {
      setUpdateError(err.toString());
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;
    setUpdating(true);
    setUpdateProgress(0);
    setUpdateError(null);
    try {
      await ApplyAppUpdate(updateInfo.downloadUrl);
      setUpdateReadyToRestart(true);
    } catch (err) {
      setUpdateError('Error aplicando actualización: ' + err.toString());
    } finally {
      setUpdating(false);
    }
  };

  const handleRestart = async () => {
    try {
      await RestartApp();
    } catch (err) {
      alert('Error reiniciando: ' + err);
    }
  };

  const refreshModels = async () => {
    setLoadingModels(true);
    setModelError(null);
    try {
      const list = await GetModelCatalogStatus();
      setModels(list || []);
    } catch (err) {
      setModelError(err.toString());
    } finally {
      setLoadingModels(false);
    }
  };

  const handleDownloadModel = async (modelId) => {
    setModelProgress(prev => ({ ...prev, [modelId]: 1 }));
    try {
      await DownloadModel(modelId);
      setModelProgress(prev => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
      await refreshModels();
    } catch (err) {
      alert(`Error descargando modelo: ${err}`);
      setModelProgress(prev => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (!confirm('¿Seguro que deseas eliminar este modelo local para liberar espacio?')) return;
    try {
      await DeleteModel(modelId);
      await refreshModels();
    } catch (err) {
      alert(`Error eliminando modelo: ${err}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12141a] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-outfit">Centro de Actualizaciones y Modelos</h2>
              <p className="text-xs text-gray-400">Gestiona versiones de la app y pesos de IA locales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'updates'
                ? 'border-brand-accent text-brand-accent bg-brand-accent/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ArrowUpCircle size={16} />
            Actualización de la App
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'models'
                ? 'border-brand-accent text-brand-accent bg-brand-accent/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Cpu size={16} />
            Modelos de IA Locales
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: UPDATES */}
          {activeTab === 'updates' && (
            <div className="space-y-6">
              {/* Current Version Card */}
              <div className="bg-black/30 border border-white/5 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Versión Instalada</span>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">{currentVersion || 'v1.1.18'}</div>
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate || updating}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-50"
                >
                  <RotateCw size={14} className={checkingUpdate ? 'animate-spin' : ''} />
                  {checkingUpdate ? 'Buscando...' : 'Buscar Actualizaciones'}
                </button>
              </div>

              {/* Error Alert */}
              {updateError && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-400 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>{updateError}</div>
                </div>
              )}

              {/* Update Status Result */}
              {updateInfo && (
                <div className="space-y-4">
                  {updateInfo.available ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 size={18} />
                          <span>¡Nueva versión disponible! {updateInfo.latestVersion}</span>
                        </div>
                        {updateInfo.assetSize > 0 && (
                          <span className="text-[11px] text-gray-400 font-mono">
                            {(updateInfo.assetSize / (1024 * 1024)).toFixed(1)} MB (Paquete Slim)
                          </span>
                        )}
                      </div>

                      {updateInfo.releaseNotes && (
                        <div className="bg-black/40 p-3.5 rounded-lg border border-white/5 text-xs text-gray-300 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                          {updateInfo.releaseNotes}
                        </div>
                      )}

                      {/* Download Progress or Action */}
                      {updating ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Descargando e instalando actualización...</span>
                            <span className="font-mono text-brand-accent">{updateProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-accent transition-all duration-300 ease-out"
                              style={{ width: `${updateProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : updateReadyToRestart ? (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-emerald-300 font-medium">
                            ✅ Actualización instalada correctamente. Reinicia para comenzar a usarla.
                          </span>
                          <button
                            onClick={handleRestart}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Reiniciar Ahora
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleApplyUpdate}
                          className="w-full py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-accent/20"
                        >
                          <Download size={14} />
                          Descargar e Instalar {updateInfo.latestVersion}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-3 text-gray-400 text-xs">
                      <CheckCircle2 size={18} className="text-brand-accent" />
                      <span>Estás utilizando la versión más reciente de Antigravity Writer ({currentVersion}).</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MODEL HUB */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Modelos alojados públicamente en Hugging Face para inferencia local offline.
                </span>
                <button
                  onClick={refreshModels}
                  disabled={loadingModels}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  title="Refrescar estado de modelos"
                >
                  <RefreshCw size={14} className={loadingModels ? 'animate-spin' : ''} />
                </button>
              </div>

              {modelError && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs">
                  {modelError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {models.map(model => {
                  const isDownloading = modelProgress[model.id] !== undefined;
                  const progress = modelProgress[model.id] || 0;

                  return (
                    <div 
                      key={model.id}
                      className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-outfit">{model.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-mono">
                              {model.sizeMb} MB
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              model.isInstalled 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            }`}>
                              {model.isInstalled ? 'Instalado ✅' : 'No descargado ⚪'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{model.description}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {model.isInstalled ? (
                            <>
                              <button
                                onClick={() => handleDownloadModel(model.id)}
                                disabled={isDownloading}
                                className="p-2 text-gray-400 hover:text-brand-accent rounded-lg hover:bg-white/5 transition-colors text-xs flex items-center gap-1.5"
                                title="Reinstalar / Reparar"
                              >
                                <RotateCw size={14} className={isDownloading ? 'animate-spin' : ''} />
                              </button>
                              {model.id !== 'whisper-tiny' && model.id !== 'gliner2-native' && (
                                <button
                                  onClick={() => handleDeleteModel(model.id)}
                                  disabled={isDownloading}
                                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                                  title="Liberar espacio"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleDownloadModel(model.id)}
                              disabled={isDownloading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent/20 hover:bg-brand-accent text-brand-accent hover:text-white border border-brand-accent/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              <Download size={13} />
                              Descargar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Download Progress Bar */}
                      {isDownloading && (
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-brand-accent">Descargando archivos...</span>
                            <span className="text-gray-300">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-accent transition-all duration-300 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
