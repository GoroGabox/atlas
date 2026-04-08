"use client";

import { NodeType, NODE_STYLES } from "@/lib/flowDomain";

type Props = {
  isDirty:    boolean;
  canUndo:    boolean;
  canRedo:    boolean;
  saving:     boolean;
  onAddNode:  (type: NodeType) => void;
  onSave:     () => void;
  onUndo:     () => void;
  onRedo:     () => void;
};

const NODE_BUTTONS: { type: NodeType; key: string }[] = [
  { type: "actor",     key: "A" },
  { type: "screen",    key: "P" },
  { type: "action",    key: "C" },
  { type: "system",    key: "S" },
  { type: "result",    key: "R" },
  { type: "condition", key: "D" },
];

export default function FlowToolbar({
  isDirty, canUndo, canRedo, saving, onAddNode, onSave, onUndo, onRedo,
}: Props) {
  return (
    <div style={{
      position:       "absolute",
      top:            12,
      left:           "50%",
      transform:      "translateX(-50%)",
      zIndex:         10,
      display:        "flex",
      alignItems:     "center",
      gap:            8,
      background:     "#111827",
      border:         "1px solid #1f2937",
      borderRadius:   12,
      padding:        "6px 10px",
      boxShadow:      "0 4px 24px rgba(0,0,0,0.4)",
    }}>
      {/* Botones de tipo de nodo */}
      {NODE_BUTTONS.map(({ type, key }) => {
        const s = NODE_STYLES[type];
        return (
          <button
            key={type}
            onClick={() => onAddNode(type)}
            title={`${s.question} — ${s.hint}\n\nShortcut: ${key}`}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            5,
              padding:        "4px 9px",
              borderRadius:   7,
              border:         `1px solid ${s.border}`,
              background:     s.bg,
              color:          s.text,
              fontSize:       11,
              fontWeight:     500,
              cursor:         "pointer",
              transition:     "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span style={{ fontSize: 12 }}>{s.icon}</span>
            <span>{s.question.replace("¿", "").replace("?", "")}</span>
            <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 1 }}>{key}</span>
          </button>
        );
      })}

      {/* Separador */}
      <div style={{ width: 1, height: 20, background: "#1f2937" }} />

      {/* Undo / Redo */}
      <button
        onClick={onUndo} disabled={!canUndo}
        title="Deshacer (Cmd+Z)"
        style={{
          background: "none", border: "none", color: canUndo ? "#9ca3af" : "#374151",
          cursor: canUndo ? "pointer" : "not-allowed", fontSize: 14, padding: "2px 4px",
        }}
      >↩</button>
      <button
        onClick={onRedo} disabled={!canRedo}
        title="Rehacer (Cmd+Y)"
        style={{
          background: "none", border: "none", color: canRedo ? "#9ca3af" : "#374151",
          cursor: canRedo ? "pointer" : "not-allowed", fontSize: 14, padding: "2px 4px",
        }}
      >↪</button>

      {/* Separador */}
      <div style={{ width: 1, height: 20, background: "#1f2937" }} />

      {/* Estado + botón guardar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {isDirty && !saving && (
          <span style={{ fontSize: 10, color: "#fbbf24" }}>● Sin guardar</span>
        )}
        {saving && (
          <span style={{ fontSize: 10, color: "#60a5fa" }}>Guardando...</span>
        )}
        {!isDirty && !saving && (
          <span style={{ fontSize: 10, color: "#4ade80" }}>✓ Guardado</span>
        )}
        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          style={{
            padding:        "4px 12px",
            borderRadius:   7,
            border:         "none",
            background:     isDirty ? "#2563eb" : "#1f2937",
            color:          isDirty ? "#fff" : "#374151",
            fontSize:       11,
            fontWeight:     500,
            cursor:         isDirty ? "pointer" : "not-allowed",
            transition:     "background 0.15s",
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}