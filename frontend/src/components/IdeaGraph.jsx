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
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
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
  Check,
  Orbit
} from 'lucide-react';
import { 
  GetGlobalGraph, 
  GetCurriculumLintReport, 
  SaveGlobalGraphPositions, 
  SaveGlobalGraphManualEdge, 
  DeleteGlobalGraphEdge, 
  GetCompendiumModules, 
  RebuildAllCompendiumGraphs 
} from '../../wailsjs/go/main/App';

// Calcula posiciones orgánicas mediante simulación física de fuerzas
const computeForceLayout = (nodes, edges, width = 1400, height = 900) => {
  if (!nodes || nodes.length === 0) return [];

  const simNodes = nodes.map((n, i) => ({
    id: n.id,
    x: n.x && n.x !== 0 ? n.x : (width / 2 + (Math.cos(i * 0.5) * 350) + (Math.random() - 0.5) * 100),
    y: n.y && n.y !== 0 ? n.y : (height / 2 + (Math.sin(i * 0.5) * 350) + (Math.random() - 0.5) * 100),
    raw: n
  }));

  const nodeMap = new Map(simNodes.map(n => [n.id, n]));

  const simLinks = edges
    .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
    .map(e => ({
      source: e.source,
      target: e.target
    }));

  const simulation = forceSimulation(simNodes)
    .force('charge', forceManyBody().strength(-1600)) // Repulsión fuerte entre conceptos
    .force('link', forceLink(simLinks).id(d => d.id).distance(240).strength(0.85)) // Atracción entre conceptos relacionados
    .force('collide', forceCollide().radius(150).iterations(3)) // Evitar solapamiento de cajas
    .force('center', forceCenter(width / 2, height / 2).strength(0.06))
    .stop();

  for (let i = 0; i < 300; ++i) {
    simulation.tick();
  }

  return simNodes.map(sn => ({
    ...sn.raw,
    x: Math.round(sn.x),
    y: Math.round(sn.y)
  }));
};

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
      let [gData, lReport, mods] = await Promise.all([
        GetGlobalGraph(),
        GetCurriculumLintReport(),
        GetCompendiumModules()
      ]);

      // Si el grafo está vacío (recién abierto o sin procesar), escanear compendio automáticamente
      if (!gData?.nodes || gData.nodes.length === 0) {
        gData = await RebuildAllCompendiumGraphs();
        lReport = await GetCurriculumLintReport();
      }

      setRawGraph(gData);
      setLintReport(lReport);
      setModules(mods || []);
    } catch (err) {
      console.error("Error cargando grafo y linter:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAutoScan = async () => {
    setIsLoading(true);
    try {
      const gData = await RebuildAllCompendiumGraphs();
      const lReport = await GetCurriculumLintReport();
      setRawGraph(gData);
      setLintReport(lReport);
    } catch (err) {
      alert("Error escaneando compendio: " + err);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Si los nodos no tienen coordenadas personalizadas, aplicar distribución de fuerzas d3-force
    const hasCustomCoords = filteredNodes.some(n => n.x && n.y && (n.x !== 0 || n.y !== 0));
    const layoutedNodes = hasCustomCoords ? filteredNodes : computeForceLayout(filteredNodes, rawGraph.edges || []);

    const flowNodes = layoutedNodes.map((n, idx) => {
      const issueData = issuesMap.get(n.id) || { errors: 0, warnings: 0, items: [] };
      
      let x = n.x !== undefined ? n.x : (idx % 5) * 260 + 50;
      let y = n.y !== undefined ? n.y : Math.floor(idx / 5) * 160 + 50;

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
          label: e.label || '',
          type: 'smoothstep',
          animated: isPrereq,
          style: {
            stroke: isPrereq ? '#f59e0b' : isDeepen ? '#a855f7' : '#38bdf8',
            strokeWidth: 2,
            strokeDasharray: isDeepen ? '4,4' : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isPrereq ? '#f59e0b' : isDeepen ? '#a855f7' : '#38bdf8',
            width: 16,
            height: 16,
          },
          labelStyle: {
            fill: '#cbd5e1',
            fontSize: 10,
            fontFamily: 'monospace',
          },
          labelBgStyle: {
            fill: '#0f172a',
            fillOpacity: 0.85,
          },
        };
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [rawGraph, lintReport, searchQuery, selectedModuleFilter, statusFilter]);

  // Aplicar simulación de física de fuerzas interactiva
  const handleApplyForceLayout = () => {
    if (!rawGraph?.nodes || rawGraph.nodes.length === 0) return;
    const positioned = computeForceLayout(rawGraph.nodes, rawGraph.edges || []);
    setRawGraph(prev => ({
      ...prev,
      nodes: positioned
    }));
  };

  // Selección de nodo para inspección
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Guardar distribución visual en el backend
  const handleSavePositions = async () => {
    setIsSavingPositions(true);
    try {
      const positionsMap = {};
      nodes.forEach(n => {
        positionsMap[n.id] = {
          x: Math.round(n.position.x),
          y: Math.round(n.position.y)
        };
      });

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
      <div className="h-12 px-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-20 overflow-x-auto">
        
        {/* Left: Título y Filtros */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Layers size={13} />
            </div>
            <span className="font-bold text-xs text-white hidden md:inline">Grafo</span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-0.5"></div>

          {/* Search */}
          <div className="relative w-32 md:w-44">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[130px] truncate"
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
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[130px] truncate"
          >
            <option value="all">Todas ({rawGraph?.nodes?.length || 0})</option>
            <option value="assigned">Asignadas</option>
            <option value="unassigned">Flotantes</option>
            <option value="issues">Con Alertas</option>
          </select>
        </div>

        {/* Right: Acciones y Distribución */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Health Score Pill */}
          <button
            onClick={() => setShowLinterDrawer(!showLinterDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
              totalErrors > 0
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : totalWarnings > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
          >
            <ShieldAlert size={13} />
            <span className="hidden sm:inline">Salud:</span>
            <span>{healthScore}%</span>
          </button>

          {/* Botón Distribuir por Fuerzas */}
          <button
            onClick={handleApplyForceLayout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-medium transition-colors shadow-xs"
            title="Organizar conceptos orgánicamente mediante física de fuerzas (d3-force)"
          >
            <Orbit size={13} className="text-sky-400" />
            <span className="hidden md:inline">Fuerzas</span>
          </button>

          {/* Botón Escanear Compendio */}
          <button
            onClick={handleAutoScan}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
            title="Escanear todas las lecciones del compendio y actualizar nodos ontológicos"
          >
            <Sparkles size={13} className={isLoading ? 'animate-spin text-amber-400' : 'text-indigo-400'} />
            <span className="hidden md:inline">{isLoading ? 'Escaneando...' : 'Escanear'}</span>
          </button>

          {/* Guardar Layout */}
          <button
            onClick={handleSavePositions}
            disabled={isSavingPositions}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
            title="Guardar distribución visual actual"
          >
            {savedSuccess ? <Check size={13} /> : <Save size={13} />}
            <span className="hidden sm:inline">{savedSuccess ? 'Guardado' : 'Guardar'}</span>
          </button>

          <button
            onClick={loadGraphData}
            disabled={isLoading}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Recargar grafo"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
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
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.data?.is_unassigned) return '#f59e0b';
              if (n.data?.errors_count > 0) return '#f43f5e';
              return '#6366f1';
            }}
            maskColor="rgba(15, 23, 42, 0.85)"
            className="!bg-slate-900 !border-slate-800" 
          />
        </ReactFlow>

        {/* Leyenda de relaciones */}
        <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-xl z-10">
          <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Leyenda de Relaciones</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-500"></span>
            <span className="text-slate-300">prerrequisito_de (requisito previo)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-purple-500 border-b border-dashed border-purple-400"></span>
            <span className="text-slate-300">profundiza_en (ampliación de tema)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400"></span>
            <span className="text-slate-300">asociado_con (asociación doctrinal)</span>
          </div>
        </div>

        {/* Panel Flotante de Detalles del Nodo Seleccionado */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col z-30 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedNode.type}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedNode.occurrences} menciones
                </span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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
                        onClick={() => onSelectSession && onSelectSession(file, selectedNode.label)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-500/40 text-xs text-slate-200 flex items-center justify-between group transition-all"
                        title={`Abrir ${file} y resaltar "${selectedNode.label}"`}
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
