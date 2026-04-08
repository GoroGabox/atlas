"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  Connection, Node, Edge, BackgroundVariant, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEdgeHighlight } from "@/hooks/useEdgeHighlight";

type RawModule  = { id: string; name: string; domain: string; riskLevel: string };
type RawFeature = { id: string; name: string; moduleId: string; riskLevel: string; technicalComplexity: string };
type RawRelation = { id: string; fromType: string; fromId: string; relationType: string; toType: string; toId: string };

type SharedService = { id: string; name: string; type: string };

type Props = {
  modules:          RawModule[];
  features:         RawFeature[];
  relations:        RawRelation[];
  onNodeClick?:     (event: unknown, node: { id: string; data: { label: unknown } }) => void;
  sharedServiceIds?: Set<string>;
  sharedServices?:  SharedService[];
};

const relationColors: Record<string, string> = {
  contains:   "#6366f1", uses:       "#3b82f6",
  calls:      "#f59e0b", depends_on: "#ef4444",
  owned_by:   "#8b5cf6", known_by:   "#10b981",
  has_risk:   "#f97316", has_debt:   "#ec4899",
};

const riskBorder: Record<string, string> = {
  low: "#22c55e", medium: "#f59e0b", high: "#ef4444",
};

function layoutNodes(modules: RawModule[], features: RawFeature[]): Node[] {
  const nodes: Node[] = [];
  const colWidth    = 260;
  const rowHeight   = 110;
  const featureXOff = 320;

  modules.forEach((mod, mi) => {
    nodes.push({
      id: `module-${mod.id}`,
      position: { x: 0, y: mi * rowHeight },
      data: {
        label: (
          <div>
            <p className="text-xs font-bold text-indigo-300">📦 {mod.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{mod.domain}</p>
          </div>
        ),
      },
      style: {
        background: "#1e1b4b",
        border: `1.5px solid ${riskBorder[mod.riskLevel] ?? "#6366f1"}`,
        borderRadius: "10px", padding: "10px 14px", minWidth: "160px",
        color: "#a5b4fc", cursor: "pointer",
      },
    });

    features.filter((f) => f.moduleId === mod.id).forEach((feat, fi) => {
      nodes.push({
        id: `feature-${feat.id}`,
        position: { x: featureXOff + fi * colWidth, y: mi * rowHeight },
        data: {
          label: (
            <div>
              <p className="text-xs font-semibold text-blue-300">⚡ {feat.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">complejidad: {feat.technicalComplexity}</p>
            </div>
          ),
        },
        style: {
          background: "#0f172a",
          border: `1.5px solid ${riskBorder[feat.riskLevel] ?? "#3b82f6"}`,
          borderRadius: "10px", padding: "10px 14px", minWidth: "170px",
          color: "#93c5fd", cursor: "pointer",
        },
      });
    });
  });

  return nodes;
}

function buildEdges(relations: RawRelation[]): Edge[] {
  return relations
    .map((rel) => {
      const sourceId = `${rel.fromType}-${rel.fromId}`;
      const targetId = `${rel.toType}-${rel.toId}`;
      if (sourceId === targetId) return null;
      return {
        id: `rel-${rel.id}`,
        source: sourceId,
        target: targetId,
        label: rel.relationType,
        labelStyle: { fill: "#9ca3af", fontSize: 10 },
        labelBgStyle: { fill: "#111827" },
        labelBgPadding: [4, 2] as [number, number],
        style: {
          stroke: relationColors[rel.relationType] ?? "#6b7280",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: relationColors[rel.relationType] ?? "#6b7280",
        },
        animated: rel.relationType === "calls" || rel.relationType === "depends_on",
      };
    })
    .filter(Boolean) as Edge[];
}

export default function DependencyGraph({ modules, features, relations, onNodeClick, sharedServices }: Props) {
  const initialNodes = useMemo(() => {
    const base = layoutNodes(modules, features);
    // Agregar nodos de servicios compartidos en una fila debajo
    const sharedNodes: Node[] = (sharedServices ?? []).map((svc, i) => ({
      id: `service-${svc.id}`,
      position: { x: 320 + i * 220, y: modules.length * 110 + 60 },
      data: {
        label: (
          <div>
            <p className="text-xs font-bold text-teal-300">⚙ {svc.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">servicio compartido</p>
          </div>
        ),
      },
      style: {
        background: "#042f2e",
        border: "1.5px solid #14b8a6",
        borderRadius: "10px", padding: "10px 14px", minWidth: "160px",
        color: "#5eead4", cursor: "pointer",
      },
    }));
    return [...base, ...sharedNodes];
  }, [modules, features, sharedServices]);

  const initialEdges = useMemo(() => buildEdges(relations), [relations]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { highlightedEdges, onNodeMouseEnter, onNodeMouseLeave } = useEdgeHighlight(edges);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge(c, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={highlightedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick as never}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f2937" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const id = n.id as string;
            if (id.startsWith("module"))  return "#6366f1";
            if (id.startsWith("service")) return "#14b8a6";
            return "#3b82f6";
          }}
          style={{ background: "#111827" }}
        />
      </ReactFlow>
    </div>
  );
}