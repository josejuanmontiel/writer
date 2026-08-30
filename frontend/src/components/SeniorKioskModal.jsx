import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Mic, MicOff, Volume2, VolumeX, Sparkles, X, Check, 
  ArrowRight, RotateCcw, Image as ImageIcon, BookOpen, Smile
} from 'lucide-react';
import { webBackend } from '../services/webBackend';
import { SaveCompendiumFile, ReadCompendiumFile } from '../../wailsjs/go/main/App';

const SENIOR_THEMES = [
  {
    id: 'pueblo',
    title: 'Mi Pueblo y la Infancia',
    emoji: '🏡',
    subtitle: 'La casa, las calles empedradas, los juegos y las fiestas.',
    sampleQuestion: '¿Cómo era la casa donde te criaste y qué olores o sonidos recuerdas de tu niñez?'
  },
  {
    id: 'juventud',
    title: 'Juventud y Primer Amor',
    emoji: '💃',
    subtitle: 'Los bailes con orquesta, los paseos y cómo se conocieron.',
    sampleQuestion: '¿Dónde se celebraban los bailes de tu juventud y cómo conociste a tu pareja?'
  },
  {
    id: 'trabajo',
    title: 'El Primer Trabajo',
    emoji: '⚒️',
    subtitle: 'Los primeros oficios, anécdotas y compañeros de vida.',
    sampleQuestion: '¿Cuál fue tu primer trabajo y qué fue lo primero que compraste con tu sueldo?'
  },
  {
    id: 'consejos',
    title: 'Consejos para Mis Nietos',
    emoji: '🌟',
    subtitle: 'La sabiduría y los valores más importantes de la vida.',
    sampleQuestion: 'Si tus nietos te pidieran el mejor consejo para ser felices, ¿qué les dirías?'
  }
];

