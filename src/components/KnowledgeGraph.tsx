"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type OwnerEntry = { id: string; name: string; role: "pm" | "tech" };
type Person = {
  name:     string;
  modules:  OwnerEntry[];
  features: OwnerEntry[];
};

type Props = { 
  people: Person[],
  highlightName?: string | null,
  onPersonClick?: (name: string) => void,
 };

const COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
];

function buildGraph(people: Person[]) {
  const nodes: Node[] = [];
  const edges: Edge[]  = [];

  const modulesSeen = new Map<string, boolean>();
  const featuresSeen = new Map<string, boolean>();

  const totalPeople = people.length;
  const personRadius = 280;

  people.forEach((person, pi) => {
    const angle = (2 * Math.PI * pi) / totalPeople - Math.PI / 2;
    const px    = 500 + personRadius * Math.cos(angle);
    const py    = 320 + personRadius * Math.sin(angle);
    const color = COLORS[pi % COLORS.length];

    // Nodo persona
    nodes.push({
      id: `person-${person.name}`,
      position: { x: px, y: py },
      data: {
        label: (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: `${color}33`, border: `2px solid ${color}` }}
            >
              {person.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold" style={{ color }}>
              {person.name}
            </span>
            <span className="text-[10px] text-gray-400">
              {person.modules.length}m · {person.features.length}f
            </span>
          </div>
        ),
      },
      style: {
        background: "#0f0f1a",
        border: `1.5px solid ${color}`,
        borderRadius: "12px",
        padding: "10px 14px",
        minWidth: "100px",
        textAlign: "center" as const,
      },
    });

    // Nodos módulo
    person.modules.forEach((mod, mi) => {
      if (!modulesSeen.has(mod.id)) {
        modulesSeen.set(mod.id, true);
        const spread = (mi - person.modules.length / 2) * 180;
        const mx = px + Math.cos(angle) * 200 + Math.sin(angle) * spread;
        const my = py + Math.sin(angle) * 200 - Math.cos(angle) * spread;

        nodes.push({
          id: `module-${mod.id}`,
          position: { x: mx, y: my },
          data: {
            label: (
              <div>
                <p className="text-xs font-bold text-indigo-300">📦 {mod.name}</p>
              </div>
            ),
          },
          style: {
            background: "#1e1b4b",
            border: "1.5px solid #6366f1",
            borderRadius: "10px",
            padding: "8px 14px",
            minWidth: "120px",
          },
        });
      }

      edges.push({
        id: `e-${person.name}-mod-${mod.id}-${mod.role}`,
        source: `person-${person.name}`,
        target: `module-${mod.id}`,
        label: mod.role === "pm" ? "PM" : "Tech",
        labelStyle: { fill: "#6b7280", fontSize: 9 },
        labelBgStyle: { fill: "#111827" },
        style: { stroke: color, strokeWidth: 1.5, opacity: 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
    });

    // Nodos feature
    person.features.forEach((feat, fi) => {
      if (!featuresSeen.has(feat.id)) {
        featuresSeen.set(feat.id, true);
        const spread = (fi - person.features.length / 2) * 160;
        const fx = px + Math.cos(angle + 0.4) * 240 + Math.sin(angle) * spread;
        const fy = py + Math.sin(angle + 0.4) * 240 - Math.cos(angle) * spread;

        nodes.push({
          id: `feature-${feat.id}`,
          position: { x: fx, y: fy },
          data: {
            label: (
              <div>
                <p className="text-xs font-semibold text-blue-300">⚡ {feat.name}</p>
              </div>
            ),
          },
          style: {
            background: "#0f172a",
            border: "1.5px solid #3b82f6",
            borderRadius: "10px",
            padding: "8px 14px",
            minWidth: "140px",
          },
        });
      }

      edges.push({
        id: `e-${person.name}-feat-${feat.id}-${feat.role}`,
        source: `person-${person.name}`,
        target: `feature-${feat.id}`,
        label: feat.role === "pm" ? "PM" : "Tech",
        labelStyle: { fill: "#6b7280", fontSize: 9 },
        labelBgStyle: { fill: "#111827" },
        style: { stroke: color, strokeWidth: 1, opacity: 0.4, strokeDasharray: "4 3" },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
    });
  });

  return { nodes, edges };
}

export default function KnowledgeGraph({ people }: Props) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(people),
    [people]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  if (people.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Sin owners registrados para visualizar.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "640px" }} className="rounded-lg overflow-hidden border border-gray-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f2937" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const id = n.id as string;
            if (id.startsWith("person"))  return "#6366f1";
            if (id.startsWith("module"))  return "#4f46e5";
            if (id.startsWith("feature")) return "#3b82f6";
            return "#6b7280";
          }}
          style={{ background: "#111827" }}
        />
      </ReactFlow>
    </div>
  );
}