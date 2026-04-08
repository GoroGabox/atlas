"use client";

import { EdgeProps, EdgeLabelRenderer, BaseEdge } from "@xyflow/react";
import { useState } from "react";

type EdgeData = {
  label?:         string;
  onLabelChange?: (id: string, label: string) => void;
};

export default function FlowEdgeLoop({
  id, sourceX, sourceY, targetX, targetY,
  data, selected, markerEnd, style,
}: EdgeProps) {
  const d = (data ?? {}) as EdgeData;
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(d.label ?? "repetir");

  // Curva hacia la izquierda para representar el loop
  const offset = 80;
  const midY   = (sourceY + targetY) / 2;
  const path   = `M ${sourceX} ${sourceY} C ${sourceX - offset} ${sourceY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`;
  const labelX = sourceX - offset - 10;
  const labelY = midY;

  function confirm() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== (d.label ?? "")) d.onLabelChange?.(id, trimmed);
  }

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke:          selected ? "#60a5fa" : "#8b5cf6",
          strokeWidth:     selected ? 2 : 1.5,
          strokeDasharray: "5 3",
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position:      "absolute",
            transform:     `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            background:    "#1a0a2e",
            border:        "1px solid #8b5cf6",
            borderRadius:  6,
            padding:       "2px 7px",
            fontSize:      10,
            color:         "#c4b5fd",
            cursor:        "pointer",
          }}
          onDoubleClick={() => { setDraft(d.label ?? "repetir"); setEditing(true); }}
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
                background: "transparent", border: "none", outline: "none",
                color: "#c4b5fd", fontSize: 10, width: 80,
              }}
            />
          ) : (
            <span>↻ {d.label ?? "repetir"}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}