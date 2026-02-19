import { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import type { Node, Edge, Connection, NodeTypes, OnConnect } from 'reactflow';
import 'reactflow/dist/style.css';

import { ContactNode, CoilNode, PowerRailNode, TimerNode, CounterNode, BranchNode, RungLabelNode } from '../Nodes';
import { useStore } from '../../store/useStore';
import type { LadderElement, LadderProject, ContactType, CoilType, TimerType, CounterType, BranchType } from '../../core/schema/types';
import { createContactElement, createCoilElement, createTimerElement, createCounterElement, createBranchElement } from '../../core/schema/types';

// Power rail positions
export const LEFT_RAIL_X = 100;
export const RIGHT_RAIL_X = 700;
export const RUNG_SPACING = 120;
export const ELEMENT_WIDTH = 100;
export const ELEMENT_START_X = 150; // First element position
export const RUNG_LABEL_X = 30;

// Custom node types
const nodeTypes: NodeTypes = {
  contact: ContactNode,
  coil: CoilNode,
  powerRail: PowerRailNode,
  timer: TimerNode,
  counter: CounterNode,
  branch: BranchNode,
  rungLabel: RungLabelNode,
};

// Get next available variable name
function getNextVariable(project: LadderProject, type: 'contact' | 'coil' | 'timer' | 'counter' | 'branch'): string {
  const prefixMap = {
    contact: 'X',
    coil: 'Y',
    timer: 'T',
    counter: 'C',
    branch: '', // Branches don't have variables
  };
  const prefix = prefixMap[type];

  // Branches don't need variable names
  if (type === 'branch' || !prefix) {
    return '';
  }

  const usedNumbers = new Set<number>();

  project.rungs.forEach((rung) => {
    rung.elements.forEach((element) => {
      if (element.type === type) {
        const match = element.variable.match(new RegExp(`^${prefix}(\\d+)$`));
        if (match) {
          usedNumbers.add(parseInt(match[1], 10));
        }
      }
    });
  });

  // Find first available number
  for (let i = 0; i <= 999; i++) {
    if (!usedNumbers.has(i)) {
      return `${prefix}${i}`;
    }
  }
  return `${prefix}0`;
}

// Convert project elements to React Flow nodes
function projectToNodes(
  project: LadderProject,
  onVariableChange: (id: string, variable: string) => void,
  onDelete: (id: string) => void,
  selectedElementId: string | null,
  powerFlow: Record<string, boolean> = {}
): Node[] {
  const nodes: Node[] = [];
  const rungCount = Math.max(project.rungs.length, 1);

  // Calculate power rail height based on rung count
  const railHeight = rungCount * RUNG_SPACING + 200;

  // Add power rail nodes
  nodes.push({
    id: 'left-rail',
    type: 'powerRail',
    position: { x: LEFT_RAIL_X, y: -50 },
    data: { side: 'left' as const, height: railHeight, rungCount: rungCount },
    draggable: false,
    selectable: false,
  });

  nodes.push({
    id: 'right-rail',
    type: 'powerRail',
    position: { x: RIGHT_RAIL_X, y: -50 },
    data: { side: 'right' as const, height: railHeight, rungCount: rungCount },
    draggable: false,
    selectable: false,
  });

  // Add element nodes and rung labels
  project.rungs.forEach((rung, rungIndex) => {
    // Add rung label
    nodes.push({
      id: `rung-label-${rung.id}`,
      type: 'rungLabel',
      position: { x: RUNG_LABEL_X, y: rungIndex * RUNG_SPACING + 30 },
      data: {
        rungNumber: rungIndex + 1,
        comment: rung.comment,
      },
      draggable: false,
      selectable: false,
    });

    // Add elements for this rung
    rung.elements.forEach((element) => {
      nodes.push({
        id: element.id,
        type: element.type,
        position: {
          x: ELEMENT_START_X + element.position.x * ELEMENT_WIDTH,
          y: rungIndex * RUNG_SPACING + 30,
        },
        data: {
          element,
          onVariableChange,
          onDelete,
          selected: selectedElementId === element.id,
          hasPower: powerFlow[element.id] ?? false,
        },
      });
    });
  });

  return nodes;
}

// Convert project connections to React Flow edges
function projectToEdges(project: LadderProject): Edge[] {
  const edges: Edge[] = [];

  project.rungs.forEach((rung) => {
    // Sort elements by position for proper sequencing
    const sortedElements = [...rung.elements].sort((a, b) => a.position.x - b.position.x);

    // Auto-connect elements in sequence
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];

      // Connect to left neighbor or power rail
      if (i === 0) {
        // First element connects to left power rail
        edges.push({
          id: `left-rail-${element.id}`,
          source: 'left-rail',
          target: element.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep',
          style: { stroke: '#374151', strokeWidth: 2 },
        });
      } else {
        // Connect to previous element
        const prevElement = sortedElements[i - 1];
        edges.push({
          id: `${prevElement.id}-${element.id}`,
          source: prevElement.id,
          target: element.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep',
          style: { stroke: '#374151', strokeWidth: 2 },
        });
      }

      // Connect last element to right power rail (if it's an output type: coil, timer, or counter)
      const isOutputType = ['coil', 'timer', 'counter'].includes(element.type);
      if (i === sortedElements.length - 1 && isOutputType) {
        edges.push({
          id: `${element.id}-right-rail`,
          source: element.id,
          target: 'right-rail',
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep',
          style: { stroke: '#374151', strokeWidth: 2 },
        });
      }
    }

    // Also add any explicit connections from the data
    rung.elements.forEach((element) => {
      if (element.connections.left) {
        // Check if edge already exists
        const exists = edges.some(
          (e) => e.source === element.connections.left && e.target === element.id
        );
        if (!exists) {
          edges.push({
            id: `${element.connections.left}-${element.id}`,
            source: element.connections.left,
            target: element.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'smoothstep',
            style: { stroke: '#374151', strokeWidth: 2 },
          });
        }
      }
    });
  });

  return edges;
}

