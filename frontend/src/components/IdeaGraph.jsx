import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState, 
  useEdgesState,
  MarkerType,
  addEdge,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  FileText, 
  X, 
  ArrowRight, 
  Compass, 
  ShieldAlert, 
  HelpCircle, 
  Filter, 
  Grid, 
  ExternalLink,
  Plus,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { 
  GetGlobalGraph, 
  GetCurriculumLintReport, 
  SaveGlobalGraphPositions,
  SaveGlobalGraphManualEdge,
  DeleteGlobalGraphEdge,
  GetCompendiumModules
} from '../../wailsjs/go/main/App';

// Nodo personalizado para entidades ontológicas
const ConceptCustomNode = ({ data, selected }) => {
  const isUnassigned = data.is_unassigned;
  const hasErrors = data.errors_count > 0;
  const hasWarnings = data.warnings_count > 0;

  // Paleta de colores por tipo ontológico
  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'sacramento':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'doctrina':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'moral':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'biblia':
      case 'evangelio':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'liturgia':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div 
      className={`min-w-[180px] max-w-[240px] rounded-xl shadow-xl backdrop-blur-md transition-all border ${
        selected 
          ? 'ring-2 ring-indigo-400 border-indigo-400 bg-slate-900/95' 
          : isUnassigned
            ? 'border-amber-500/50 bg-slate-950/90 border-dashed'
            : 'border-slate-700/80 bg-slate-900/90 hover:border-slate-500'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2.5 !h-2.5" />
      
      <div className="p-3">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeBadgeClass(data.type)}`}>
            {data.type || 'Concepto'}
          </span>
          <div className="flex items-center gap-1">
            {hasErrors && (
              <span title="Inconsistencia o ciclo detectado" className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] font-bold">
                !
              </span>
            )}
            {hasWarnings && !hasErrors && (
              <span title="Aviso curricular o uso prematuro" className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold">
                ⚠️
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
              {data.occurrences || 1}x
            </span>
          </div>
        </div>

        <div className="font-semibold text-xs text-slate-100 line-clamp-2">
          {data.label}
        </div>

        {isUnassigned && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
            <Sparkles size={10} />
            <span>Idea Flotante (Staging)</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  conceptNode: ConceptCustomNode,
};

export default function IdeaGraph({ onSelectSession, activeSessionRelPath }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rawGraph, setRawGraph] = useState(null);
  const [lintReport, setLintReport] = useState(null);
  const [modules, setModules] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showLinterDrawer, setShowLinterDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'assigned', 'unassigned', 'issues'
  const [isSavingPositions, setIsSavingPositions] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cargar Grafo Global y Reporte del Linter
  const loadGraphData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gData, lReport, mods] = await Promise.all([
        GetGlobalGraph(),
        GetCurriculumLintReport(),
        GetCompendiumModules()
      ]);

      setRawGraph(gData);
      setLintReport(lReport);
      setModules(mods || []);
    } catch (err) {
      console.error("Error cargando grafo y linter:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Construir Nodos y Aristas para ReactFlow aplicando filtros
  useEffect(() => {
    if (!rawGraph) return;

    const issuesMap = new Map();
    if (lintReport?.diagnostics) {
      lintReport.diagnostics.forEach(d => {
        if (d.concept_id) {
          const current = issuesMap.get(d.concept_id) || { errors: 0, warnings: 0, items: [] };
          if (d.severity === 'error') current.errors++;
          if (d.severity === 'warning') current.warnings++;
          current.items.push(d);
          issuesMap.set(d.concept_id, current);
        }
      });
    }

    // Filtrar nodos
    let filteredNodes = rawGraph.nodes || [];

    if (searchQuery.trim()) {
      filteredNodes = filteredNodes.filter(n => 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedModuleFilter !== 'all') {
      filteredNodes = filteredNodes.filter(n => 
        n.source_files?.some(f => f.includes(`content/${selectedModuleFilter}/`))
      );
    }

    if (statusFilter === 'unassigned') {
      filteredNodes = filteredNodes.filter(n => n.is_unassigned);
    } else if (statusFilter === 'assigned') {
      filteredNodes = filteredNodes.filter(n => !n.is_unassigned);
    } else if (statusFilter === 'issues') {
      filteredNodes = filteredNodes.filter(n => issuesMap.has(n.id));
    }

    const validNodeIDs = new Set(filteredNodes.map(n => n.id));

    // Posicionamiento inteligente en grid / círculos si no tienen x, y guardadas
    const flowNodes = filteredNodes.map((n, idx) => {
      const issueData = issuesMap.get(n.id) || { errors: 0, warnings: 0, items: [] };
      
      let x = n.x;
      let y = n.y;
      if (!x && !y) {
        const cols = 5;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        x = col * 260 + 50;
        y = row * 160 + 50;
      }

      return {
        id: n.id,
        type: 'conceptNode',
        position: { x, y },
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          occurrences: n.occurrences,
          source_files: n.source_files || [],
          is_unassigned: n.is_unassigned,
          errors_count: issueData.errors,
          warnings_count: issueData.warnings,
          diagnostics: issueData.items,
        },
      };
    });

    // Filtrar aristas
    const rawEdges = rawGraph.edges || [];
    const flowEdges = rawEdges
      .filter(e => validNodeIDs.has(e.source) && validNodeIDs.has(e.target))
      .map(e => {
        const label = e.label?.toLowerCase() || '';
        const isPrereq = label.includes('prerrequisito') || label.includes('requiere');
        const isDeepen = label.includes('profundiza') || label.includes('amplia');

        return {
          id: e.id || `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label || 'relación',
          type: 'smoothstep',
          animated: isPrereq,
          style: {
            stroke: isPrereq ? '#f59e0b' : isDeepen ? '#a855f7' : '#38bdf8',
            strokeWidth: isPrereq ? 2.5 : 1.8,
            strokeDasharray: isDeepen ? '4,4' : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isPrereq ? '#f59e0b' : isDeepen ? '#a855f7' : '#38bdf8',
          },
        };
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [rawGraph, lintReport, searchQuery, selectedModuleFilter, statusFilter, setNodes, setEdges]);

  // Selección de nodo para inspección
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data);
  }, []);

  // Guardar nuevas posiciones
  const handleSavePositions = async () => {
    setIsSavingPositions(true);
    const positionsMap = {};
    nodes.forEach(n => {
      positionsMap[n.id] = { x: n.position.x, y: n.position.y };
    });

    try {
      await SaveGlobalGraphPositions(positionsMap);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert("Error guardando distribución del grafo: " + err);
    } finally {
      setIsSavingPositions(false);
    }
  };

  // Conectar nueva arista manualmente
  const onConnect = useCallback(async (params) => {
    const relationType = prompt(
      "Tipo de relación:\n1: prerrequisito_de\n2: profundiza_en\n3: relacionado_con", 
      "prerrequisito_de"
    );
    if (!relationType) return;

    try {
      await SaveGlobalGraphManualEdge(params.source, params.target, relationType);
      await loadGraphData();
    } catch (err) {
      alert("Error conectando nodos: " + err);
    }
  }, [loadGraphData]);

  // Eliminar aristas
  const onEdgesDelete = useCallback(async (deletedEdges) => {
    for (const e of deletedEdges) {
      await DeleteGlobalGraphEdge(e.source, e.target);
    }
    await loadGraphData();
  }, [loadGraphData]);

  const healthScore = lintReport?.health_score ?? 100;
  const totalErrors = lintReport?.error_count || 0;
  const totalWarnings = lintReport?.warning_count || 0;

  return (
    <div className="flex-1 w-full h-full flex flex-col relative bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Top Toolbar de IdeaGraph 2.0 */}
      <div className="h-14 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Left: Título y Filtros */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Layers size={16} />
            </div>
            <div>
              <span className="font-bold text-xs text-white block">IdeaGraph 2.0</span>
              <span className="text-[10px] text-slate-400 font-mono">Grafo Ontológico & Dependencias</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          {/* Search */}
          <div className="relative w-48">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Módulos</option>
            {modules.map(m => (
              <option key={m.slug} value={m.slug}>{m.title || m.slug}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas las Entidades ({rawGraph?.nodes?.length || 0})</option>
            <option value="assigned">Solo Asignadas al Temario</option>
            <option value="unassigned">Solo Ideas Flotantes</option>
            <option value="issues">Solo con Avisos / Alertas</option>
          </select>
        </div>

        {/* Right: Health Score, Linter Drawer Toggle & Save */}
        <div className="flex items-center gap-2.5">
          {/* Health Score Pill */}
          <button
            onClick={() => setShowLinterDrawer(!showLinterDrawer)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
              totalErrors > 0
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : totalWarnings > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Salud Curricular: {healthScore}%</span>
            {(totalErrors > 0 || totalWarnings > 0) && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px]">
                {totalErrors + totalWarnings}
              </span>
            )}
          </button>

          <button
            onClick={handleSavePositions}
            disabled={isSavingPositions}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
            title="Guardar distribución visual de nodos"
          >
            {savedSuccess ? <Check size={13} /> : <Save size={13} />}
            <span>{savedSuccess ? 'Guardado' : 'Guardar Layout'}</span>
          </button>

          <button
            onClick={loadGraphData}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Recargar grafo"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area: ReactFlow */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-slate-950"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
          <MiniMap 
            nodeColor={(n) => n.data.is_unassigned ? '#f59e0b' : '#6366f1'} 
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl" 
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1.5 pointer-events-none shadow-xl">
          <div className="font-semibold text-white text-[10px] uppercase tracking-wider mb-1">Leyenda de Relaciones</div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-amber-500 inline-block"></span>
            <span>prerrequisito_de (requisito previo)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-purple-400 inline-block"></span>
            <span>profundiza_en (ampliación de tema)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-sky-400 inline-block"></span>
            <span>asociado_con (asociación doctrinal)</span>
          </div>
        </div>

        {/* Slide-Over Panel: Inspector del Nodo Seleccionado */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-4 flex flex-col z-30 animate-in slide-in-from-right-4 fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedNode.type || 'Concepto'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedNode.occurrences} menciones
                </span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={15} />
              </button>
            </div>

            <div className="py-3 space-y-3 overflow-y-auto flex-1">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {selectedNode.id}</p>
              </div>

              {/* Sesiones donde aparece */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-indigo-400" />
                  Sesiones del Compendio:
                </span>
                {selectedNode.source_files && selectedNode.source_files.length > 0 ? (
                  <div className="space-y-1">
                    {selectedNode.source_files.map((file) => (
                      <button
                        key={file}
                        onClick={() => onSelectSession && onSelectSession(file)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-500/40 text-xs text-slate-200 flex items-center justify-between group transition-all"
                      >
                        <span className="truncate">{file.split('/').pop()}</span>
                        <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-300 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No asociado a ninguna sesión aún.</p>
                )}
              </div>

              {/* Diagnósticos asociados si los hay */}
              {selectedNode.diagnostics && selectedNode.diagnostics.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Observaciones del Linter:
                  </span>
                  {selectedNode.diagnostics.map((d, i) => (
                    <div key={i} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                      <div className="font-semibold text-[11px]">{d.title}</div>
                      <p className="text-[10px] text-slate-300 mt-0.5">{d.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drawer Lateral del Curriculum Linter */}
        {showLinterDrawer && (
          <div className="absolute top-0 right-0 w-96 h-full bg-slate-900/98 backdrop-blur-2xl border-l border-slate-800 shadow-2xl p-5 flex flex-col z-40 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <ShieldAlert size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Curriculum Linter</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Auditoría Ontológica Automática</span>
                </div>
              </div>
              <button 
                onClick={() => setShowLinterDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Health Score Summary Card */}
            <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-amber-950/30 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Índice de Coherencia</span>
                <span className="text-base font-bold text-white font-mono">{healthScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    healthScore >= 90 ? 'bg-emerald-500' : healthScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{totalErrors} Errores</span>
                <span>{totalWarnings} Avisos</span>
                <span>{lintReport?.info_count || 0} Sugerencias</span>
              </div>
            </div>

            {/* Diagnostics List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {lintReport?.diagnostics && lintReport.diagnostics.length > 0 ? (
                lintReport.diagnostics.map((diag) => (
                  <div 
                    key={diag.id}
                    className={`p-3 rounded-xl border text-xs transition-all space-y-1.5 ${
                      diag.severity === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : diag.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs">{diag.title}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900/60">
                        {diag.code}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {diag.description}
                    </p>

                    {diag.suggested_fix && (
                      <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                        <strong className="text-amber-400">💡 Sugerencia: </strong>
                        {diag.suggested_fix}
                      </div>
                    )}

                    {diag.session_path && onSelectSession && (
                      <button
                        onClick={() => {
                          onSelectSession(diag.session_path);
                          setShowLinterDrawer(false);
                        }}
                        className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 pt-1"
                      >
                        <span>Abrir sesión afectada</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400 opacity-60" />
                  <p className="text-xs font-semibold text-slate-300">¡Compendio 100% Coherente!</p>
                  <p className="text-[11px]">No se han detectado ciclos ni lagunas de prerrequisitos.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
