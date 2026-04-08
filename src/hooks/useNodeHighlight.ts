import { useMemo } from "react";
import { Node, Edge } from "@xyflow/react";

type Props = {
  nodes:          Node[];
  edges:          Edge[];
  selectedNodeId: string | null;
};

// Dado un nodo action-N, encuentra todos los nodos del mismo paso
// (screen-N, action-N, system-N, result-N) excluyendo el actor
function getStepNodeIds(selectedNodeId: string, nodes: Node[], edges: Edge[]): Set<string> {
  const result = new Set<string>();

  // Encontrar el nodo action del paso seleccionado
  // El selectedNodeId puede ser cualquier nodo del paso
  let actionId: string | null = null;

  // Si seleccionaron directamente un action-N
  if (selectedNodeId.startsWith("action-")) {
    actionId = selectedNodeId;
  } else {
    // Buscar el action conectado a este nodo via edges
    for (const edge of edges) {
      if (edge.target === selectedNodeId && !edge.source.startsWith("start-actor")) {
        if (edge.source.startsWith("action-")) { actionId = edge.source; break; }
      }
      if (edge.source === selectedNodeId) {
        if (edge.target.startsWith("action-")) { actionId = edge.target; break; }
      }
    }
  }

  if (!actionId) {
    // Fallback: agregar solo el nodo seleccionado
    result.add(selectedNodeId);
    return result;
  }

  // Agregar el action
  result.add(actionId);

  // BFS limitado: agregar nodos conectados al action
  // que NO sean el actor de inicio
  const queue = [actionId];
  const visited = new Set<string>([actionId, "start-actor"]);

  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of edges) {
      const neighbor = edge.source === current ? edge.target
                     : edge.target === current ? edge.source
                     : null;
      if (!neighbor || visited.has(neighbor)) continue;
      if (neighbor === "start-actor") continue;
      if (neighbor.startsWith("start-")) continue;

      // Solo incluir nodos que no sean actor
      const nodeType = nodes.find((n) => n.id === neighbor)?.data?.nodeType as string;
      if (nodeType === "actor") continue;

      visited.add(neighbor);
      result.add(neighbor);
      queue.push(neighbor);
    }
  }

  return result;
}

export function useNodeHighlight({ nodes, edges, selectedNodeId }: Props) {
  const highlightedNodes = useMemo(() => {
    if (!selectedNodeId) return nodes; // sin selección → todos visibles al 100%

    const stepIds = getStepNodeIds(selectedNodeId, nodes, edges);
    if (!stepIds.size) return nodes;

    return nodes.map((n) => {
      const isActor    = n.id === "start-actor" || (n.data as { nodeType?: string })?.nodeType === "actor";
      const isInStep   = stepIds.has(n.id);
      const isSelected = n.id === selectedNodeId;

      return {
        ...n,
        style: {
          ...n.style,
          opacity:    isActor ? 1  // actor siempre semi-visible
                    : isInStep ? 1   // nodos del paso → 100%
                    : 0.12,          // resto → dimmed
          filter:    isInStep ? "drop-shadow(0 0 10px #60a5fa88)" : "none",
          transition: "opacity 0.2s, filter 0.2s",
        },
      };
    });
  }, [nodes, selectedNodeId, edges]);

  const highlightedEdges = useMemo(() => {
    if (!selectedNodeId) return edges; // sin selección → edges normales

    const stepIds = getStepNodeIds(selectedNodeId, nodes, edges);
    if (!stepIds.size) return edges;

    return edges.map((e) => {
      // Edge activo = conecta dos nodos del mismo paso
      const active = stepIds.has(e.source) && stepIds.has(e.target);
      // Edge al actor = siempre semi-visible
      const toActor = e.source === "start-actor" || e.target === "start-actor";

      return {
        ...e,
        style: {
          ...e.style,
          stroke:      active  ? "#60a5fa"
                     : toActor ? "#374151"
                     : "#1f2937",
          strokeWidth: active ? 2.5 : 1,
          opacity:     active  ? 1
                     : toActor ? 0.3
                     : 0.06,
        },
        animated: active,
      };
    });
  }, [edges, nodes, selectedNodeId]);

  return { highlightedNodes, highlightedEdges };
}