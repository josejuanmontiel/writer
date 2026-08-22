import React, { useState, useEffect } from 'react';
import { X, FilePlus, Sparkles } from 'lucide-react';
import { CreateCompendiumFile, GetCompendiumModules } from '../../wailsjs/go/main/App';

export default function NewFileModal({
  isOpen,
  onClose,
  onFileCreated
}) {
  const [category, setCategory] = useState('content/modulo-1');
  const [fileName, setFileName] = useState('');
  const [modules, setModules] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      GetCompendiumModules().then(mods => {
        setModules(mods || []);
        if (mods && mods.length > 0) {
          setCategory(mods[0].path);
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setError('Debes especificar un nombre de archivo.');
      return;
    }

    let cleanName = fileName.trim();
    // Default to .adoc extension
    if (!cleanName.endsWith('.adoc') && !cleanName.endsWith('.md')) {
      cleanName += '.adoc';
    }

    const relPath = `${category}/${cleanName}`;

    setIsSubmitting(true);
    setError(null);

    try {
      await CreateCompendiumFile(relPath, 'sesion-default');
      if (onFileCreated) {
        onFileCreated(relPath);
      }
      onClose();
    } catch (err) {
      console.error('Error creando archivo:', err);
      setError(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Nueva Sesión o Nota (AsciiDoc)
              </h3>
              <p className="text-xs text-slate-400">
                Añadir al compendio con estructura y bloques pedagógicos
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

          {/* Location Category */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Ubicación en el compendio
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {modules.map((m) => (
                <option key={m.path} value={m.path} className="bg-slate-900 text-slate-100">
                  {m.title} ({m.slug})
                </option>
              ))}
              <option value="content/unassigned" className="bg-slate-900 text-slate-100">📥 Bandeja de Ideas Flotantes (Unassigned)</option>
              <option value="journal" className="bg-slate-900 text-slate-100">📔 Diario Pedagógico (Journal)</option>
            </select>
          </div>

          {/* Filename */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Nombre del Archivo o Sesión <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Ej. sesion-02-herramientas o idea-resumen"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
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
              <span>{isSubmitting ? 'Creando...' : 'Crear Sesión (.adoc)'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
