import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  UploadCloud, 
  DownloadCloud, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Key, 
  Globe, 
  User, 
  ArrowUpRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { 
  GetGitRemoteInfo, 
  SetGitRemote, 
  PushGitRemote, 
  PullGitRemote, 
  GetConfig, 
  UpdateConfig 
} from '../../wailsjs/go/main/App';

export default function GitSyncModal({ isOpen, onClose, onRefreshTree }) {
  const [remoteInfo, setRemoteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState(null); // 'push' | 'pull'
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Configuration form state
  const [remoteUrl, setRemoteUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cfg = await GetConfig();
      if (cfg && cfg.git_remote) {
        setRemoteUrl(cfg.git_remote.remote_url || '');
        setBranch(cfg.git_remote.branch || 'main');
        setUsername(cfg.git_remote.username || '');
        setToken(cfg.git_remote.token || '');
      }

      const info = await GetGitRemoteInfo();
      if (info) {
        setRemoteInfo(info);
        if (info.url && !remoteUrl) {
          setRemoteUrl(info.url);
        }
        if (info.current_branch) {
          setBranch(info.current_branch);
        }
      }
    } catch (err) {
      console.error('Error cargando información remota de Git:', err);
      setErrorMsg(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRemoteConfig = async () => {
    if (!remoteUrl.trim()) {
      setErrorMsg('Debes introducir una URL de repositorio remoto válida (ej: https://github.com/usuario/compendio.git)');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await SetGitRemote(remoteUrl.trim(), 'origin');
      
      const currentCfg = await GetConfig();
      const updated = {
        ...currentCfg,
        git_remote: {
          remote_url: remoteUrl.trim(),
          branch: branch.trim() || 'main',
          username: username.trim(),
          token: token.trim()
        }
      };
      await UpdateConfig(updated);
      
      setSuccessMsg('Configuración de repositorio remoto guardada con éxito.');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Error configurando remoto: ' + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setSyncing(true);
    setSyncType('push');
    setErrorMsg(null);
    try {
      await PushGitRemote(token, username);
      setSuccessMsg('¡Sincronización PUSH completada! Tus cambios están en el remoto.');
      await loadData();
      if (onRefreshTree) onRefreshTree();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Fallo en Push: ' + err.toString());
    } finally {
      setSyncing(false);
      setSyncType(null);
    }
  };

  const handlePull = async () => {
    setSyncing(true);
    setSyncType('pull');
    setErrorMsg(null);
    try {
      await PullGitRemote(token, username);
      setSuccessMsg('¡Sincronización PULL completada! Cambios remotos integrados.');
      await loadData();
      if (onRefreshTree) onRefreshTree();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg('Fallo en Pull: ' + err.toString());
    } finally {
      setSyncing(false);
      setSyncType(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400">
              <GitBranch size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Sincronización Git Remota</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  Push / Pull
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Respalda tu compendio en GitHub, GitLab o servidor privado y colabora en equipo
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

        {/* Notificaciones */}
        {errorMsg && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={15} className="shrink-0 text-emerald-400" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* Estado Actual */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Globe size={14} className="text-blue-400" />
                <span>Estado Remoto:</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                remoteInfo?.has_remote 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {remoteInfo?.has_remote ? 'Conectado (origin)' : 'Sin remoto configurado'}
              </span>
            </div>

            {remoteInfo?.url && (
              <div className="text-xs text-slate-300 font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 truncate">
                {remoteInfo.url}
              </div>
            )}

            {remoteInfo?.current_branch && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Rama Activa:</span>
                <span className="font-mono font-semibold text-slate-200">🌿 {remoteInfo.current_branch}</span>
              </div>
            )}
          </div>

          {/* Acciones de Sincronización */}
          {remoteInfo?.has_remote && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePush}
                disabled={syncing}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all disabled:opacity-50"
              >
                {syncing && syncType === 'push' ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <UploadCloud size={16} />
                )}
                <span>Subir Cambios (Push)</span>
              </button>

              <button
                onClick={handlePull}
                disabled={syncing}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {syncing && syncType === 'pull' ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <DownloadCloud size={16} />
                )}
                <span>Descargar Cambios (Pull)</span>
              </button>
            </div>
          )}

          {/* Formulario de Configuración Remota */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Configuración de Conexión Remota
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">URL del Repositorio Remoto (HTTPS / SSH)</label>
              <input
                type="text"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://github.com/usuario/mi-compendio.git"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Rama Remota</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Usuario (Opcional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="oauth2 / tu-usuario"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Personal Access Token (PAT) / Token</label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  {showToken ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_... o glpat-..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 outline-none transition-colors"
              />
              <p className="text-[10px] text-slate-500">
                Se almacena localmente de forma segura en tu <code>config.json</code> para automatizar Push/Pull.
              </p>
            </div>

            <button
              onClick={handleSaveRemoteConfig}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-blue-500/30 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ShieldCheck size={15} />
              <span>Guardar Configuración Remota</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
