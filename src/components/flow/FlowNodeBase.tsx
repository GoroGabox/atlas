"use client";

import { Handle, Position } from "@xyflow/react";
import type { CSSProperties } from "react";

// ── Handle specification ──────────────────────────────────────────────────────
export type HandleSpec = {
  id:       string;
  type:     "source" | "target";
  position: Position;
  top:      string;   // CSS % string, e.g. "50%"
  color:    string;
  label:    string;   // always shown next to the dot
};

// ── pct helper (exported for node components) ─────────────────────────────────
/** Vertical position for handle i of n total on one side: evenly distributed */
export function pct(i: number, n: number): string {
  return `${((i + 1) / (n + 1)) * 100}%`;
}

// ── BaseNode props ────────────────────────────────────────────────────────────
export type BaseNodeProps = {
  selected:        boolean;
  bg:              string;
  borderColor:     string;
  borderColorSel:  string;
  glowColor:       string;
  badge:           string;
  badgeColor:      string;
  /** Plain string label rendered below badge */
  label?:          string;
  labelColor?:     string;
  /** Small secondary text below label */
  sublabel?:       string;
  /** Custom content (replaces label+sublabel) */
  labelContent?:   React.ReactNode;
  handles:         HandleSpec[];
  minWidth?:       number;
  minHeight?:      number;
  /**
   * Horizontal padding to reserve space for handle labels.
   * Defaults: left=68, right=68.
   * Use 14 for a side with no handles (no label zone needed).
   */
  padLeft?:        number;
  padRight?:       number;
  /** Absolutely-positioned extras (e.g. pulse ring for Actor) */
  overlay?:        React.ReactNode;
};

// ── LABEL_ZONE: px from the node edge where handle labels live ─────────────────
// Handle dot: 10px, gap: 4px, label text: ~50px → total ~64px safe zone
const HANDLE_ZONE = 68;

// ── Single handle + label ─────────────────────────────────────────────────────
function HandleWithLabel({ spec: h }: { spec: HandleSpec }) {
  const isLeft = h.position === Position.Left;

  const handleStyle: CSSProperties = {
    background: h.color,
    width:      10,
    height:     10,
    top:        h.top,
    opacity:    1,
    border:     "2px solid #0f172a",
    boxShadow:  `0 0 5px ${h.color}99`,
  };

  const labelStyle: CSSProperties = {
    position:      "absolute",
    top:           h.top,
    transform:     "translateY(-50%)",
    fontSize:      8,
    fontWeight:    600,
    color:         h.color,
    whiteSpace:    "nowrap",
    pointerEvents: "none",
    userSelect:    "none",
    lineHeight:    1,
    opacity:       0.85,
    // Labels start just inside the handle dot
    ...(isLeft ? { left: 14 } : { right: 14 }),
  };

  return (
    <>
      <Handle type={h.type} position={h.position} id={h.id} style={handleStyle} />
      <span style={labelStyle}>{h.label}</span>
    </>
  );
}

// ── FlowNodeBase ──────────────────────────────────────────────────────────────
export default function FlowNodeBase({
  selected,
  bg, borderColor, borderColorSel, glowColor,
  badge, badgeColor,
  label, labelColor, sublabel,
  labelContent,
  handles,
  minWidth  = 240,
  minHeight = 72,
  padLeft,
  padRight,
  overlay,
}: BaseNodeProps) {
  // Auto-detect which sides have handles
  const hasLeft  = handles.some((h) => h.position === Position.Left);
  const hasRight = handles.some((h) => h.position === Position.Right);

  const pl = padLeft  ?? (hasLeft  ? HANDLE_ZONE : 16);
  const pr = padRight ?? (hasRight ? HANDLE_ZONE : 16);

  return (
    <div style={{
      background:    bg,
      border:        `${selected ? 2 : 1}px solid ${selected ? borderColorSel : borderColor}`,
      borderRadius:  10,
      padding:       `10px ${pr}px 12px ${pl}px`,
      minWidth,
      minHeight,
      position:      "relative",
      boxShadow:     selected ? `0 0 0 3px ${glowColor}` : "none",
    }}>
      {overlay}

      {/* Badge */}
      <div style={{
        fontSize:      9,
        fontWeight:    700,
        color:         badgeColor,
        opacity:       0.75,
        marginBottom:  5,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
      }}>
        {badge}
      </div>

      {/* Label / custom content */}
      {labelContent ?? (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: labelColor ?? "#e5e7eb" }}>
            {label || "—"}
          </div>
          {sublabel && (
            <div style={{
              fontSize:     9,
              color:        labelColor ?? "#9ca3af",
              opacity:      0.6,
              marginTop:    2,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {sublabel}
            </div>
          )}
        </>
      )}

      {/* Handles with labels */}
      {handles.map((h) => (
        <HandleWithLabel key={h.id} spec={h} />
      ))}
    </div>
  );
}
