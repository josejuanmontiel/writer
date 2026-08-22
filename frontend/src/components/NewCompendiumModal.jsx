import React, { useState } from 'react';
import { X, FolderPlus, Folder, Sparkles } from 'lucide-react';
import { SelectFolderDialog, CreateCompendium, ConvertDraftToCompendium } from '../../wailsjs/go/main/App';

export default function NewCompendiumModal({
  isOpen,
  onClose,
  onCompendiumCreated,
  initialDraftText = ''
}) {
  const [targetDir, setTargetDir] = useState('');
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectFolder = async () => {
    try {
      const folder = await SelectFolderDialog('Seleccionar carpeta vacía para el Compendio');
      if (folder) {
        setTargetDir(folder);
        if (!name) {
          const parts = folder.replace(/\\/g, '/').split('/');
          const folderName = parts[parts.length - 1] || 'Mi Compendio';
          setName(folderName);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetDir) {
      setError('Debes seleccionar una carpeta de destino.');
      return;
    }
    if (!name.trim()) {
      setError('Debes especificar un nombre para el compendio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let info;
      if (initialDraftText && initialDraftText.trim()) {
        info = await ConvertDraftToCompendium(
          targetDir,
          name.trim(),
          description.trim(),
          author.trim() || 'Autor',
          email.trim() || 'autor@compendio.local',
          initialDraftText
        );
      } else {
        info = await CreateCompendium(
          targetDir,
          name.trim(),
          description.trim(),
          author.trim() || 'Autor',
          email.trim() || 'autor@compendio.local'
        );
      }

      if (onCompendiumCreated) {
        onCompendiumCreated(info);
      }
      onClose();
    } catch (err) {
      console.error('Error creando compendio:', err);
      setError(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Nuevo Compendio de Conocimiento
              </h3>
              <p className="text-xs text-slate-400">
                Estructura modular con persistencia Git integrada (Punto 1.1)
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Directory Picker */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Carpeta del Proyecto (Repositorio Git) <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={targetDir}
                placeholder="Selecciona una carpeta en tu disco..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>Explorar</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Título del Curso / Compendio <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Formación de Mecánica Avanzada 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Author & Email Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Autor / Formador
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Email (para Git commits)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@curso.es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Descripción / Objetivos Generales
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumen del contenido y público objetivo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Creando...' : 'Crear e Inicializar Git'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
