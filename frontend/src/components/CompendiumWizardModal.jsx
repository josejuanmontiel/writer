import React, { useState, useEffect } from 'react';
import { 
  X, Wand2, Calendar, Layers, Clock, 
  Check, ArrowRight, ArrowLeft, Plus, Trash2, 
  Sparkles, Sliders, FolderOpen, RefreshCw, 
  ListOrdered, FileText, CheckSquare, Settings2,
  BookOpen, AlignLeft, RotateCcw
} from 'lucide-react';
import { GenerateCompendiumFromWizard, SelectFolderDialog } from '../../wailsjs/go/main/App';

const DEFAULT_TEMPLATE_BLOCKS = [
  {
    id: 'objectives',
    title: '🎯 Objetivos y Competencias',
    kind: 'heading',
    content: '* Comprender los conceptos fundamentales del tema.\n* Desarrollar la actividad práctica y dinámicas de grupo.\n* Formular conclusiones y compromisos de aprendizaje.',
    enabled: true,
  },
  {
    id: 'materials',
    title: '📦 Materiales y Recursos Previos',
    kind: 'heading',
    content: '* **Materiales necesarios**: Cuadernos, fichas de trabajo, proyector/recursos visuales.\n* **Preparación previa**: Revisar material audiovisual y ejercicios.',
    enabled: true,
  },
  {
    id: 'icebreaker',
    title: '🧩 Dinámica de Apertura / Rompehielos (10 min)',
    kind: 'heading',
    content: '* Breve pregunta motivadora o testimonio para captar la atención de los participantes.\n* Puesta en común rápida (3-4 respuestas).',
    enabled: true,
  },
  {
    id: 'instructor',
    title: '👨‍🏫 Notas Pedagógicas del Formador / Instructor',
    kind: 'instructor',
    content: '* **Objetivo didáctico clave**: Asegurar que los alumnos comprendan el mensaje central.\n* **Tiempos recomendados**: 10 min inicio, 25 min desarrollo, 20 min práctica, 5 min cierre.\n* **Preguntas para debate**: ¿Qué aplicaciones prácticas vemos en el día a día?',
    enabled: true,
  },
  {
    id: 'development',
    title: '📖 Desarrollo Teórico / Explicación',
    kind: 'heading',
    content: 'Espacio para volcar la explicación teórica, pasajes clave, anécdotas o demostración técnica.',
    enabled: true,
  },
  {
    id: 'practice',
    title: '🛠️ Actividad Práctica y Taller en Grupo',
    kind: 'heading',
    content: '1. Trabajo guiado en parejas o grupos pequeños.\n2. Puesta en común de dudas o descubrimientos.',
    enabled: true,
  },
  {
    id: 'student',
    title: '📝 Ficha del Alumno / Participante',
    kind: 'note',
    content: '* Resumen de la sesión para repasar en casa.\n* Espacio para notas personales o reflexiones.',
    enabled: true,
  },
  {
    id: 'conclusion',
    title: '💬 Conclusión y Compromiso Semanal',
    kind: 'heading',
    content: '* **Resumen**: Idea central a recordar.\n* **Compromiso / Tarea**: Acción práctica para aplicar durante la semana.',
    enabled: true,
  },
];