interface DropData {
  type: 'contact' | 'coil' | 'timer' | 'counter' | 'branch';
  subType: ContactType | CoilType | TimerType | CounterType | BranchType;
}

interface CanvasProps {
  className?: string;
}

export function Canvas({ className = '' }: CanvasProps) {
  const project = useStore((state) => state.project);
  const selectedElementId = useStore((state) => state.selectedElementId);
  const updateElement = useStore((state) => state.updateElement);
  const removeElement = useStore((state) => state.removeElement);
  const setSelectedElement = useStore((state) => state.setSelectedElement);
  const connectElements = useStore((state) => state.connectElements);
  const addRung = useStore((state) => state.addRung);
  const addElement = useStore((state) => state.addElement);
  const reorderRungElements = useStore((state) => state.reorderRungElements);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndo = useStore((state) => state.canUndo);
  const canRedo = useStore((state) => state.canRedo);
  const powerFlow = useStore((state) => state.simulation.powerFlow);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const handleVariableChange = useCallback(
    (id: string, variable: string) => {
      updateElement(id, { variable } as Partial<LadderElement>);
    },
    [updateElement]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeElement(id);
    },
    [removeElement]
  );

  const initialNodes = useMemo(
    () => projectToNodes(project, handleVariableChange, handleDelete, selectedElementId, powerFlow),
    [project, handleVariableChange, handleDelete, selectedElementId, powerFlow]
  );

  const initialEdges = useMemo(
    () => projectToEdges(project),
    [project]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when project or powerFlow changes
  useMemo(() => {
    const newNodes = projectToNodes(project, handleVariableChange, handleDelete, selectedElementId, powerFlow);
    setNodes(newNodes);
  }, [project, handleVariableChange, handleDelete, selectedElementId, powerFlow, setNodes]);

  // Update edges when project changes
  useMemo(() => {
    const newEdges = projectToEdges(project);
    setEdges(newEdges);
  }, [project, setEdges]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        connectElements(connection.source, connection.target, 'right');
      }
      setEdges((eds) => addEdge(connection, eds));
    },
    [connectElements, setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id !== 'left-rail' && node.id !== 'right-rail') {
        setSelectedElement(node.id);
      }
    },
    [setSelectedElement]
  );

  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
  }, [setSelectedElement]);

  // Handle drop from palette
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const dropData: DropData = JSON.parse(data);

        // Get current project state
        let currentProject = useStore.getState().project;

        // Ensure we have at least one rung
        if (currentProject.rungs.length === 0) {
          addRung();
          currentProject = useStore.getState().project;
        }

        // Always use the first rung for simplicity
        const rung = currentProject.rungs[0];

        // Calculate x position based on existing elements (append to end)
        const xPos = rung.elements.length;

        // Get next available variable name
        const variable = getNextVariable(currentProject, dropData.type);

        // Create element based on type
        if (dropData.type === 'contact') {
          const element = createContactElement(
            rung.id,
            { x: xPos, y: 0 },
            variable,
            dropData.subType as ContactType
          );
          addElement(rung.id, element);
        } else if (dropData.type === 'coil') {
          const element = createCoilElement(
            rung.id,
            { x: xPos, y: 0 },
            variable,
            dropData.subType as CoilType
          );
          addElement(rung.id, element);
        } else if (dropData.type === 'timer') {
          const element = createTimerElement(
            rung.id,
            { x: xPos, y: 0 },
            variable,
            dropData.subType as TimerType
          );
          addElement(rung.id, element);
        } else if (dropData.type === 'counter') {
          const element = createCounterElement(
            rung.id,
            { x: xPos, y: 0 },
            variable,
            dropData.subType as CounterType
          );
          addElement(rung.id, element);
        } else if (dropData.type === 'branch') {
          const element = createBranchElement(
            rung.id,
            { x: xPos, y: 0 },
            dropData.subType as BranchType
          );
          addElement(rung.id, element);
        }

        // Reorder elements to maintain proper ladder logic order
        // contacts -> branches -> timers/counters -> coils
        reorderRungElements(rung.id);
      } catch (err) {
        console.error('Failed to handle drop:', err);
      }
    },
    [addRung, addElement, reorderRungElements]
  );

  // Keyboard shortcuts
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          removeElement(selectedElementId);
          setSelectedElement(null);
        }
      }
    },
    [selectedElementId, removeElement, setSelectedElement, undo, redo, canUndo, canRedo]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className={`w-full h-full ${className}`}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#374151', strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{ backgroundColor: '#f3f4f6' }}
        />
        <Panel position="top-left" className="bg-white/80 px-3 py-1 rounded shadow text-sm">
          Ladder Logic Editor
        </Panel>

        {/* Rung Management */}
        <Panel position="bottom-left" className="flex flex-col gap-2">
          <button
            onClick={() => addRung()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow"
            title="Add new rung"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Rung</span>
          </button>
          <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded shadow">
            {project.rungs.length} rung{project.rungs.length !== 1 ? 's' : ''}
          </div>
        </Panel>

        {/* Empty state */}
        {project.rungs.every(rung => rung.elements.length === 0) && (
          <Panel position="top-center" className="mt-20">
            <div className="bg-white/90 rounded-lg shadow-lg p-6 text-center max-w-sm">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Start Building Your Ladder
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Drag components from the left palette to create your ladder logic diagram.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">┤ ─ Contact</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">( ) Coil</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">TON Timer</span>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">CTU Counter</span>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
