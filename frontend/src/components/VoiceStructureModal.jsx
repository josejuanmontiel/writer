import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Sparkles, 
  FileText, 
  Check, 
  Layers, 
  Clock, 
  Upload, 
  Volume2, 
  Lightbulb, 
  BookOpen, 
  ShoppingBag, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { 
  StructureTranscription, 
  SaveSessionAudioResource, 
  SaveVoiceStructuredSession,
  GetAudioDevices,
  StartRecording,
  StopRecording
} from '../../wailsjs/go/main/App';

export default function VoiceStructureModal({
  isOpen,
  onClose,
  onSessionCreated,
  onInsertIntoEditor,
  activeModule = 'modulo-1'
}) {
  const [step, setStep] = useState(1); // 1: Grabar/Dictar, 2: Estructurar & Revisar, 3: Guardar
  const [sessionTitle, setSessionTitle] = useState('Nueva Sesión Dictada por Voz');
  const [rawTranscript, setRawTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBase64, setAudioBase64] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFilename, setAudioFilename] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(0);
  const [isStructuring, setIsStructuring] = useState(false);
  const [structuredDraft, setStructuredDraft] = useState(null);
  
  // Destino
  const [targetModule, setTargetModule] = useState(activeModule || 'modulo-1');
  const [targetSlug, setTargetSlug] = useState('sesion-voz-01');
  const [saveAudioAsResource, setSaveAudioAsResource] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef(null);
  const audioInputRef = useRef(null);

  // Inicializar micrófonos
  useEffect(() => {
    if (isOpen) {
      GetAudioDevices().then(devs => {
        setDevices(devs || []);
      }).catch(err => console.error("Error obteniendo micros:", err));
      setStep(1);
    } else {
      if (isRecording) {
        handleStopRecording();
      }
    }
  }, [isOpen]);

  // Temporizador de grabación
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(d => d + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Iniciar grabación continua de sesión
  const handleStartRecording = async () => {
    try {
      await StartRecording(selectedDevice);
      setIsRecording(true);
      setAudioBase64('');
      setAudioUrl('');
    } catch (err) {
      alert("Error iniciando grabación: " + err);
    }
  };

  // Detener y transcribir
  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      const res = await StopRecording();
      // res devuelve el texto transcrito
      if (typeof res === 'string') {
        setRawTranscript(prev => (prev ? prev + '\n' + res : res));
      }
      setAudioFilename(`grabacion-sesion-${Date.now()}.wav`);
    } catch (err) {
      alert("Error deteniendo grabación: " + err);
    }
  };

  // Cargar archivo de audio externo
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFilename(file.name);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const b64 = reader.result.split(',')[1];
      setAudioBase64(b64);
      setAudioUrl(reader.result);
      // Demo transcript si no hay Whisper backend en este momento
      if (!rawTranscript) {
        setRawTranscript(
          `Hoy vamos a explicar el sacramento del Bautismo a los niños de primer año.\n` +
          `El Bautismo es el primer sacramento de la iniciación cristiana que borra el pecado original y nos hace hijos de Dios.\n` +
          `Para la sesión necesitamos traer velas blancas y agua bendita.\n` +
          `¿Qué significa la luz de la vela que recibimos? ¿Por qué el agua nos limpia?\n` +
          `Para la actividad en grupos los niños dibujarán una pila bautismal y escribirán la fecha de su propio bautismo.\n` +
          `Como compromiso semanal rezaremos en familia y daremos gracias por nuestra fe.`
        );
      }
    };
  };

  // Estructurar con el motor de IA / semántico
  const handleRunStructuring = () => {
    if (!rawTranscript.trim()) {
      alert("Por favor, graba tu voz o escribe una transcripción primero.");
      return;
    }

    setIsStructuring(true);
    try {
      const audioRel = saveAudioAsResource ? `assets/audio/${targetModule}/${audioFilename || 'sesion.wav'}` : '';
      const draft = StructureTranscription(rawTranscript, sessionTitle, audioRel);
      setStructuredDraft(draft);
      setStep(2);
    } catch (err) {
      alert("Error estructurando transcripción: " + err);
    } finally {
      setIsStructuring(false);
    }
  };

  // Guardar y crear la nueva sesión en el compendio
  const handleSaveSession = async () => {
    if (!structuredDraft) return;

    setIsSaving(true);
    try {
      let finalAudioPath = '';

      // 1. Guardar audio en assets/audio/ si hay base64
      if (saveAudioAsResource && audioBase64) {
        const savedAsset = await SaveSessionAudioResource(targetModule, audioFilename || 'sesion.wav', audioBase64);
        if (savedAsset) {
          finalAudioPath = savedAsset.relative_path;
        }
      }

      // 2. Persistir archivo de sesión .adoc
      const createdRelPath = await SaveVoiceStructuredSession(
        targetModule,
        targetSlug,
        sessionTitle,
        structuredDraft.generated_asciidoc,
        finalAudioPath
      );

      if (onSessionCreated) {
        onSessionCreated(createdRelPath);
      }
      onClose();
    } catch (err) {
      alert("Error guardando sesión estructurada: " + err);
    } finally {
      setIsSaving(false);
    }
  };

  // Insertar directamente en el editor activo
  const handleInsertCurrent = () => {
    if (!structuredDraft || !onInsertIntoEditor) return;
    onInsertIntoEditor(structuredDraft.generated_asciidoc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[680px] max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 select-none">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
              <Mic size={19} />
            </div>
            <div>
              <h2 className="text-sm font-bold font-outfit text-white flex items-center gap-2">
                Captura de Voz a Estructura ("Vuelca tu Experiencia Hablando")
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  Punto 1.8
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Dicta libremente tu explicación y la IA la organizará en apartados didácticos de clase
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-semibold">
              <span className={`px-2.5 py-1 rounded-full ${step === 1 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                1. Dictar / Grabar
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-1 rounded-full ${step === 2 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                2. Estructura & Revisión
              </span>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body por Pasos */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {step === 1 ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Título de la Lección */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Título provisional de la sesión:
                </label>
                <input 
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Ej. El Bautismo y la Luz de Cristo"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                />
              </div>

              {/* Panel de Grabación */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-purple-950/20 border border-purple-500/20 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                
                {/* Visualizador de Tiempo */}
                <div className="font-mono text-3xl font-bold tracking-wider text-purple-300">
                  {formatTimer(recordDuration)}
                </div>

                {/* Botón Principal de Grabación */}
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Empezar a hablar"
                  >
                    <Mic size={28} />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 animate-pulse hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Detener y transcribir"
                  >
                    <Square size={24} />
                  </button>
                )}

                <p className="text-xs text-slate-300">
                  {isRecording 
                    ? '🎙️ Grabando explicación continua... Habla libremente sobre el tema.' 
                    : 'Pulsa el micrófono y explica el tema como si estuvieras en clase con los alumnos.'}
                </p>

                {/* Selector de Micrófono & Opción de Cargar Audio */}
                <div className="flex items-center gap-3 pt-2">
                  {devices.length > 0 && (
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(Number(e.target.value))}
                      disabled={isRecording}
                      className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500"
                    >
                      {devices.map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  )}

                  <input 
                    type="file" 
                    ref={audioInputRef} 
                    onChange={handleAudioUpload} 
                    className="hidden" 
                    accept="audio/*"
                  />
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    disabled={isRecording}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                  >
                    <Upload size={12} />
                    <span>Importar Audio</span>
                  </button>
                </div>
              </div>

              {/* Transcripción / Cuadro de Texto Libre */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">Texto Transcrito / Volcado Oral:</span>
                  <span>{rawTranscript.split(/\s+/).filter(Boolean).length} palabras</span>
                </div>
                <textarea
                  value={rawTranscript}
                  onChange={(e) => setRawTranscript(e.target.value)}
                  placeholder="El texto de tu grabación aparecerá aquí automáticamente, o puedes escribir o pegar notas directamente..."
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-sans leading-relaxed resize-none shadow-inner"
                />
              </div>

              {/* Botón Avanzar a Estructurar */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleRunStructuring}
                  disabled={!rawTranscript.trim() || isStructuring}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>{isStructuring ? 'Estructurando con IA...' : 'Organizar en Apartados Didácticos'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* Paso 2: Revisión de la Estructura Generada */
            <div className="space-y-5 max-w-3xl mx-auto">
              
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-purple-200">✨ Estructura Pedagógica Generada</h3>
                  <p className="text-xs text-slate-400">Revisa los apartados clasificados automáticamente antes de guardar.</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  ← Volver a Dictar
                </button>
              </div>

              {/* Grid de Secciones Estructuradas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Objetivo */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Lightbulb size={13} />
                    🎯 Objetivo de la Sesión:
                  </span>
                  <textarea
                    value={structuredDraft?.objective || ''}
                    onChange={(e) => setStructuredDraft(prev => ({ ...prev, objective: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 2. Dinámica o Taller */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Users size={13} />
                    🛠️ Dinámica / Taller Práctico:
                  </span>
                  <textarea
                    value={structuredDraft?.workshop_dynamics || ''}
                    onChange={(e) => setStructuredDraft(prev => ({ ...prev, workshop_dynamics: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3. Preguntas para el Alumno */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <BookOpen size={13} />
                    🧑‍🎓 Preguntas de Reflexión (Ficha):
                  </span>
                  <div className="space-y-1">
                    {(structuredDraft?.student_questions || []).map((q, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={q}
                        onChange={(e) => {
                          const newQ = [...structuredDraft.student_questions];
                          newQ[idx] = e.target.value;
                          setStructuredDraft(prev => ({ ...prev, student_questions: newQ }));
                        }}
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    ))}
                  </div>
                </div>

                {/* 4. Materiales Necesarios */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <ShoppingBag size={13} />
                    🛒 Materiales Detectados:
                  </span>
                  <div className="space-y-1">
                    {(structuredDraft?.resources_list || []).map((r, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={r}
                        onChange={(e) => {
                          const newR = [...structuredDraft.resources_list];
                          newR[idx] = e.target.value;
                          setStructuredDraft(prev => ({ ...prev, resources_list: newR }));
                        }}
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Desarrollo Teórico */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <FileText size={13} />
                  📖 Desarrollo Teórico & Explicación Verbal:
                </span>
                <textarea
                  value={structuredDraft?.theory_content || ''}
                  onChange={(e) => setStructuredDraft(prev => ({ ...prev, theory_content: e.target.value }))}
                  rows={4}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 resize-none focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              {/* Opciones de Guardado en el Compendio */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Destino en el Compendio:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Módulo de Destino:</label>
                    <input 
                      type="text"
                      value={targetModule}
                      onChange={(e) => setTargetModule(e.target.value)}
                      placeholder="modulo-1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nombre de Archivo (.adoc):</label>
                    <input 
                      type="text"
                      value={targetSlug}
                      onChange={(e) => setTargetSlug(e.target.value)}
                      placeholder="sesion-05.adoc"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input 
                    type="checkbox"
                    checked={saveAudioAsResource}
                    onChange={(e) => setSaveAudioAsResource(e.target.checked)}
                    className="accent-purple-600 rounded"
                  />
                  <span>Guardar grabación como recurso de audio en <code>assets/audio/</code> e incrustar reproductor</span>
                </label>
              </div>

              {/* Botones de Finalización */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={handleInsertCurrent}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Insertar en Sesión Actual
                </button>

                <button
                  onClick={handleSaveSession}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <FolderPlus size={15} />
                  <span>{isSaving ? 'Guardando en Compendio...' : 'Crear Nueva Lección en Compendio'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
