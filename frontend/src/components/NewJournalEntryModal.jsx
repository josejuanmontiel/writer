import React, { useState, useEffect } from 'react';
import { X, BookMarked, Sparkles, Calendar, Link2 } from 'lucide-react';
import { CreateJournalEntry, GetCompendiumModules } from '../../wailsjs/go/main/App';

export default function NewJournalEntryModal({
  isOpen,
  onClose,
  onEntryCreated
}) {
  const [title, setTitle] = useState('');
  const [relatedSession, setRelatedSession] = useState('');
  const [modules, setModules] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setRelatedSession('');
      setError(null);
      loadModules();
    }
  }, [isOpen]);

  const loadModules = async () => {
    try {
      const res = await GetCompendiumModules();
      setModules(res || []);
    } catch (err) {
      console.error('Error cargando módulos:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Debes especificar un título para la reflexión.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const relPath = await CreateJournalEntry(
        title.trim(),
        relatedSession.trim()
      );
      if (onEntryCreated) {
        onEntryCreated(relPath);
      }
      onClose();
    } catch (err) {
      console.error('Error creando entrada en el diario:', err);
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
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Nueva Entrada en el Diario (DevLog)
              </h3>
              <p className="text-xs text-slate-400">
                Bitácora de reflexión pedagógica y evolución
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
              Título de la Reflexión <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: ¿Por qué cambiamos la práctica de motores?"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Related Module / Session (Optional) */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Vincular a Módulo o Tema (Opcional)</span>
            </label>
            <select
              value={relatedSession}
              onChange={(e) => setRelatedSession(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="" className="bg-slate-900 text-slate-100">Reflexión general del curso / compendio</option>
              {modules.map((m) => (
                <option key={m.slug} value={m.slug} className="bg-slate-900 text-slate-100">
                  {m.title} ({m.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Se creará automáticamente en <code className="text-indigo-300 font-mono">content/journal/{new Date().toISOString().split('T')[0]}-...adoc</code>
            </span>
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Creando...' : 'Crear Entrada'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
