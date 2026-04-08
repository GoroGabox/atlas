"use client";

import { useEffect, useRef } from "react";

type TooltipData = {
  x:       number;
  y:       number;
  message: string;
  type:    "valid" | "warn" | "invalid";
} | null;

type Props = { tooltip: TooltipData };

const colors = {
  valid:   { bg: "#0f2318", border: "#22c55e", text: "#86efac", icon: "✓" },
  warn:    { bg: "#1c1007", border: "#f59e0b", text: "#fcd34d", icon: "⚠" },
  invalid: { bg: "#1a0a0a", border: "#ef4444", text: "#fca5a5", icon: "✕" },
};

export default function ConnectionTooltip({ tooltip }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Fade out via DOM — sin setState
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!tooltip) { el.style.opacity = "0"; return; }

    el.style.opacity = "1";
    const t = setTimeout(() => { el.style.opacity = "0"; }, tooltip.type === "valid" ? 1500 : 3000);
    return () => clearTimeout(t);
  }, [tooltip]);

  // Siempre renderizado — ocultamos vía opacity + pointerEvents
  const c = tooltip ? colors[tooltip.type] : colors.valid;

  return (
    <div
      ref={ref}
      style={{
        position:       "absolute",
        left:           tooltip?.x ?? 300,
        top:            (tooltip?.y ?? 200) - 48,
        transform:      "translateX(-50%)",
        zIndex:         50,
        background:     c.bg,
        border:         `1px solid ${c.border}`,
        borderRadius:   8,
        padding:        "6px 12px",
        display:        "flex",
        alignItems:     "center",
        gap:            7,
        pointerEvents:  "none",
        maxWidth:       260,
        opacity:        tooltip ? 1 : 0,
        transition:     "opacity 0.2s ease",
      }}
    >
      <span style={{ color: c.border, fontSize: 13, flexShrink: 0 }}>{c.icon}</span>
      <span style={{ color: c.text, fontSize: 11, lineHeight: 1.4 }}>
        {tooltip?.message ?? ""}
      </span>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}