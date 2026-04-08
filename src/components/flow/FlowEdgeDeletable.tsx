"use client";

import { BaseEdge, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";

/**
 * Edge personalizado con botón × al centro cuando está seleccionado.
 * Registrar como edgeType "flowEdge" en FlowVisualizer.
 */
export default function FlowEdgeDeletable({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  style, markerEnd, selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd as string}
        style={style}
      />

      {selected && (
        <foreignObject
          width={22}
          height={22}
          x={labelX - 11}
          y={labelY - 11}
          style={{ overflow: "visible", pointerEvents: "all" }}
        >
          <button
            onClick={handleDelete}
            title="Desconectar"
            style={{
              width:          22,
              height:         22,
              borderRadius:   "50%",
              background:     "#1f2937",
              border:         "1.5px solid #ef4444",
              color:          "#ef4444",
              fontSize:       12,
              fontWeight:     700,
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              lineHeight:     1,
              padding:        0,
              boxShadow:      "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            ×
          </button>
        </foreignObject>
      )}
    </>
  );
}
