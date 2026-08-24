import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  GitPullRequest,
  Plus,
  UploadCloud, 
  DownloadCloud, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Globe, 
  ShieldCheck,
  ExternalLink,
  GitFork,
  CheckCircle2
} from 'lucide-react';
import { 
  GetGitRemoteInfo, 
  SetGitRemote, 
  PushGitRemote, 
  PullGitRemote, 
  GetGitBranches,
  CreateGitBranch,
  CheckoutGitBranch,
  GetGitPullRequestURL,
  GetConfig, 
  UpdateConfig 
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function GitSyncModal({ isOpen, onClose, onRefreshTree }) {
  const [remoteInfo, setRemoteInfo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState(null); // 'push' | 'pull' | 'branch'
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Branch UI state
  const [showNewBranchForm, setShowNewBranchForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Configuration form state
  const [remoteUrl, setRemoteUrl] = useState('');
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
          setCurrentBranch(info.current_branch);
        }
      }

      const branchData = await GetGitBranches();
      if (branchData) {
        setBranches(branchData.branches || []);
        if (branchData.current_branch) {
          setCurrentBranch(branchData.current_branch);
        }
      }
    } catch (err) {
      console.error('Error cargando información de Git:', err);
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
          branch: currentBranch || 'main',
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
      setSuccessMsg(`¡Sincronización PUSH completada en rama [${currentBranch}]! Tus cambios están en el remoto.`);
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
      setSuccessMsg(`¡Sincronización PULL completada en rama [${currentBranch}]! Cambios integrados.`);
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

  const handleSwitchBranch = async (branchName) => {
    if (branchName === currentBranch) return;
    setSyncing(true);
    setSyncType('branch');
    setErrorMsg(null);
    try {
      await CheckoutGitBranch(branchName);
      setSuccessMsg(`Cambiado exitosamente a la rama "${branchName}".`);
      await loadData();
      if (onRefreshTree) onRefreshTree();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Error cambiando de rama: ' + err.toString());
    } finally {
      setSyncing(false);
      setSyncType(null);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    const cleanName = newBranchName.trim().replace(/\s+/g, '-');
    if (!cleanName) {
      setErrorMsg('El nombre de la rama no puede estar vacío');
      return;
    }
    setSyncing(true);
    setErrorMsg(null);
    try {
      await CreateGitBranch(cleanName, true);
      setSuccessMsg(`Rama "${cleanName}" creada y activada.`);
      setNewBranchName('');
      setShowNewBranchForm(false);
      await loadData();
      if (onRefreshTree) onRefreshTree();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Error creando rama: ' + err.toString());
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenPullRequest = async () => {
    try {
      const prUrl = await GetGitPullRequestURL('main');
      if (prUrl) {
        BrowserOpenURL(prUrl);
      } else {
        setErrorMsg('No se pudo generar la URL de Pull Request. Verifica que tengas remoto configurado.');
      }
    } catch (err) {
      setErrorMsg('Error abriendo Pull Request: ' + err.toString());
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
                <h2 className="text-base font-bold text-white tracking-wide">Git-Flow & Sincronización</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  Ramas & PRs
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trabajo colaborativo en paralelo, gestión de ramas y sincronización remota
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

          {/* Sección 1: Gestión de Ramas y Trabajo en Paralelo */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <GitFork size={15} className="text-indigo-400" />
                <span>Ramas Locales (Trabajo en Paralelo)</span>
              </span>
              <button
                onClick={() => setShowNewBranchForm(!showNewBranchForm)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <Plus size={13} />
                <span>{showNewBranchForm ? 'Cancelar' : 'Nueva Rama'}</span>
              </button>
            </div>

            {/* Formulario Nueva Rama */}
            {showNewBranchForm && (
              <form onSubmit={handleCreateBranch} className="p-3 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-2">
                <label className="text-[11px] text-slate-300 font-medium block">Nombre de la nueva rama:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="autor/pedro-tema-sacramentos"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newBranchName.trim() || syncing}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                  >
                    Crear y Activar
                  </button>
                </div>
              </form>
            )}

            {/* Lista de ramas */}
            <div className="flex flex-wrap gap-2 pt-1">
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => handleSwitchBranch(b)}
                  disabled={syncing}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                    b === currentBranch
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30 border border-blue-400/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <GitBranch size={13} />
                  <span>{b}</span>
                  {b === currentBranch && <CheckCircle2 size={13} className="text-blue-200 ml-0.5" />}
                </button>
              ))}
            </div>

            {/* Botón de Pull Request (si estamos en rama secundaria y hay remoto) */}
            {remoteInfo?.has_remote && currentBranch !== 'main' && currentBranch !== 'master' && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ¿Listo para fusionar cambios con <strong>main</strong>?
                </span>
                <button
                  onClick={handleOpenPullRequest}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <GitPullRequest size={14} />
                  <span>Crear Pull Request</span>
                  <ExternalLink size={12} className="opacity-70" />
                </button>
              </div>
            )}
          </div>

          {/* Sección 2: Estado Remoto y Acciones Push / Pull */}
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

            {/* Acciones de Sincronización */}
            {remoteInfo?.has_remote && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handlePush}
                  disabled={syncing}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all disabled:opacity-50"
                >
                  {syncing && syncType === 'push' ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  <span>Subir ({currentBranch})</span>
                </button>

                <button
                  onClick={handlePull}
                  disabled={syncing}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {syncing && syncType === 'pull' ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <DownloadCloud size={16} />
                  )}
                  <span>Descargar ({currentBranch})</span>
                </button>
              </div>
            )}
          </div>

          {/* Sección 3: Formulario de Configuración Remota */}
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
