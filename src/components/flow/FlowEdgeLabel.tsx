"use client";

import {
  EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge,
} from "@xyflow/react";
import { useState } from "react";

type EdgeData = {
  label?:          string;
  onLabelChange?:  (id: string, label: string) => void;
  isLoop?:         boolean;
};

export default function FlowEdgeLabel({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected, markerEnd, style,
}: EdgeProps) {
  const d = (data ?? {}) as EdgeData;
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(d.label ?? "");

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  function confirm() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== (d.label ?? "")) d.onLabelChange?.(id, trimmed);
  }

  const hasLabel = !!(d.label || editing);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke:      selected ? "#60a5fa" : (style?.stroke ?? "#374151"),
          strokeWidth: selected ? 2 : (style?.strokeWidth ?? 1.5),
        }}
      />

      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position:        "absolute",
              transform:       `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents:   "all",
              background:      "#111827",
              border:          `1px solid ${selected ? "#60a5fa" : "#1f2937"}`,
              borderRadius:    6,
              padding:         "2px 6px",
              fontSize:        10,
              color:           "#9ca3af",
              cursor:          "pointer",
              userSelect:      "none",
            }}
            onDoubleClick={() => { setDraft(d.label ?? ""); setEditing(true); }}
            className="nodrag nopan"
          >
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={confirm}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  { e.preventDefault(); confirm(); }
                  if (e.key === "Escape") { setEditing(false); }
                }}
                style={{
                  background: "transparent",
                  border:     "none",
                  outline:    "none",
                  color:      "#d1d5db",
                  fontSize:   10,
                  width:      80,
                }}
                placeholder="etiqueta..."
              />
            ) : (
              <span>{d.label}</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Click derecho en edge → agregar label */}
      {!hasLabel && selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position:      "absolute",
              transform:     `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              onClick={() => { setDraft(""); setEditing(true); }}
              style={{
                background:   "#111827",
                border:       "1px dashed #374151",
                borderRadius: 4,
                color:        "#6b7280",
                fontSize:     9,
                padding:      "1px 5px",
                cursor:       "pointer",
              }}
            >
              + label
            </button>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Botón eliminar edge — visible al seleccionar */}
      {selected && !hasLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position:      "absolute",
              transform:     `translate(+125%, -35%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              zIndex:        10,
            }}
            className="nodrag nopan"
          >
            <button
              onClick={() => {
                // Disparar evento personalizado para que el visualizador elimine el edge
                window.dispatchEvent(new CustomEvent("remove-edge", { detail: { id } }));
              }}
              style={{
                background:   "#1a0a0a",
                border:       "1px solid #ef4444",
                borderRadius: "50%",
                width:        18,
                height:       18,
                color:        "#f87171",
                cursor:       "pointer",
                fontSize:     12,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}