import React, { useState, useEffect } from 'react';
import { X, Layers, Sparkles } from 'lucide-react';
import { UpdateCompendiumModule } from '../../wailsjs/go/main/App';

export default function EditModuleModal({
  isOpen,
  module,
  onClose,
  onModuleUpdated
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (module) {
      setTitle(module.title || module.slug || '');
      setDescription(module.description || '');
    }
  }, [module]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Debes especificar un título para el módulo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await UpdateCompendiumModule(
        module.slug,
        title.trim(),
        description.trim()
      );
      if (onModuleUpdated) {
        onModuleUpdated(module.slug);
      }
      onClose();
    } catch (err) {
      console.error('Error actualizando módulo:', err);
      setError(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !module) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Editar Módulo
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                content/{module.slug}
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
              Título del Módulo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del módulo"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Descripción / Objetivos del Módulo
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción y objetivos de aprendizaje del módulo..."
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
