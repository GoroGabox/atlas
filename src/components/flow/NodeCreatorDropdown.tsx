"use client";

const NODE_META: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  flowScreen:   { label: "Pantalla",    icon: "🖥",  color: "#3b82f6", desc: "UI screen or page" },
  flowComp:     { label: "Componente",  icon: "◻",  color: "#06b6d4", desc: "UI component" },
  flowService:  { label: "Servicio",    icon: "⚙",  color: "#f59e0b", desc: "Frontend service" },
  flowEndpoint: { label: "Endpoint",    icon: "🔗", color: "#eab308", desc: "API endpoint" },
};

type Props = {
  screenX:    number;
  screenY:    number;
  validTypes: string[];
  onSelect:   (type: string) => void;
  onClose:    () => void;
};

export default function NodeCreatorDropdown({
  screenX, screenY, validTypes, onSelect, onClose,
}: Props) {
  if (validTypes.length === 0) return null;

  return (
    <>
      {/* Overlay transparente para cerrar */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 998 }}
        onClick={onClose}
      />
      <div style={{
        position:     "fixed",
        left:         screenX,
        top:          screenY,
        zIndex:       999,
        background:   "#0f172a",
        border:       "1px solid #1f2937",
        borderRadius: 10,
        padding:      "4px",
        boxShadow:    "0 8px 24px rgba(0,0,0,0.6)",
        minWidth:     176,
        transform:    "translate(-50%, 10px)",
      }}>
        <p style={{
          fontSize: 9, color: "#4b5563", padding: "4px 10px 4px",
          textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
        }}>
          Agregar nodo
        </p>
        {validTypes.map((type) => {
          const m = NODE_META[type];
          if (!m) return null;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "7px 10px",
                background: "none", border: "none",
                cursor: "pointer", borderRadius: 7,
                color: "#e5e7eb", fontSize: 12, fontWeight: 500,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1e293b";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "none";
              }}
            >
              <span style={{ fontSize: 14 }}>{m.icon}</span>
              <div>
                <div style={{ color: m.color, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 9, color: "#6b7280" }}>{m.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