export default function SeniorKioskModal({ isOpen, onClose, currentFile, onMemorySaved }) {
  const [selectedTheme, setSelectedTheme] = useState(SENIOR_THEMES[0]);
  const [currentQuestion, setCurrentQuestion] = useState(SENIOR_THEMES[0].sampleQuestion);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [visualPrompt, setVisualPrompt] = useState('Fotografía nostálgica de pueblo español de los años 50 al atardecer');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [step, setStep] = useState(1); // 1: Elegir tema, 2: Charla con Julián
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  const recognitionRef = useRef(null);

  // Voz de Julián mediante Web SpeechSynthesis
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Pausado y claro para personas mayores
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Reconocimiento de voz nativo Web
  const startListening = () => {
    stopSpeaking();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz nativo.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setSpokenText(prev => (prev + ' ' + finalTranscript).trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Error micrófono kiosco:', event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSelectTheme = async (theme) => {
    setSelectedTheme(theme);
    setStep(2);
    setSpokenText('');
    setIsLoadingQuestion(true);

    try {
      // Generar pregunta y prompt visual con Gemini
      const response = await webBackend.GenerateMemoryEvokerQuestions(theme.title, theme.subtitle);
      
      let parsedQ = theme.sampleQuestion;
      let promptImg = `Fotografía nostálgica y cálida de ${theme.title.toLowerCase()}, estilo años 50, pintura al óleo`;

      const lines = response.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.includes('[GENERA_IMAGEN:')) {
          const match = line.match(/\[GENERA_IMAGEN:\s*([^\]]+)\]/);
          if (match) promptImg = match[1];
        } else if (/^\d+\.|\?|-/.test(line.trim())) {
          parsedQ = line.replace(/^\d+\.\s*|-\s*/, '').trim();
          break;
        }
      }

      setCurrentQuestion(parsedQ);
      setVisualPrompt(promptImg);
      // Generar URL de imagen con Pollinations
      const encodedPrompt = encodeURIComponent(`${promptImg}, vintage nostalgic atmosphere, warm lighting, high quality oil painting`);
      setGeneratedImageUrl(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=640&height=480&nologo=true`);

      // Julián saluda y lee la pregunta
      setTimeout(() => {
        speakText(`Hola, me alegro mucho de charlar contigo. ${parsedQ}`);
      }, 500);

    } catch (e) {
      console.warn('Fallback a pregunta por defecto:', e);
      setCurrentQuestion(theme.sampleQuestion);
      const encodedPrompt = encodeURIComponent(`Nostalgic vintage photo of ${theme.title}, 1950s oil painting warm`);
      setGeneratedImageUrl(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=640&height=480&nologo=true`);
      setTimeout(() => {
        speakText(`Hola. ${theme.sampleQuestion}`);
      }, 500);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleSaveMemory = async () => {
    try {
      const targetPath = currentFile || 'recuerdos/mis-memorias.adoc';
      let existingContent = '';
      try {
        existingContent = await ReadCompendiumFile(targetPath);
      } catch (e) {
        existingContent = `= Mis Recuerdos de Vida\n\n`;
      }

      const formattedBlock = `
== ${selectedTheme.title}

[NOTE]
.Pregunta de Julián
--
"${currentQuestion}"
--

${spokenText || 'Una anécdota entrañable de mi vida contada con cariño.'}

[TIP]
.Postal del Recuerdo
image::assets/images/${selectedTheme.id}_recuerdo.png[${visualPrompt}, 800, align="center"]
`;

      const newContent = existingContent.trim() + '\n\n' + formattedBlock.trim() + '\n';
      await SaveCompendiumFile(targetPath, newContent);

      if (onMemorySaved) {
        onMemorySaved(targetPath, newContent);
      }
      stopSpeaking();
      stopListening();
      onClose();
    } catch (err) {
      alert('Error guardando memoria: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      {/* Barra superior Kiosco */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl shadow-inner">
            <Heart className="w-7 h-7 fill-amber-400/20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Eco de Vida <span className="text-sm font-medium px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Modo Mayor & Tablet</span>
            </h1>
            <p className="text-sm text-slate-400">Habla tranquilamente, la IA Julián escucha y escribe tu libro.</p>
          </div>
        </div>

        <button
          onClick={() => {
            stopSpeaking();
            stopListening();
            onClose();
          }}
          className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-lg flex items-center gap-2 transition-all"
        >
          <X className="w-6 h-6" />
          <span>Salir del Modo Kiosco</span>
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-8 overflow-y-auto max-w-6xl w-full mx-auto flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">¿De qué momento te gustaría hablar hoy?</h2>
              <p className="text-lg text-slate-400">Toca cualquiera de las tarjetas para empezar la conversación con Julián.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SENIOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className="p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 hover:border-amber-500 hover:bg-slate-800/90 transition-all text-left group shadow-xl flex items-center gap-6"
                >
                  <span className="text-6xl p-4 bg-slate-950 rounded-2xl border border-slate-800 group-hover:scale-110 transition-transform">
                    {theme.emoji}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {theme.title}
                    </h3>
                    <p className="text-base text-slate-400 leading-relaxed">
                      {theme.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in slide-in-from-bottom-4 duration-200">
            
            {/* Columna Izquierda: Julián y la Pregunta */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tarjeta de Julián */}
              <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 ${
                      isSpeaking ? 'bg-amber-500/30 border-amber-400 animate-pulse' : 'bg-slate-800 border-slate-700'
                    }`}>
                      👴
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Julián (Tu Acompañante)</h3>
                      <p className="text-xs text-amber-400 font-medium">
                        {isSpeaking ? 'Hablando en voz alta...' : isListening ? 'Escuchando con atención...' : 'Listo'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(currentQuestion)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    {isSpeaking ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
                    <span>{isSpeaking ? 'Silenciar' : 'Escuchar Pregunta'}</span>
                  </button>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 text-xl font-medium text-amber-100 leading-relaxed font-lora">
                  "{currentQuestion}"
                </div>
              </div>

              {/* Área de Respuesta y Botón Gigante de Micrófono */}
              <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Tu recuerdo hablado:
                  </span>
                  {spokenText && (
                    <button
                      onClick={() => setSpokenText('')}
                      className="text-xs text-slate-500 hover:text-rose-400 underline"
                    >
                      Borrar y repetir
                    </button>
                  )}
                </div>

                <div className="min-h-[120px] max-h-[180px] overflow-y-auto bg-slate-950 rounded-2xl p-4 border border-slate-800 text-lg text-slate-200 font-sans leading-relaxed">
                  {spokenText || (
                    <span className="text-slate-500 italic">
                      Pulsa el botón rojo abajo y empieza a hablar... tu voz se escribirá aquí automáticamente.
                    </span>
                  )}
                </div>

                {/* Botón Gigante Táctil de Micrófono */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`px-8 py-5 rounded-3xl font-bold text-xl flex items-center gap-4 transition-all shadow-2xl ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/50 scale-105 animate-pulse'
                        : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-amber-500/30 hover:scale-105'
                    }`}
                  >
                    {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    <span>{isListening ? 'Detener y Escuchar' : 'Toca para Hablar'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Columna Derecha: Postal Nostálgica Generada */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                    <ImageIcon className="w-5 h-5" />
                    <span>Postal Ilustrada de Tu Época</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">IA Nostálgica</span>
                </div>

                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                  {generatedImageUrl ? (
                    <img 
                      src={generatedImageUrl} 
                      alt="Postal del recuerdo" 
                      className="w-full h-full object-cover animate-in fade-in duration-500"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-500 text-sm space-y-2">
                      <Sparkles className="w-8 h-8 mx-auto text-amber-500/50 animate-spin" />
                      <p>Creando la postal de tu recuerdo...</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 italic text-center px-2">
                  "{visualPrompt}"
                </p>
              </div>

              {/* Botones de Acción Final */}
              <div className="space-y-3">
                <button
                  onClick={handleSaveMemory}
                  disabled={!spokenText}
                  className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
                    spokenText
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-6 h-6" />
                  <span>Guardar en Mi Libro de Vida</span>
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold text-base flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Elegir Otro Tema</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
