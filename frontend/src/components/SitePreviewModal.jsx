import React, { useState, useEffect } from 'react';
import { 
  X, Globe, BookOpen, BookMarked, Layers, 
  ExternalLink, Laptop, Smartphone, Calendar, 
  User, CheckCircle2, Sparkles, ChevronRight, FileText, Share2
} from 'lucide-react';
import { GetCompendiumModules, GetJournalEntries, ReadCompendiumFile } from '../../wailsjs/go/main/App';
import { asciidocToHtml } from '../utils/asciidoc';

export default function SitePreviewModal({
  isOpen,
  onClose,
  compendiumInfo,
  onSelectFile
}) {
  const [tab, setTab] = useState('landing'); // 'landing', 'modules', 'devlog', 'reader'
  const [device, setDevice] = useState('desktop'); // 'desktop', 'mobile'
  const [modules, setModules] = useState([]);
  const [devlogs, setDevlogs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [renderedContent, setRenderedContent] = useState('');
  const [landingIntroHtml, setLandingIntroHtml] = useState('');

  useEffect(() => {
    if (isOpen && compendiumInfo) {
      loadSiteData();
    }
  }, [isOpen, compendiumInfo]);

  const loadSiteData = async () => {
    try {
      // 1. Cargar Módulos
      const mods = await GetCompendiumModules();
      setModules(mods || []);

      // 2. Cargar Entradas de DevLog
      const logs = await GetJournalEntries();
      setDevlogs(logs || []);

      // 3. Intentar cargar content/_index.adoc para la landing
      try {
        const landingRaw = await ReadCompendiumFile('content/_index.adoc');
        if (landingRaw) {
          setLandingIntroHtml(asciidocToHtml(landingRaw));
        }
      } catch {
        // Fallback normal
      }
    } catch (err) {
      console.error('Error cargando datos del sitio:', err);
    }
  };

  const handleOpenDoc = async (relPath, title) => {
    try {
      const raw = await ReadCompendiumFile(relPath);
      const html = asciidocToHtml(raw);
      setSelectedDoc({ path: relPath, title });
      setRenderedContent(html);
      setTab('reader');
    } catch (err) {
      console.error('Error leyendo documento:', err);
    }
  };

  if (!isOpen || !compendiumInfo) return null;

  const totalSessions = modules.reduce((acc, m) => acc + 1, 0); // aproximado

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top App Bar del Previsualizador */}
        <header className="h-14 px-6 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Previsualizador Web Hugo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Listo para GitHub Pages
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {compendiumInfo.meta.name}
              </p>
            </div>
          </div>

          {/* Selector de Pestañas de Vista */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTab('landing')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-medium ${
                tab === 'landing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>Portada / Landing</span>
            </button>
            <button
              onClick={() => setTab('modules')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-medium ${
                tab === 'modules' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Módulos ({modules.length})</span>
            </button>
            <button
              onClick={() => setTab('devlog')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-medium ${
                tab === 'devlog' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookMarked size={13} />
              <span>Bitácora DevLog ({devlogs.length})</span>
            </button>
          </div>

          {/* Dispositivo y Cerrar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  device === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Vista Pantalla Completa (Escritorio)"
              >
                <Laptop size={14} />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  device === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Vista Móvil (Responsive 400px)"
              >
                <Smartphone size={14} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Canvas de Visualización con Frame */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-4 flex justify-center items-start">
          <div 
            className={`w-full transition-all duration-300 bg-slate-900 border border-slate-800/80 rounded-xl min-h-full shadow-2xl p-6 sm:p-10 ${
              device === 'mobile' ? 'max-w-[420px] rounded-3xl border-2 border-slate-700' : 'max-w-4xl'
            }`}
          >

            {/* VISTA 1: LANDING / PORTADA DEL CURSO */}
            {tab === 'landing' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/30 border border-indigo-500/20 p-8">
                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                      <Sparkles size={12} />
                      <span>Compendio Formativo Oficial</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-outfit">
                      {compendiumInfo.meta.name}
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                      {compendiumInfo.meta.description || 'Estructura modular de conocimiento diseñada con pedagogía activa y documentación paso a paso.'}
                    </p>

                    {/* Metadata Autor & Fecha */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-indigo-400" />
                        <span>{compendiumInfo.meta.author || 'Autor'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-400" />
                        <span>Actualizado: {new Date().toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de Módulos del Curso */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers size={18} className="text-indigo-400" />
                      <span>Módulos y Capítulos del Curso</span>
                    </h2>
                    <span className="text-xs text-slate-500">
                      {modules.length} {modules.length === 1 ? 'Módulo disponible' : 'Módulos disponibles'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((mod, idx) => (
                      <div 
                        key={mod.slug}
                        className="group bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800/80 hover:border-indigo-500/30 rounded-xl p-5 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-indigo-400 font-mono">
                            <span>Unidad 0{idx + 1}</span>
                            <span className="text-slate-500">{mod.slug}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {mod.description || 'Contenidos teóricos, dinámicas de clase y ejercicios prácticos.'}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                          <button
                            onClick={() => handleOpenDoc(`content/${mod.slug}/_index.adoc`, mod.title)}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                          >
                            <span>Ver Temario</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección de Bitácora / DevLog Reciente */}
                {devlogs.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <BookMarked size={18} className="text-emerald-400" />
                        <span>Últimas Reflexiones del Autor (DevLog)</span>
                      </h2>
                      <button
                        onClick={() => setTab('devlog')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        Ver todas ({devlogs.length})
                      </button>
                    </div>

                    <div className="space-y-2">
                      {devlogs.slice(0, 3).map((log) => (
                        <div
                          key={log.slug}
                          onClick={() => handleOpenDoc(log.path, log.title)}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-emerald-500/30 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              {log.date}
                            </span>
                            <span className="text-xs font-medium text-slate-200 hover:text-white">
                              {log.title}
                            </span>
                          </div>
                          <ChevronRight size={14} className="text-slate-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: LISTA DETALLADA DE MÓDULOS */}
            {tab === 'modules' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-white">Programa de Módulos y Sesiones</h2>
                  <p className="text-xs text-slate-400 mt-1">Estructura curricular completa del compendio</p>
                </div>

                <div className="space-y-4">
                  {modules.map((mod, idx) => (
                    <div key={mod.slug} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenDoc(`content/${mod.slug}/_index.adoc`, mod.title)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                          <span>Leer Portada</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 pl-8">{mod.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA 3: BITÁCORA DEVLOG CRONOLÓGICA */}
            {tab === 'devlog' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookMarked className="text-emerald-400" />
                    <span>Diario de Construcción Pedagógica</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Reflexiones del autor sobre la metodología, decisiones de diseño y anécdotas de aula
                  </p>
                </div>

                <div className="space-y-4">
                  {devlogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No hay entradas de diario todavía. Pulsa "+ Entrada" en la barra lateral para redactar tu primera reflexión.
                    </div>
                  ) : (
                    devlogs.map((log) => (
                      <article 
                        key={log.slug}
                        className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-400 font-mono font-medium">{log.date}</span>
                          {log.relatedSession && (
                            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                              Relacionado: {log.relatedSession}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white">{log.title}</h3>
                        
                        {log.summary && (
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                            {log.summary}
                          </p>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={() => handleOpenDoc(log.path, log.title)}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <span>Leer reflexión completa</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VISTA 4: LECTOR DE DOCUMENTO INDIVIDUAL */}
            {tab === 'reader' && selectedDoc && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <button
                      onClick={() => setTab('landing')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 mb-1 flex items-center gap-1 font-medium"
                    >
                      ← Volver a la Portada
                    </button>
                    <h2 className="text-lg font-bold text-white">{selectedDoc.title}</h2>
                    <p className="text-xs text-slate-500 font-mono">{selectedDoc.path}</p>
                  </div>

                  {onSelectFile && (
                    <button
                      onClick={() => {
                        onSelectFile(selectedDoc.path);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      Editar en Writer
                    </button>
                  )}
                </div>

                {/* Contenido Renderizado */}
                <div 
                  className="tiptap prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
