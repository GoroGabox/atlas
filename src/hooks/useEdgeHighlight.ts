import { useState, useCallback } from "react";
import { Edge, Node } from "@xyflow/react";

export function useEdgeHighlight(edges: Edge[]) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const getHighlightedEdges = useCallback(
    (nodeId: string | null): Edge[] => {
      if (!nodeId) return edges.map((e) => ({ ...e, style: { ...e.style, opacity: 1 } }));
      return edges.map((e) => {
        const connected = e.source === nodeId || e.target === nodeId;
        return {
          ...e,
          style: {
            ...e.style,
            opacity:     connected ? 1 : 0.08,
            strokeWidth: connected ? 2.5 : e.style?.strokeWidth ?? 1.5,
          },
          animated: connected ? true : false,
        };
      });
    },
    [edges]
  );

  const onNodeMouseEnter = useCallback(
    (_: unknown, node: Node) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  return {
    hoveredNodeId,
    highlightedEdges: getHighlightedEdges(hoveredNodeId),
    onNodeMouseEnter,
    onNodeMouseLeave,
  };
}