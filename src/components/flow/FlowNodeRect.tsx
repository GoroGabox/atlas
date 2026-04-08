"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { NODE_STYLES, NodeType } from "@/lib/flowDomain";
import { useState, useRef, useEffect } from "react";

type NodeData = {
  label:         string;
  nodeType:      NodeType;
  isStart?:      boolean;
  onLabelChange?: (id: string, label: string) => void;
  onDelete?:      (id: string) => void;
};

function FlowNodeRectInner({ id, data, selected }: NodeProps) {
  const d     = data as NodeData;
  const style = NODE_STYLES[d.nodeType];

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(d.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Solo focus — no setState, no problema
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function confirm() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== d.label) d.onLabelChange?.(id, trimmed);
  }

  function handleDoubleClick() {
    if (d.isStart) return;
    setDraft(d.label); // sincronizar draft con label actual al abrir
    setEditing(true);
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        background:   style.bg,
        border:       `${selected ? "2px" : "1px"} solid ${selected ? "#60a5fa" : style.border}`,
        color:        style.text,
        borderRadius: "10px",
        padding:      "8px 14px",
        minWidth:     "140px",
        maxWidth:     "220px",
        position:     "relative",
        boxShadow:    selected ? `0 0 0 3px #60a5fa22` : "none",
        cursor:       d.isStart ? "default" : "grab",
        transition:   "box-shadow 0.15s",
      }}
    >
      {/* Pulso en nodo inicial */}
      {d.isStart && (
        <div style={{
          position:     "absolute",
          inset:        -4,
          borderRadius: 14,
          border:       `2px solid ${style.border}`,
          opacity:      0.4,
          animation:    "pulse 2s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Header con tipo */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <span style={{ fontSize: 11 }}>{style.icon}</span>
        <span style={{
          fontSize: 9, fontWeight: 600, opacity: 0.6,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {style.question}
        </span>
        {!d.isStart && selected && (
          <button
            onClick={(e) => { e.stopPropagation(); d.onDelete?.(id); }}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "#f87171", cursor: "pointer", fontSize: 12, padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Label editable */}
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
            background: "transparent",
            border:     "none",
            outline:    "none",
            color:      style.text,
            fontSize:   12,
            fontWeight: 500,
            width:      "100%",
            padding:    0,
          }}
          placeholder={style.hint.split(".")[0]}
        />
      ) : (
        <div style={{
          fontSize:  12,
          fontWeight: 500,
          opacity:   d.label ? 1 : 0.4,
          fontStyle: d.label ? "normal" : "italic",
        }}>
          {d.label || style.hint.split(".")[0] + "..."}
        </div>
      )}

      <Handle type="target" position={Position.Left}
        style={{ background: style.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right}
        style={{ background: style.border, width: 8, height: 8 }} />
    </div>
  );
}

export default FlowNodeRectInner;