export default function CompendiumWizardModal({
  isOpen,
  onClose,
  onCompendiumGenerated
}) {
  const [step, setStep] = useState(1); // 1: Horizonte & Formato, 2: Módulos & Sesiones, 3: Estructura de Plantilla, 4: Calendario & Generar
  
  // Paso 1: Horizonte y Metadatos
  const [name, setName] = useState('Nuevo Compendio Formativo');
  const [description, setDescription] = useState('Plan estructurado de sesiones y desarrollo de contenidos.');
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [years, setYears] = useState(1);
  const [modulesPerYear, setModulesPerYear] = useState(3);
  const [sessionsPerModule, setSessionsPerModule] = useState(8);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [namingPrefix, setNamingPrefix] = useState('Módulo'); // 'Módulo', 'Bloque', 'Unidad', 'Trimestre'
  const [sessionPrefix, setSessionPrefix] = useState('Sesión'); // 'Sesión', 'Clase', 'Lección', 'Tema'

  // Paso 2: Lista Paramétrica de Módulos
  const [modules, setModules] = useState([]);
  const [batchTextInput, setBatchTextInput] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);

  // Paso 3: Bloques Dinámicos de la Plantilla de Sesión
  const [templateBlocks, setTemplateBlocks] = useState(DEFAULT_TEMPLATE_BLOCKS);

  // Paso 4: Calendario y Destino
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDir, setTargetDir] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Generador paramétrico de la matriz de módulos
  const generateModulesMatrix = (numYears, modsPerYear, sessPerMod, prefix) => {
    const list = [];
    let globalModIdx = 1;
    for (let y = 1; y <= numYears; y++) {
      for (let m = 1; m <= modsPerYear; m++) {
        const yearLabel = numYears > 1 ? `Año ${y} - ` : '';
        list.push({
          slug: numYears > 1 ? `ano-${y}-${prefix.toLowerCase()}-${m}` : `${prefix.toLowerCase()}-${globalModIdx}`,
          title: `${yearLabel}${prefix} ${globalModIdx}: Nombre del ${prefix}`,
          description: `Objetivos pedagógicos y contenidos del ${prefix.toLowerCase()} ${globalModIdx}.`,
          year: y,
          session_count: sessPerMod
        });
        globalModIdx++;
      }
    }
    return list;
  };

  useEffect(() => {
    if (modules.length === 0) {
      setModules(generateModulesMatrix(years, modulesPerYear, sessionsPerModule, namingPrefix));
    }
  }, []);

  const handleRecalculateMatrix = () => {
    setModules(generateModulesMatrix(years, modulesPerYear, sessionsPerModule, namingPrefix));
  };

  const handleBatchParse = () => {
    if (!batchTextInput.trim()) return;
    const lines = batchTextInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed = lines.map((line, idx) => {
      const slug = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `modulo-${idx+1}`;
      return {
        slug: slug,
        title: line,
        description: `Contenidos y desarrollo temático de ${line}.`,
        year: 1,
        session_count: sessionsPerModule || 4
      };
    });
    if (parsed.length > 0) {
      setModules(parsed);
      setShowBatchInput(false);
      setBatchTextInput('');
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await SelectFolderDialog();
      if (selected) {
        setTargetDir(selected);
      }
    } catch (err) {
      console.error('Error seleccionando carpeta:', err);
    }
  };

  const handleAddModule = () => {
    const nextIdx = modules.length + 1;
    setModules([
      ...modules,
      {
        slug: `${namingPrefix.toLowerCase()}-${nextIdx}`,
        title: `${namingPrefix} ${nextIdx}: Nuevo Tema`,
        description: 'Descripción de contenidos y objetivos.',
        year: 1,
        session_count: sessionsPerModule || 4
      }
    ]);
  };

  const handleRemoveModule = (idx) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const handleUpdateModule = (idx, field, value) => {
    const next = [...modules];
    next[idx][field] = value;
    if (field === 'title') {
      next[idx].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    setModules(next);
  };

  // Handlers para Bloques de Plantilla (Paso 3)
  const handleToggleBlock = (idx) => {
    const next = [...templateBlocks];
    next[idx].enabled = !next[idx].enabled;
    setTemplateBlocks(next);
  };

  const handleUpdateBlock = (idx, field, value) => {
    const next = [...templateBlocks];
    next[idx][field] = value;
    setTemplateBlocks(next);
  };

  const handleAddCustomBlock = () => {
    const newId = `custom_${Date.now()}`;
    setTemplateBlocks([
      ...templateBlocks,
      {
        id: newId,
        title: '✨ Nuevo Bloque Temático',
        kind: 'heading',
        content: 'Contenido inicial o pautas sugeridas para este bloque...',
        enabled: true,
      }
    ]);
  };

  const handleRemoveBlock = (idx) => {
    setTemplateBlocks(templateBlocks.filter((_, i) => i !== idx));
  };

  const handleResetBlocks = () => {
    setTemplateBlocks(JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_BLOCKS)));
  };

  const totalSessions = modules.reduce((acc, m) => acc + (parseInt(m.session_count) || 0), 0);
  const totalHours = Math.round((totalSessions * durationMinutes) / 60);

  const handleGenerate = async () => {
    if (!targetDir.trim()) {
      setError('Debes seleccionar la carpeta de destino en tu disco.');
      return;
    }
    if (!name.trim()) {
      setError('Debes especificar un título para el compendio.');
      return;
    }
    if (modules.length === 0) {
      setError('Debes configurar al menos un módulo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const config = {
        target_dir: targetDir.trim(),
        name: name.trim(),
        description: description.trim(),
        author: author.trim() || 'Autor',
        email: email.trim() || 'autor@ejemplo.local',
        horizon_type: years > 1 ? 'multi_year' : 'annual',
        years: parseInt(years) || 1,
        duration_minutes: parseInt(durationMinutes) || 60,
        include_instructor_notes: templateBlocks.some(b => b.id === 'instructor' && b.enabled),
        include_student_notes: templateBlocks.some(b => b.id === 'student' && b.enabled),
        template_blocks: templateBlocks,
        modules: modules.map(m => ({
          ...m,
          session_count: parseInt(m.session_count) || 1
        })),
        calendar: {
          start_date: startDate,
          session_duration: parseInt(durationMinutes) || 60,
          vacations: [],
          milestones: []
        }
      };

      const info = await GenerateCompendiumFromWizard(config);
      if (onCompendiumGenerated) {
        onCompendiumGenerated(info);
      }
      onClose();
    } catch (err) {
      console.error('Error generando compendio estructurado:', err);
      setError(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Asistente Paramétrico de Estructuración
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                  Generación Determinista
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paso {step} de 4 · {
                  step === 1 ? '1. Horizonte y Parámetros Temporales' :
                  step === 2 ? '2. Distribución de Módulos y Sesiones' :
                  step === 3 ? '3. Bloques Pedagógicos y Plantilla' :
                  '4. Calendario e Inicialización en Disco'
                }
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Stepper Bar */}
        <div className="bg-slate-950/50 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between text-xs font-medium select-none">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 1 ? 'bg-purple-500 text-white' : 'bg-slate-800'}`}>1</span>
            <span>Horizonte</span>
          </div>
          <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? 'bg-purple-500/40' : 'bg-slate-800'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 2 ? 'bg-purple-500 text-white' : 'bg-slate-800'}`}>2</span>
            <span>Módulos ({modules.length})</span>
          </div>
          <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? 'bg-purple-500/40' : 'bg-slate-800'}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 3 ? 'bg-purple-500 text-white' : 'bg-slate-800'}`}>3</span>
            <span>Bloques ({templateBlocks.filter(b => b.enabled).length})</span>
          </div>
          <div className={`h-0.5 flex-1 mx-3 ${step >= 4 ? 'bg-purple-500/40' : 'bg-slate-800'}`} />
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-purple-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 4 ? 'bg-purple-500 text-white' : 'bg-slate-800'}`}>4</span>
            <span>Generar</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* PASO 1: PARÁMETROS DEL HORIZONTE */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  1. Parámetros Generales y Horizonte Temporal
                </h3>
                <p className="text-slate-400 text-xs">
                  Configura los parámetros matemáticos y de periodicidad para estructurar el plan completo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Columna Izquierda: Metadatos */}
                <div className="space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-400">
                    Metadatos del Compendio
                  </h4>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Título / Nombre del Compendio <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Formación Profesional de Mecánica / Catequesis"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Descripción General / Objetivos
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Resumen del alcance formativo..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Autor / Docente</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Nombre del autor"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Email / Contacto</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@local"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Parámetros Numéricos */}
                <div className="space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-400">
                    Dimensiones y Ritmo Temporal
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Horizonte (Años / Niveles)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={years}
                        onChange={(e) => setYears(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Duración por Sesión
                      </label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value={30} className="bg-slate-900 text-slate-100">30 minutos</option>
                        <option value={45} className="bg-slate-900 text-slate-100">45 minutos</option>
                        <option value={60} className="bg-slate-900 text-slate-100">60 minutos (1h)</option>
                        <option value={90} className="bg-slate-900 text-slate-100">90 minutos (1.5h)</option>
                        <option value={120} className="bg-slate-900 text-slate-100">120 minutos (2h)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Módulos por Año/Nivel
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={modulesPerYear}
                        onChange={(e) => setModulesPerYear(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Sesiones por Módulo
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={sessionsPerModule}
                        onChange={(e) => setSessionsPerModule(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Prefijo de Agrupación
                      </label>
                      <select
                        value={namingPrefix}
                        onChange={(e) => setNamingPrefix(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="Módulo" className="bg-slate-900 text-slate-100">Módulo</option>
                        <option value="Bloque" className="bg-slate-900 text-slate-100">Bloque</option>
                        <option value="Unidad" className="bg-slate-900 text-slate-100">Unidad</option>
                        <option value="Trimestre" className="bg-slate-900 text-slate-100">Trimestre</option>
                        <option value="Tema" className="bg-slate-900 text-slate-100">Tema</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Prefijo de Lección
                      </label>
                      <select
                        value={sessionPrefix}
                        onChange={(e) => setSessionPrefix(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="Sesión" className="bg-slate-900 text-slate-100">Sesión</option>
                        <option value="Clase" className="bg-slate-900 text-slate-100">Clase</option>
                        <option value="Lección" className="bg-slate-900 text-slate-100">Lección</option>
                        <option value="Taller" className="bg-slate-900 text-slate-100">Taller</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleRecalculateMatrix}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition-colors"
                    >
                      <RefreshCw size={13} />
                      <span>Calcular Matriz ({years * modulesPerYear} Módulos · {years * modulesPerYear * sessionsPerModule} Sesiones)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: AJUSTE FINO DE MÓDULOS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white mb-0.5">
                    2. Configuración y Títulos de Módulos
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Revisa los módulos calculados, ajusta títulos o introduce tus temas directamente.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchInput(!showBatchInput)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  >
                    <ListOrdered size={14} />
                    <span>{showBatchInput ? 'Ver Lista' : 'Pegar Lista de Temas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition-colors"
                  >
                    <Plus size={14} />
                    <span>Añadir {namingPrefix}</span>
                  </button>
                </div>
              </div>

              {/* Batch Input Textarea */}
              {showBatchInput ? (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <label className="block text-slate-300 font-medium">
                    Pega tus títulos de temas (uno por línea):
                  </label>
                  <textarea
                    rows={6}
                    value={batchTextInput}
                    onChange={(e) => setBatchTextInput(e.target.value)}
                    placeholder={"1. Introducción y Conceptos Básicos\n2. Herramientas y Seguridad\n3. Diagnóstico de Averías\n4. Proyecto Práctico..."}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBatchInput(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchParse}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    >
                      Convertir en Módulos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                  {modules.map((mod, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    >
                      <div className="flex-1 space-y-1.5 w-full">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-500/20">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={mod.title}
                            onChange={(e) => handleUpdateModule(idx, 'title', e.target.value)}
                            placeholder="Título del Módulo"
                            className="flex-1 bg-transparent border-b border-slate-800 focus:border-purple-500 outline-none text-white text-xs font-semibold pb-0.5"
                          />
                        </div>
                        <input
                          type="text"
                          value={mod.description}
                          onChange={(e) => handleUpdateModule(idx, 'description', e.target.value)}
                          placeholder="Descripción breve de los objetivos de aprendizaje..."
                          className="w-full bg-transparent border-b border-transparent focus:border-slate-700 outline-none text-slate-400 text-[11px]"
                        />
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400">{sessionPrefix}s:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={mod.session_count}
                            onChange={(e) => handleUpdateModule(idx, 'session_count', e.target.value)}
                            className="w-10 bg-transparent text-center text-white font-bold text-xs outline-none"
                          />
                        </div>

                        {modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Eliminar módulo"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Summary Footer */}
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-300">
                  <Clock size={15} />
                  <span>Total acumulado: <strong>{modules.length} Módulos</strong> · <strong>{totalSessions} {sessionPrefix}s</strong></span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  ~{totalHours} horas lectivas estimadas ({durationMinutes} min/{sessionPrefix.toLowerCase()})
                </span>
              </div>
            </div>
          )}

          {/* PASO 3: BLOQUES PEDAGÓGICOS DINÁMICOS DE LA PLANTILLA */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white mb-0.5">
                    3. Bloques Pedagógicos de la Plantilla de Sesión
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Marca, desmarca, añade o personaliza las secciones que contendrá cada archivo de lección con espaciado holgado.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetBlocks}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium transition-colors text-[11px]"
                    title="Restablecer bloques por defecto"
                  >
                    <RotateCcw size={13} />
                    <span>Restablecer</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomBlock}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition-colors text-xs"
                  >
                    <Plus size={14} />
                    <span>Añadir Bloque Nuevo</span>
                  </button>
                </div>
              </div>

              {/* Lista Dinámica de Bloques */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {templateBlocks.map((block, idx) => (
                  <div
                    key={block.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      block.enabled 
                        ? 'bg-slate-950/60 border-slate-800' 
                        : 'bg-slate-950/20 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 flex-1">
                        <input
                          type="checkbox"
                          checked={block.enabled}
                          onChange={() => handleToggleBlock(idx)}
                          className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateBlock(idx, 'title', e.target.value)}
                          placeholder="Título del Bloque"
                          className="flex-1 bg-transparent border-b border-transparent focus:border-purple-500 outline-none text-white text-xs font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Selector de Tipo de Bloque */}
                        <select
                          value={block.kind}
                          onChange={(e) => handleUpdateBlock(idx, 'kind', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="heading" className="bg-slate-900 text-slate-100">Encabezado H2 (==)</option>
                          <option value="instructor" className="bg-slate-900 text-purple-300">Docente [INSTRUCTOR]</option>
                          <option value="note" className="bg-slate-900 text-emerald-300">Ficha Alumno [NOTE]</option>
                          <option value="tip" className="bg-slate-900 text-amber-300">Consejo [TIP]</option>
                          <option value="important" className="bg-slate-900 text-rose-300">Importante [IMPORTANT]</option>
                          <option value="quote" className="bg-slate-900 text-sky-300">Cita [quote]</option>
                          <option value="custom" className="bg-slate-900 text-slate-200">Texto Libre</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Eliminar bloque"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Contenido / Plantilla sugerida del bloque */}
                    {block.enabled && (
                      <textarea
                        rows={2}
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(idx, 'content', e.target.value)}
                        placeholder="Contenido inicial o campos vacíos a rellenar..."
                        className="w-full bg-slate-900/70 border border-slate-800 rounded-lg p-2 text-slate-300 text-[11px] font-mono focus:outline-none focus:border-purple-500/50 resize-y"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Indicador de Espaciado */}
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <AlignLeft size={14} className="text-purple-400 flex-shrink-0" />
                <span>
                  Cada sección activa se generará en los archivos <code className="text-purple-300 font-mono">.adoc</code> separada con <strong>espaciado holgado</strong> para máxima claridad visual.
                </span>
              </div>
            </div>
          )}

          {/* PASO 4: CALENDARIO Y GENERACIÓN */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  4. Calendario e Inicialización en Disco
                </h3>
                <p className="text-slate-400 text-xs">
                  Indica la fecha de la primera clase y la carpeta donde se creará el repositorio Git.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                      <Calendar size={13} className="text-purple-400" />
                      <span>Fecha de Inicio (Semana 1)</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                    <div className="font-semibold text-white flex items-center gap-1">
                      <Clock size={13} className="text-purple-400" />
                      <span>Planificación Temporal:</span>
                    </div>
                    <p>
                      • Inicio: <strong>{startDate}</strong> (Semana 1).
                    </p>
                    <p>
                      • Finalización estimada: <strong>{totalSessions} semanas</strong> ({totalHours} horas lectivas).
                    </p>
                    <p>
                      • Las fechas se asignarán de forma correlativa en los metadatos de cada sesión.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                      <FolderOpen size={13} className="text-indigo-400" />
                      <span>Carpeta de Destino en Disco <span className="text-rose-400">*</span></span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={targetDir}
                        onChange={(e) => setTargetDir(e.target.value)}
                        placeholder="/ruta/a/mi-compendio"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSelectFolder}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Examinar
                      </button>
                    </div>
                  </div>

                  {/* Resumen Final */}
                  <div className="p-3.5 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1.5 text-[11px]">
                    <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">
                      Se generará automáticamente:
                    </span>
                    <ul className="space-y-1 text-slate-300 list-disc pl-4">
                      <li>Repositorio Git local (100% offline con auto-commits).</li>
                      <li>{modules.length} carpetas de módulos y sus portadas `_index.adoc`.</li>
                      <li>{totalSessions} archivos de sesiones `{sessionPrefix.toLowerCase()}-XX.adoc` ({templateBlocks.filter(b => b.enabled).length} bloques por sesión).</li>
                      <li>Sitio web Hugo y DevLog de construcción pedagógica.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <footer className="h-16 px-6 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancelar
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-900/30"
              >
                <span>Siguiente</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/40"
              >
                <Wand2 size={14} />
                <span>{isSubmitting ? 'Generando Esqueleto...' : 'Generar Compendio Parametrizado'}</span>
              </button>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
}
