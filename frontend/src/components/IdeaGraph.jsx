import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronLeft, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { SaveDiagramStep } from '../../wailsjs/go/main/App';

const IdeaGraph = ({ steps = [] }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Función para persistir cambios al backend
  const persistChanges = useCallback(async (currentNodes, currentEdges) => {
    // Convertir de formato ReactFlow a formato Diagram
    const diagramNodes = currentNodes.map(n => {
      const labelParts = n.data.label.split('\n[');
      return {
        id: n.id,
        label: labelParts[0],
        type: labelParts[1]?.replace(']', '') || 'item',
        x: n.position.x,
        y: n.position.y
      };
    });

    const diagramEdges = currentEdges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label || ''
    }));

    try {
      await SaveDiagramStep(currentStepIdx, diagramNodes, diagramEdges);
      console.log("Paso guardado correctamente");
    } catch (err) {
      console.error("Error guardando paso:", err);
    }
  }, [currentStepIdx]);

  const onNodeDragStop = useCallback((event, node) => {
    persistChanges(nodes, edges);
  }, [nodes, edges, persistChanges]);

  const onConnect = useCallback((params) => {
    const newEdge = { 
      ...params, 
      label: 'relación',
      animated: true, 
      style: { stroke: '#fbbf24', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' } 
    };
    setEdges((eds) => {
      const updatedEdges = addEdge(newEdge, eds);
      persistChanges(nodes, updatedEdges);
      return updatedEdges;
    });
  }, [nodes, setEdges, persistChanges]);

  const onNodesDelete = useCallback((deleted) => {
    const remainingNodes = nodes.filter(n => !deleted.find(d => d.id === n.id));
    persistChanges(remainingNodes, edges);
  }, [nodes, edges, persistChanges]);

  const onEdgesDelete = useCallback((deleted) => {
    const remainingEdges = edges.filter(e => !deleted.find(d => d.id === e.id));
    persistChanges(nodes, remainingEdges);
  }, [nodes, edges, persistChanges]);

  const onNodeDoubleClick = useCallback((event, node) => {
    const currentLabel = node.data.label.split('\n[')[0];
    const newLabel = prompt("Editar nombre de la entidad:", currentLabel);
    if (newLabel && newLabel !== currentLabel) {
      const typeStr = node.data.label.split('\n[')[1] || 'Concept]';
      const updatedNodes = nodes.map((n) => {
        if (n.id === node.id) {
          return { ...n, data: { ...n.data, label: `${newLabel}\n[${typeStr}` } };
        }
        return n;
      });
      setNodes(updatedNodes);
      persistChanges(updatedNodes, edges);
    }
  }, [nodes, edges, persistChanges, setNodes]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    const newLabel = prompt("Editar relación:", edge.label);
    if (newLabel && newLabel !== edge.label) {
      const updatedEdges = edges.map((e) => {
        if (e.id === edge.id) {
          return { ...e, label: newLabel };
        }
        return e;
      });
      setEdges(updatedEdges);
      persistChanges(nodes, updatedEdges);
    }
  }, [nodes, edges, persistChanges, setEdges]);

  useEffect(() => {
    if (steps.length > 0) {
      setCurrentStepIdx(steps.length - 1);
    }
  }, [steps.length]);

  useEffect(() => {
    if (steps.length > 0 && steps[currentStepIdx]) {
      // Usamos Maps para evitar duplicados al acumular
      const accumulatedNodes = new Map();
      const accumulatedEdges = new Map();

      // Recorremos desde el paso 0 hasta el actual
      for (let i = 0; i <= currentStepIdx; i++) {
        const step = steps[i];
        const isLatestStep = (i === currentStepIdx);

        (step.nodes || []).forEach((node) => {
          accumulatedNodes.set(node.id, {
            ...node,
            isNew: isLatestStep
          });
        });

        (step.edges || []).forEach((edge, idx) => {
          accumulatedEdges.set(`${edge.source}-${edge.target}-${edge.label}`, {
            ...edge,
            id: `e-${i}-${idx}`,
            isNew: isLatestStep
          });
        });
      }

      // Convertir nodos acumulados a flowNodes
      const nodesArray = Array.from(accumulatedNodes.values());
      const flowNodes = nodesArray.map((node, idx) => {
        // Disposición en círculo SOLO si no tienen coordenadas (x e y son 0)
        let position = { x: node.x || 0, y: node.y || 0 };
        if (position.x === 0 && position.y === 0) {
          const angle = (idx / nodesArray.length) * 2 * Math.PI;
          const radius = 200 + (Math.random() * 50);
          position = { 
            x: 400 + Math.cos(angle) * radius, 
            y: 300 + Math.sin(angle) * radius 
          };
        }
        
        // Colores por tipo de entidad
        const typeColors = {
          person: { bg: 'rgba(59,130,246,0.4)', border: '#60a5fa', color: '#dbeafe' },
          organization: { bg: 'rgba(168,85,247,0.4)', border: '#a78bfa', color: '#ede9fe' },
          location: { bg: 'rgba(16,185,129,0.4)', border: '#34d399', color: '#d1fae5' },
          event: { bg: 'rgba(245,158,11,0.4)', border: '#fbbf24', color: '#fef3c7' },
          item: { bg: 'rgba(239,68,68,0.4)', border: '#f87171', color: '#fee2e2' },
          character: { bg: 'rgba(59,130,246,0.4)', border: '#60a5fa', color: '#dbeafe' },
        };
        const colors = typeColors[node.type?.toLowerCase()] || typeColors.item;

        // Si es nuevo (del último paso), le damos un brillo especial (ej: borde dorado o neón)
        const highlightStyle = node.isNew ? {
          boxShadow: `0 0 20px 5px rgba(251, 191, 36, 0.6)`,
          border: `2px solid #fbbf24`, // Ámbar brillante para lo nuevo
        } : {
          boxShadow: `0 4px 20px ${colors.border}40`,
          border: `2px solid ${colors.border}`,
        };

        return {
          id: node.id,
          data: { label: `${node.label}\n[${node.type}]` },
          position: position,
          style: {
            background: colors.bg,
            color: colors.color,
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '100px',
            textAlign: 'center',
            transition: 'all 0.5s ease',
            ...highlightStyle
          },
        };
      });

      const flowEdges = Array.from(accumulatedEdges.values()).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.isNew, // Animamos solo las conexiones nuevas
        style: { 
          stroke: edge.isNew ? '#fbbf24' : '#818cf8', 
          strokeWidth: edge.isNew ? 3 : 2 
        },
        labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 11 },
        labelBgStyle: { fill: '#334155', fillOpacity: 0.9 }, // Fondo oscuro para que el texto blanco se vea
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.isNew ? '#fbbf24' : '#818cf8',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [currentStepIdx, steps, setNodes, setEdges]);

  const nextStep = () => setCurrentStepIdx(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStepIdx(prev => Math.max(prev - 0, 0));

  if (steps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <Layers size={64} className="opacity-20" />
        <p className="text-xl font-outfit opacity-50">Escribe algo y pulsa "Procesar" para ver tu diagrama</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full w-full">
      {/* Navigation Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-brand-panel/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 shadow-2xl">
        <button 
          onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
          disabled={currentStepIdx === 0}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex flex-col items-center min-w-[120px]">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">Paso</span>
          <span className="text-lg font-outfit font-bold">{currentStepIdx + 1} / {steps.length}</span>
        </div>

        <button 
          onClick={() => setCurrentStepIdx(Math.min(steps.length - 1, currentStepIdx + 1))}
          disabled={currentStepIdx === steps.length - 1}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Main Graph Area */}
      <div 
        className="flex-1 w-full bg-black/40 rounded-3xl overflow-hidden border border-white/5 mx-6 mt-6 mb-32 relative"
        style={{ height: '600px', minHeight: '600px' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeDragStop={onNodeDragStop}
          fitView
          style={{ width: '100%', height: '100%' }}
        >
          <Background color="#1e293b" gap={20} />
          <Controls className="bg-brand-panel border-white/10 fill-white" />
        </ReactFlow>
      </div>

      {/* Context Area (Bottom) */}
      <div className="absolute bottom-6 left-6 right-6 h-24 bg-brand-panel/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <RefreshCw size={12} className="text-brand-accent animate-spin-slow" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contexto del Paso</span>
        </div>
        <p className="text-sm text-gray-300 italic truncate italic">
          "{steps[currentStepIdx]?.context_text}"
        </p>
        <p className="text-xs text-brand-accent font-medium mt-1">
          {steps[currentStepIdx]?.explanation}
        </p>
      </div>
    </div>
  );
};

export default IdeaGraph;
