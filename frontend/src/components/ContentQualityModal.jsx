import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Clock, 
  BookOpen, 
  ShoppingBag, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Trash2, 
  Sparkles, 
  Check, 
  Copy, 
  Search, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  FileSpreadsheet, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { 
  CalculateSessionPacing, 
  ExtractCompendiumGlossary, 
  GenerateGlossaryAsciidoc, 
  ExtractCompendiumResources, 
  SaveVoiceMemo, 
  GetVoiceMemos, 
  DeleteVoiceMemo 
} from '../../wailsjs/go/main/App';

export default function ContentQualityModal({
  isOpen,
  onClose,
  currentContent = '',
  activeFile = '',
  conceptsCount = 0,
  onSelectSession
}) {
  const [activeTab, setActiveTab] = useState('pacing'); // 'pacing', 'glossary', 'resources', 'memos'
  
  // 1. Pacing State
  const [targetMinutes, setTargetMinutes] = useState(50);
  const [pacingReport, setPacingReport] = useState(null);

  // 2. Glossary State
  const [glossary, setGlossary] = useState(null);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [generatingGlossary, setGeneratingGlossary] = useState(false);
  const [glossaryGeneratedPath, setGlossaryGeneratedPath] = useState('');

  // 3. Resources Checklist State
  const [resources, setResources] = useState(null);
  const [resourceSearch, setResourceSearch] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [copiedResources, setCopiedResources] = useState(false);

  // 4. Voice Memos State
  const [memos, setMemos] = useState([]);
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [memoTitle, setMemoTitle] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [playingMemoId, setPlayingMemoId] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos al abrir modal o cambiar pestaña
  useEffect(() => {
    if (!isOpen) return;

    // Calcular ritmo de la sesión activa
    const report = CalculateSessionPacing(currentContent, conceptsCount, targetMinutes);
    setPacingReport(report);

    loadTabData();
  }, [isOpen, activeTab, currentContent, conceptsCount, targetMinutes, activeFile]);

  const loadTabData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'glossary') {
        const g = await ExtractCompendiumGlossary();
        setGlossary(g);
      } else if (activeTab === 'resources') {
        const r = await ExtractCompendiumResources();
        setResources(r);
      } else if (activeTab === 'memos') {
        const m = await GetVoiceMemos(activeFile);
        setMemos(m || []);
      }
    } catch (err) {
      console.error("Error cargando datos de calidad:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar glosario.adoc en el compendio
  const handleGenerateGlossaryFile = async () => {
    setGeneratingGlossary(true);
    try {
      const relPath = await GenerateGlossaryAsciidoc();
      setGlossaryGeneratedPath(relPath);
      setTimeout(() => setGlossaryGeneratedPath(''), 3500);
    } catch (err) {
      alert("Error generando glosario: " + err);
    } finally {
      setGeneratingGlossary(false);
    }
  };

  // Toggle checkbox de recurso
  const handleToggleResource = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Copiar lista de compras
  const handleCopyShoppingList = () => {
    if (!resources?.items) return;
    const text = resources.items
      .map(item => `${checkedItems[item.id] ? '[x]' : '[ ]'} ${item.name} (${item.sessionTitle})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedResources(true);
    setTimeout(() => setCopiedResources(false), 2000);
  };

  // Grabación de Memos de Voz
  const startRecordingMemo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];
          try {
            await SaveVoiceMemo(activeFile, base64Data, memoTitle || 'Consejo Docente');
            setMemoTitle('');
            loadTabData();
          } catch (err) {
            alert("Error guardando memo de voz: " + err);
          }
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingMemo(true);
    } catch (err) {
      alert("No se pudo acceder al micrófono para grabar el memo: " + err);
    }
  };

  const stopRecordingMemo = () => {
    if (mediaRecorder && isRecordingMemo) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setIsRecordingMemo(false);
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (!confirm("¿Eliminar este memo de voz?")) return;
    try {
      await DeleteVoiceMemo(memoId);
      loadTabData();
    } catch (err) {
      alert("Error eliminando memo: " + err);
    }
  };

  if (!isOpen) return null;

  // Filtrado de glosario
  const filteredGlossary = glossary?.entries?.filter(e => 
    e.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    e.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  ) || [];

  // Filtrado de recursos
  const filteredResources = resources?.items?.filter(r => 
    r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    r.sessionTitle.toLowerCase().includes(resourceSearch.toLowerCase())
  ) || [];

  const completedResourcesCount = Object.values(checkedItems).filter(Boolean).length;
  const totalResourcesCount = resources?.total_items || 0;
  const resourcePercent = totalResourcesCount > 0 ? Math.round((completedResourcesCount / totalResourcesCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[640px] max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 select-none">
        
        {/* Header con Pestañas */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                Herramientas de Calidad & Logística
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  Punto 1.7
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ritmo de clase, glosario de términos, materiales y consejos de formador
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/80 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('pacing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'pacing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock size={14} />
            <span>⏱️ Ritmo de Sesión ({pacingReport?.total_minutes || 0} min)</span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'glossary'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen size={14} />
            <span>📖 Glosario ({glossary?.total_terms || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingBag size={14} />
            <span>🛒 Materiales ({totalResourcesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('memos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'memos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mic size={14} />
            <span>🎙️ Memos de Voz ({memos.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* 1. CALCULADORA DE RITMO */}
          {activeTab === 'pacing' && pacingReport && (
            <div className="space-y-6">
              
              {/* Resumen Principal */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-white font-mono">{pacingReport.total_minutes} minutos</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {pacingReport.pacing_badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">{pacingReport.recommendation}</p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block mb-1">Objetivo de Clase:</span>
                  <div className="flex items-center gap-1">
                    {[45, 50, 60, 90].map(mins => (
                      <button
                        key={mins}
                        onClick={() => setTargetMinutes(mins)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                          targetMinutes === mins 
                            ? 'bg-indigo-600 text-white font-bold' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Barra de Distribución Proporcional de Tiempos */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Desglose del Tiempo de la Sesión:</span>
                <div className="w-full h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
                  <div 
                    title={`Lectura / Exposición: ${pacingReport.reading_minutes} min`}
                    style={{ width: `${(pacingReport.reading_minutes / (pacingReport.total_minutes || 1)) * 100}%` }}
                    className="h-full bg-sky-500"
                  />
                  <div 
                    title={`Explicación Doctrinal: ${pacingReport.explanation_minutes} min`}
                    style={{ width: `${(pacingReport.explanation_minutes / (pacingReport.total_minutes || 1)) * 100}%` }}
                    className="h-full bg-purple-500"
                  />
                  <div 
                    title={`Actividades del Alumno: ${pacingReport.student_activities_minutes} min`}
                    style={{ width: `${(pacingReport.student_activities_minutes / (pacingReport.total_minutes || 1)) * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                  <div 
                    title={`Taller y Dinámicas: ${pacingReport.workshop_minutes} min`}
                    style={{ width: `${(pacingReport.workshop_minutes / (pacingReport.total_minutes || 1)) * 100}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>

              {/* Tarjetas de Métricas Detalladas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-1">
                    <BookOpen size={14} />
                    <span>Lectura Base</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{pacingReport.reading_minutes} min</div>
                  <p className="text-[10px] text-slate-400">{pacingReport.word_count} palabras (@ 130 ppm)</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold mb-1">
                    <GraduationCap size={14} />
                    <span>Teoría & Conceptos</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{pacingReport.explanation_minutes} min</div>
                  <p className="text-[10px] text-slate-400">{conceptsCount} conceptos (@ 2.5 min/concepto)</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                    <CheckCircle2 size={14} />
                    <span>Fichas Alumno</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{pacingReport.student_activities_minutes} min</div>
                  <p className="text-[10px] text-slate-400">{pacingReport.student_activities_count} bloques de preguntas</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                    <Sparkles size={14} />
                    <span>Taller & Dinámica</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">{pacingReport.workshop_minutes} min</div>
                  <p className="text-[10px] text-slate-400">{pacingReport.workshop_count} actividades prácticas</p>
                </div>
              </div>

            </div>
          )}

          {/* 2. GLOSARIO DE TÉRMINOS */}
          {activeTab === 'glossary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar término o definición..."
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleGenerateGlossaryFile}
                  disabled={generatingGlossary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                  title="Crear content/glosario.adoc automáticamente"
                >
                  {glossaryGeneratedPath ? <Check size={13} /> : <FileSpreadsheet size={13} />}
                  <span>{glossaryGeneratedPath ? '¡Glosario Generado!' : 'Compilar glosario.adoc'}</span>
                </button>
              </div>

              {/* Lista de Entradas */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredGlossary.length > 0 ? (
                  filteredGlossary.map((entry) => (
                    <div key={entry.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-amber-300 font-mono">{entry.term}</span>
                        {entry.introduced_in_session && (
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {entry.introduced_in_title || entry.introduced_in_session.split('/').pop()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{entry.definition}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    {isLoading ? 'Analizando compendio...' : 'No se encontraron términos definidos.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. MATRIZ DE RECURSOS / CHECKLIST */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar material o sesión..."
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {completedResourcesCount}/{totalResourcesCount} ({resourcePercent}%)
                  </span>
                  <button
                    onClick={handleCopyShoppingList}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    title="Copiar lista de preparación al portapapeles"
                  >
                    {copiedResources ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedResources ? 'Copiado' : 'Copiar Lista'}</span>
                  </button>
                </div>
              </div>

              {/* Barra de Progreso de Preparación */}
              <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${resourcePercent}%` }}
                />
              </div>

              {/* Lista de Materiales */}
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredResources.length > 0 ? (
                  filteredResources.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleResource(item.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        checkedItems[item.id]
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-400 line-through'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          checkedItems[item.id] 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : 'border-slate-700 bg-slate-900'
                        }`}>
                          {checkedItems[item.id] && <Check size={11} />}
                        </div>
                        <span className="text-xs font-medium">{item.name}</span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {item.sessionTitle}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No se encontraron listas de materiales en formato <code>[ ] Nombre</code> en las sesiones.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. NOTAS DE VOZ AL MARGEN */}
          {activeTab === 'memos' && (
            <div className="space-y-4">
              
              {/* Grabador de Nuevo Memo */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Grabar Consejo Docente para esta Sesión:
                  </label>
                  <input
                    type="text"
                    placeholder="Título del consejo (ej. Dinámica de la vela)..."
                    value={memoTitle}
                    onChange={(e) => setMemoTitle(e.target.value)}
                    disabled={isRecordingMemo}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={isRecordingMemo ? stopRecordingMemo : startRecordingMemo}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isRecordingMemo 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isRecordingMemo ? <MicOff size={15} /> : <Mic size={15} />}
                  <span>{isRecordingMemo ? 'Detener & Guardar' : 'Grabar Memo'}</span>
                </button>
              </div>

              {/* Lista de Memos */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {memos.length > 0 ? (
                  memos.map((memo) => (
                    <div key={memo.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-white">{memo.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {memo.created_at} · ~{Math.round(memo.duration_seconds || 5)}s
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteMemo(memo.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar memo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No hay notas de voz grabadas para esta sesión.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
