import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  GraduationCap, 
  Baby, 
  Wrench, 
  FileText, 
  ArrowRight,
  Save,
  BookOpen
} from 'lucide-react';
import { 
  DeriveStudentWorksheet, 
  DeriveSimplifiedVersion, 
  SaveDerivedLesson 
} from '../../wailsjs/go/main/App';

export default function AudienceDerivationModal({
  isOpen,
  onClose,
  masterContent = '',
  activeFilePath = '',
  onSelectFile
}) {
  const [derivationType, setDerivationType] = useState('student'); // 'student', 'simplified', 'workshop'
  const [targetTitle, setTargetTitle] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Inicializar título y ruta por defecto al abrir
  useEffect(() => {
    if (!isOpen) return;

    const baseName = activeFilePath.split('/').pop()?.replace('.adoc', '') || 'sesion';
    const dir = activeFilePath.split('/').slice(0, -1).join('/') || 'content/modulo-1';

    let suffix = '-ficha-alumno.adoc';
    let defaultTitle = 'Ficha del Alumno';

    if (derivationType === 'simplified') {
      suffix = '-infantil.adoc';
      defaultTitle = 'Versión Infantil / Lectura Fácil';
    } else if (derivationType === 'workshop') {
      suffix = '-taller.adoc';
      defaultTitle = 'Guía de Taller Práctico';
    }

    setTargetPath(`${dir}/${baseName}${suffix}`);
    setTargetTitle(defaultTitle);

    // Generar preview en tiempo real
    generatePreview(derivationType, defaultTitle);
  }, [isOpen, activeFilePath, derivationType]);

  const generatePreview = async (type, title) => {
    try {
      if (type === 'student') {
        const res = await DeriveStudentWorksheet(masterContent, title);
        setPreviewContent(res);
      } else {
        const res = await DeriveSimplifiedVersion(masterContent, title);
        setPreviewContent(res);
      }
    } catch (err) {
      console.error("Error generando preview de derivación:", err);
    }
  };

  if (!isOpen) return null;

  const handleSaveDerived = async () => {
    setIsSaving(true);
    try {
      const savedRelPath = await SaveDerivedLesson(targetPath, previewContent, targetTitle);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
        if (onSelectFile && savedRelPath) {
          onSelectFile(savedRelPath);
        }
      }, 1000);
    } catch (err) {
      alert("Error guardando lección derivada: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl h-[620px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                Asistente de Derivación Multi-Audiencia
              </h2>
              <p className="text-xs text-slate-400">
                Genera automáticamente una ficha o versión adaptada a partir de la lección maestra
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          
          {/* Selector de Tipo de Derivación */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => setDerivationType('student')}
              className={`p-3 rounded-xl border text-left transition-all ${
                derivationType === 'student'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-emerald-300 mb-1">
                <GraduationCap size={15} />
                <span>Ficha del Alumno</span>
              </div>
              <p className="text-[11px] text-slate-400">Preguntas de reflexión, ejercicios y compromisos.</p>
            </button>

            <button
              onClick={() => setDerivationType('simplified')}
              className={`p-3 rounded-xl border text-left transition-all ${
                derivationType === 'simplified'
                  ? 'bg-amber-500/15 border-amber-500/50 text-white ring-1 ring-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-amber-300 mb-1">
                <Baby size={15} />
                <span>Infantil / Fácil Lectura</span>
              </div>
              <p className="text-[11px] text-slate-400">Vocabulario cercano, parábolas y dinámicas de dibujo.</p>
            </button>

            <button
              onClick={() => setDerivationType('workshop')}
              className={`p-3 rounded-xl border text-left transition-all ${
                derivationType === 'workshop'
                  ? 'bg-sky-500/15 border-sky-500/50 text-white ring-1 ring-sky-500/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-sky-300 mb-1">
                <Wrench size={15} />
                <span>Guía de Taller</span>
              </div>
              <p className="text-[11px] text-slate-400">Dinámicas grupales y prácticas activas.</p>
            </button>
          </div>

          {/* Destino y Título */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Título del Documento:</label>
              <input
                type="text"
                value={targetTitle}
                onChange={(e) => setTargetTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ruta del Archivo (.adoc):</label>
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Previsualización del Contenido Generado */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
              <span>Vista Previa del Contenido Generado:</span>
              <span className="text-[10px] text-slate-500 font-mono">AsciiDoc Formateado</span>
            </label>
            <textarea
              value={previewContent}
              onChange={(e) => setPreviewContent(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Se creará un nuevo archivo en tu compendio sincronizado con Git.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveDerived}
              disabled={isSaving || !targetPath.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md disabled:opacity-50"
            >
              {saveSuccess ? <Check size={14} /> : <Save size={14} />}
              <span>{saveSuccess ? '¡Guardado!' : 'Crear Lección Derivada'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
