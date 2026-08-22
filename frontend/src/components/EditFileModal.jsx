import React, { useState, useEffect } from 'react';
import { X, Pencil, FileText, Sparkles, Check } from 'lucide-react';
import { RenameCompendiumFile, ReadCompendiumFile } from '../../wailsjs/go/main/App';

export default function EditFileModal({
  isOpen,
  fileNode,
  onClose,
  onFileUpdated
}) {
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && fileNode) {
      const baseName = fileNode.name || '';
      setFilename(baseName);
      setError(null);
      
      // Load current title from the first heading line of the file
      loadCurrentTitle(fileNode.relative_path, baseName);
    }
  }, [isOpen, fileNode]);

  const loadCurrentTitle = async (relPath, fallbackName) => {
    try {
      const content = await ReadCompendiumFile(relPath);
      if (content) {
        const lines = content.split('\n');
        for (const line of lines) {
          const lineTrim = line.trim();
          if (lineTrim.startsWith('= ') && !lineTrim.startsWith('== ')) {
            setTitle(lineTrim.replace('= ', '').trim());
            return;
          }
        }
      }
      setTitle(fallbackName.replace(/\.[^/.]+$/, ''));
    } catch {
      setTitle(fallbackName.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Debes especificar un título para el tema / sesión.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let newRelPath = fileNode.relative_path;
      if (filename.trim() && filename.trim() !== fileNode.name) {
        const parts = fileNode.relative_path.split('/');
        parts[parts.length - 1] = filename.trim();
        newRelPath = parts.join('/');
      }

      const finalPath = await RenameCompendiumFile(
        fileNode.relative_path,
        newRelPath,
        title.trim()
      );

      if (onFileUpdated) {
        onFileUpdated(finalPath);
      }
      onClose();
    } catch (err) {
      console.error('Error actualizando archivo:', err);
      setError(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !fileNode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Editar Título de Sesión / Tema
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {fileNode.relative_path}
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

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Título Didáctico del Tema <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Sesión 1: Introducción a los Motores Híbridos"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Se actualizará el encabezado principal <code className="text-indigo-300">= Título</code> en el documento.
            </p>
          </div>

          {/* Filename */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Nombre de Archivo en Disco</span>
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="sesion-01.adoc"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
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
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
