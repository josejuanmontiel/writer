import React, { useState } from 'react';
import { 
  Heart, Sparkles, Mic, MicOff, Volume2, Image as ImageIcon, Plus, 
  RefreshCw, Check, BookOpen, Clock, MapPin, Users, HelpCircle, X, ArrowRight
} from 'lucide-react';
import { webBackend } from '../services/webBackend';
import { SaveCompendiumFile, ReadCompendiumFile, GetActiveCompendium } from '../../wailsjs/go/main/App';

const MEMORY_THEMES = [
  {
    id: 'infancia',
    title: 'Infancia y el Pueblo Natal',
    icon: '🏡',
    description: 'La casa de los abuelos, los juegos en la plaza, la escuela y el olor a pan caliente.'
  },
  {
    id: 'juventud',
    title: 'Bailes, Fiestas y Primer Amor',
    icon: '💃',
    description: 'Las orquestas de verano, el casino del pueblo, la ropa de fiesta y cómo se conocieron.'
  },
  {
    id: 'trabajo',
    title: 'Primer Trabajo y Aprendizaje',
    icon: '⚒️',
    description: 'El primer jornal, los compañeros de faena, los retos y el esfuerzo.'
  },
  {
    id: 'familia',
    title: 'Hijos y Celebraciones Familiares',
    icon: '👨‍👩‍👧‍👦',
    description: 'El nacimiento de los hijos, las navidades, anécdotas inolvidables y reuniones.'
  },
  {
    id: 'legado',
    title: 'Sabiduría y Consejos para los Nietos',
    icon: '🌟',
    description: 'Lo más valioso que te ha enseñado la vida y tus deseos para el futuro.'
  }
];

export default function MemoryEvokerModal({ isOpen, onClose, onMemorySaved, currentFile }) {
  const [selectedTheme, setSelectedTheme] = useState(MEMORY_THEMES[0]);
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMemoryText, setCustomMemoryText] = useState('');
  const [generatedVisualPrompt, setGeneratedVisualPrompt] = useState('');
  const [activeStep, setActiveStep] = useState(1); // 1: Elegir tema, 2: Responder preguntas, 3: Vista previa y guardar

  if (!isOpen) return null;

  const handleGenerateQuestions = async (theme) => {
    setSelectedTheme(theme);
    setIsGenerating(true);
    try {
      const response = await webBackend.GenerateMemoryEvokerQuestions(theme.title, theme.description);
      
      // Parsear preguntas y prompt visual
      const lines = response.split('\n').filter(l => l.trim().length > 0);
      const parsedQuestions = [];
      let visualPrompt = '';

      for (const line of lines) {
        if (line.includes('[GENERA_IMAGEN:')) {
          const match = line.match(/\[GENERA_IMAGEN:\s*([^\]]+)\]/);
          if (match) visualPrompt = match[1];
        } else if (/^\d+\.|\?|-/.test(line.trim())) {
          parsedQuestions.push(line.replace(/^\d+\.\s*|-\s*/, '').trim());
        }
      }

      if (parsedQuestions.length === 0) {
        parsedQuestions.push(
          `¿Cómo recuerdas los lugares y olores en ${theme.title.toLowerCase()}?`,
          `¿Qué persona especial o familiar te viene a la memoria en esta etapa?`,
          `¿Cuál es la anécdota o lección que nunca se te olvidará?`
        );
      }

      setQuestions(parsedQuestions.slice(0, 3));
      if (!visualPrompt) {
        visualPrompt = `Fotografía nostálgica y cálida de ${theme.title.toLowerCase()}, estilo años 50-60, luz dorada de atardecer`;
      }
      setGeneratedVisualPrompt(visualPrompt);
      setActiveStep(2);
    } catch (err) {
      console.error('Error generando preguntas evocadoras:', err);
      // Fallback predeterminado si falla o no hay conexión inmediata
      setQuestions([
        `¿Cómo recuerdas los lugares y olores en ${theme.title.toLowerCase()}?`,
        `¿Qué persona especial te viene al pensamiento cuando hablas de este momento?`,
        `¿Cuál es el detalle o anécdota que nunca se te olvidará?`
      ]);
      setGeneratedVisualPrompt(`Escena nostálgica y detallada de ${theme.title.toLowerCase()}, ambiente cálido y entrañable`);
      setActiveStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMemoryToSession = async () => {
    try {
      const targetPath = currentFile || 'recuerdos/mis-memorias.adoc';
      let existingContent = '';
      try {
        existingContent = await ReadCompendiumFile(targetPath);
      } catch (e) {
        existingContent = `= Mis Recuerdos de Vida\n\n`;
      }

      const formattedMemoryBlock = `
== ${selectedTheme.title}

[NOTE]
.Pregunta Evocadora
====
${questions.length > 0 ? questions[0] : selectedTheme.description}
====

${customMemoryText || 'Recuerdo que en aquellos años todo era muy distinto y entrañable...'}

[TIP]
.Visualización Nostálgica (Prompt para Imagen)
====
image::assets/images/${selectedTheme.id}_recuerdo.png[${generatedVisualPrompt}, 800, align="center"]
====
`;

      const newContent = existingContent.trim() + '\n\n' + formattedMemoryBlock.trim() + '\n';
      await SaveCompendiumFile(targetPath, newContent);
      
      if (onMemorySaved) {
        onMemorySaved(targetPath, newContent);
      }
      onClose();
    } catch (err) {
      console.error('Error guardando recuerdo:', err);
      alert('Error guardando el recuerdo: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-amber-600/30 via-rose-600/20 to-purple-600/30 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Activador de Recuerdos & Memorias
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Eco de Vida
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                La IA "Julián" te hace preguntas cálidas sobre tu vida y crea postales de tus recuerdos.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido según el paso */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                1. Elige qué etapa o momento te gustaría recordar hoy:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MEMORY_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleGenerateQuestions(theme)}
                    disabled={isGenerating}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-amber-500/50 transition-all text-left group flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-2xl mb-2">{theme.icon}</div>
                      <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {theme.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {theme.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-amber-400 font-medium">
                      <span>Evocar recuerdos</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
              {isGenerating && (
                <div className="flex items-center justify-center gap-3 p-6 text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Julián está preparando preguntas cálidas sobre tu pasado...</span>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedTheme.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{selectedTheme.title}</h3>
                    <p className="text-xs text-slate-400">Preguntas de Julián para inspirarte</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveStep(1)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Cambiar tema
                </button>
              </div>

              {/* Preguntas evocadoras */}
              <div className="space-y-2 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4" />
                  PREGUNTAS SUGERIDAS:
                </div>
                {questions.map((q, idx) => (
                  <div key={idx} className="text-sm text-slate-200 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">{idx + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>

              {/* Área de dictado o escritura del recuerdo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tu recuerdo o anécdota (Escribe o usa el micrófono del editor):
                </label>
                <textarea
                  value={customMemoryText}
                  onChange={(e) => setCustomMemoryText(e.target.value)}
                  placeholder="Cuéntame lo que recuerdas... por ejemplo: 'Mi abuela tenía un patio lleno de macetas y los veranos olían a jazmín...'"
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Prompt visual generado */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                <div className="text-xs font-medium text-purple-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  PROMPT DE IMAGEN NOSTÁLGICA (SDXL / FLUX / VLM):
                </div>
                <p className="text-xs text-slate-300 italic">
                  "{generatedVisualPrompt}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {activeStep === 2 ? (
            <>
              <button
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg"
              >
                Atrás
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMemoryToSession}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Guardar Recuerdo en el Capítulo
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
