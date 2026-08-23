import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  Sparkles, 
  Mic, 
  Brain, 
  Share2, 
  Layers, 
  GitBranch, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Scissors,
  Table,
  Zap,
  Bookmark
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'filosofia',
    title: '1. Filosofía Pedagógica',
    icon: Sparkles,
    badge: 'Concepto Clave',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-200">
          <p className="font-semibold text-white mb-1">🎯 Objetivo Primordial:</p>
          <p>«Facilitar escribir primero y organizar después, garantizando la coherencia conceptual de todo el curso o compendio.»</p>
        </div>
        <p>
          En la docencia, la catequesis o la redacción de cursos técnicos, forzar al autor a encajar cada idea en una semana concreta desde el minuto cero bloquea la inspiración. Antigravity Writer te permite volcar borradores, lecciones y ejemplos sueltos, mientras su motor semántico analiza los prerrequisitos en segundo plano.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-amber-300 text-xs uppercase mb-1">Fase 1: Escritura Libre</h4>
            <p className="text-xs text-slate-400">Redacta a tu ritmo en sesiones o en la bandeja de flotantes con soporte de voz continuo.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-emerald-300 text-xs uppercase mb-1">Fase 2: Estructuración Guiada</h4>
            <p className="text-xs text-slate-400">El asistente de dependencias te sugiere el orden temporal óptimo para maximizar el aprendizaje.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'audio',
    title: '2. Dictado por Voz & Whisper Local',
    icon: Mic,
    badge: '100% Offline',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Antigravity Writer incorpora inferencia nativa de modelos <strong>Whisper.cpp</strong> en C/C++ directamente en tu equipo, sin enviar tus palabras ni datos confidenciales a la nube.
        </p>
        <ul className="space-y-2 list-disc list-inside text-xs text-slate-300">
          <li><strong>Botón Micrófono:</strong> Haz clic en el botón circular superior o usa el atajo configurado para iniciar el dictado.</li>
          <li><strong>Medidor de Señal (VU Meter):</strong> Una barra dinámica en tiempo real te confirma que tu micrófono capta audio con el nivel correcto.</li>
          <li><strong>Modo Solo Texto (TTT):</strong> Si trabajas en un entorno silencioso, pulsa el botón TTT para escribir instrucciones y párrafos con procesado instantáneo.</li>
        </ul>
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="text-xs text-slate-400">Todos los modelos se descargan y almacenan en la carpeta <code className="text-indigo-300">models/</code> de tu ordenador.</p>
        </div>
      </div>
    )
  },
  {
    id: 'gliner2',
    title: '3. Extracción Semántica con GLiNER2',
    icon: Brain,
    badge: 'IA Integrada',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Cada párrafo redactado es analizado por el modelo <strong>GLiNER2</strong> sobre <strong>ONNX Runtime</strong> para detectar conceptos (entidades teológicas/técnicas) y sus dependencias mutuas.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <h4 className="text-xs font-semibold text-indigo-300">Relaciones Semánticas Identificadas:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">prerrequisito_de</span>
              <span>Indica que un concepto debe explicarse antes que otro (ej. <em>Bautismo &rarr; Comunión</em>).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">profundiza_en</span>
              <span>Indica ampliación de conceptos introducidos en módulos anteriores.</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'flotantes',
    title: '4. Bandeja Flotante & Semáforo de Madurez',
    icon: Layers,
    badge: 'Staging Buffer',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          La carpeta <code className="text-indigo-300">content/unassigned/</code> actúa como una bandeja de ideas flotantes para guardar temas antes de asignarlos a una semana específica.
        </p>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-200">Semáforo de Madurez Conceptual:</h4>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <strong className="text-emerald-300">🟢 Listo para Ubicar:</strong>
              </div>
              <span className="text-slate-300">Todos sus prerrequisitos ya se imparten en el curso.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <strong className="text-amber-300">🟡 Bloqueado:</strong>
              </div>
              <span className="text-slate-300">Requiere un concepto previo aún no enseñado.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <strong className="text-purple-300">🟣 Concepto Raíz:</strong>
              </div>
              <span className="text-slate-300">Tema autónomo e independiente sin dependencias previas.</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'asistente',
    title: '5. Asistente de Reubicación & Incrustación',
    icon: Compass,
    badge: '1-Click Placement',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Al pulsar el icono de brújula <Compass className="w-3.5 h-3.5 inline text-indigo-400" /> junto a un tema flotante, el Asistente calcula la posición cronológica óptima dentro del temario.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-indigo-300">Modos de Promoción Disponibles:</h4>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <strong className="text-indigo-200">📑 Promover como Nueva Sesión:</strong>
              <p className="text-slate-400 mt-0.5">Crea un archivo <code className="text-slate-300">sesion-XX.adoc</code> independiente en el módulo destino.</p>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <strong className="text-purple-200">📎 Incrustar en Sesión Existente:</strong>
              <p className="text-slate-400 mt-0.5">Añade la nota como subsección o bloque de aviso <code className="text-slate-300">[NOTE]</code> al final de la clase recomendada.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'extraer',
    title: '6. Extraer Selección a Idea Flotante',
    icon: Scissors,
    badge: 'Editor Agility',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          ¿Te has desviado del tema principal mientras escribías una sesión? No borres nada ni pierdas el ritmo:
        </p>
        <ol className="space-y-2 list-decimal list-inside text-xs text-slate-300">
          <li>Selecciona con el ratón el fragmento de texto o actividad secundaria.</li>
          <li>Pulsa el botón <strong>"Convertir en Idea Flotante"</strong> en la barra de herramientas.</li>
          <li>El fragmento se convertirá automáticamente en un archivo en <code className="text-indigo-300">content/unassigned/</code> y dejará un bloque de referencia en tu sesión actual.</li>
        </ol>
      </div>
    )
  },
  {
    id: 'matriz',
    title: '7. Matriz de Coherencia Curricular',
    icon: Table,
    badge: 'Heatmap',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          La <strong>Matriz de Coherencia Curricular</strong> cruza los conceptos del curso contra el calendario de sesiones para ofrecer un mapa visual del aprendizaje:
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-base text-amber-400 mb-1">★</div>
            <strong className="text-slate-200">Introducción</strong>
            <p className="text-[10px] text-slate-400 mt-0.5">Primera explicación del concepto.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-base text-indigo-400 mb-1">●</div>
            <strong className="text-slate-200">Refuerzo</strong>
            <p className="text-[10px] text-slate-400 mt-0.5">Repaso en sesiones posteriores.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-rose-500/30 bg-rose-500/5">
            <div className="text-base text-rose-400 mb-1">⚠️</div>
            <strong className="text-rose-300">Uso Prematuro</strong>
            <p className="text-[10px] text-slate-400 mt-0.5">Concepto usado sin previa base.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'linter',
    title: '8. IdeaGraph 2.0 & Validador Curricular',
    icon: Layers,
    badge: 'Linter & Diagnósticos',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          <strong>IdeaGraph 2.0</strong> es el lienzo visual ontológico del compendio. Conecta directamente con el Grafo Global y cuenta con un <strong>Linter Curricular Automático</strong>:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <strong className="text-indigo-300 block font-semibold">🔍 Inspector de Nodos</strong>
            <p className="text-slate-400">Haz clic sobre cualquier concepto para ver en qué sesiones se menciona y abrir el archivo con un clic.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <strong className="text-rose-300 block font-semibold">🛡️ Auditoría del Linter</strong>
            <p className="text-slate-400">Detecta ciclos circulares (A ➔ B ➔ A), conceptos requeridos ausentes y lagunas temporales.</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Usa la cápsula de <strong>Salud Curricular</strong> para abrir el panel de diagnósticos y saltar de inmediato a la sesión con inconsistencias.
        </p>
      </div>
    )
  },
  {
    id: 'git',
    title: '9. Control de Versiones Git & Timeline',
    icon: GitBranch,
    badge: 'Deshacer Infinito',
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <p>
          Cada compendio es un repositorio Git completo que realiza commits automáticos en segundo plano sin interrumpirte.
        </p>
        <p className="text-xs text-slate-400">
          Usa el botón <strong>Línea Temporal (Timeline)</strong> en la barra lateral para comparar versiones anteriores o restaurar cualquier momento de redacción de tus archivos.
        </p>
      </div>
    )
  }
];

export default function DocumentationModal({ isOpen, onClose }) {
  const [selectedId, setSelectedId] = useState('filosofia');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSections = SECTIONS.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = SECTIONS.find(s => s.id === selectedId) || SECTIONS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[640px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                Manual de Uso y Guía Pedagógica
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  Antigravity Writer
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aprende a escribir con libertad y estructurar con coherencia conceptual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/40 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar en el manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = sec.id === selectedId;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedId(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/40 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-3">
                {React.createElement(activeSection.icon, { className: 'w-6 h-6 text-indigo-400' })}
                <h3 className="text-lg font-bold text-white font-outfit">{activeSection.title}</h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                {activeSection.badge}
              </span>
            </div>

            <div className="flex-1">
              {activeSection.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Documentación local integrada
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
