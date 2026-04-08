"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { NODE_STYLES } from "@/lib/flowDomain";
import { useState, useRef, useEffect } from "react";

type NodeData = {
  label:          string;
  onLabelChange?: (id: string, label: string) => void;
  onDelete?:      (id: string) => void;
};

const S = NODE_STYLES.condition;

export default function FlowNodeDiamond({ id, data, selected }: NodeProps) {
  const d = data as NodeData;
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(d.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function confirm() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== d.label) d.onLabelChange?.(id, trimmed);
  }

  function handleDoubleClick() {
    setDraft(d.label);
    setEditing(true);
  }

  const size = 130;
  const half = size / 2;

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Rombo SVG */}
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <polygon
          points={`${half},4 ${size-4},${half} ${half},${size-4} 4,${half}`}
          fill={S.bg}
          stroke={selected ? "#60a5fa" : S.border}
          strokeWidth={selected ? 2 : 1}
        />
        {/* Labels de handles */}
        <text x={size + 4} y={half + 4} fontSize={9} fill="#22c55e" textAnchor="start">sí</text>
        <text x={half + 4} y={size + 12} fontSize={9} fill="#ef4444" textAnchor="middle">no</text>
      </svg>

      {/* Contenido centrado */}
      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "0 20px",
        pointerEvents:  editing ? "auto" : "none",
      }}>
        <span style={{
          fontSize: 9, color: S.text, opacity: 0.6,
          marginBottom: 4, pointerEvents: "none",
        }}>
          ◆ ¿Qué decide?
        </span>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={confirm}
            onKeyDown={(e) => {
              if (e.key === "Enter")  { e.preventDefault(); confirm(); }
              if (e.key === "Escape") { setEditing(false); setDraft(d.label); }
            }}
            style={{
              background:  "transparent",
              border:      "none",
              outline:     "none",
              color:       S.text,
              fontSize:    10,
              textAlign:   "center",
              width:       "100%",
              pointerEvents: "auto",
            }}
          />
        ) : (
          <span style={{
            fontSize:   10,
            fontWeight: 500,
            color:      S.text,
            textAlign:  "center",
            lineHeight: 1.3,
            opacity:    d.label ? 1 : 0.4,
            pointerEvents: "none",
          }}>
            {d.label || "¿condición?"}
          </span>
        )}

        {/* Botón eliminar */}
        {selected && (
          <button
            onMouseDown={(e) => { e.stopPropagation(); d.onDelete?.(id); }}
            style={{
              position:   "absolute",
              top:        -8,
              right:      -8,
              background: "#1a0a0a",
              border:     "1px solid #ef4444",
              borderRadius: "50%",
              width:      18,
              height:     18,
              color:      "#f87171",
              cursor:     "pointer",
              fontSize:   11,
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Handle entrada (left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: S.border, width: 8, height: 8 }}
      />
      {/* Handle sí (right) — camino principal continúa a la derecha */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{ background: "#22c55e", width: 8, height: 8 }}
      />
      {/* Handle no (bottom) — rama alternativa baja */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ background: "#ef4444", width: 8, height: 8 }}
      />
    </div>
  );
}