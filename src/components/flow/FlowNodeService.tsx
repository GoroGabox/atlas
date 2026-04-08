"use client";

import { Position, NodeProps } from "@xyflow/react";
import FlowNodeBase from "./FlowNodeBase";
import type { HandleSpec } from "./FlowNodeBase";

type Data = { label: string; sublabel?: string };

/**
 * Handles fijos:
 *   LEFT  top    — from-comp-0   target ← Componentes  (único, todas las conexiones entran aquí)
 *   LEFT  bottom — data-out-0    source → Componentes  (único, todos los datos salen aquí)
 *   RIGHT top    — to-ep-req-0   source → Endpoint req (único)
 *   RIGHT bottom — from-ep-res-0 target ← Endpoint res (único)
 */
const HANDLES: HandleSpec[] = [
  {
    id: "from-comp-0", type: "target", position: Position.Left,
    top: "33%", color: "#f59e0b", label: "← Comp",
  },
  {
    id: "data-out-0", type: "source", position: Position.Left,
    top: "67%", color: "#7c3aed", label: "Datos →",
  },
  {
    id: "to-ep-req-0", type: "source", position: Position.Right,
    top: "33%", color: "#f59e0b", label: "Req →",
  },
  {
    id: "from-ep-res-0", type: "target", position: Position.Right,
    top: "67%", color: "#7c3aed", label: "← Res",
  },
];

export default function FlowNodeService({ data, selected }: NodeProps) {
  const d = data as Data;
  return (
    <FlowNodeBase
      selected={!!selected}
      bg="#1c1405"
      borderColor="#f59e0b"
      borderColorSel="#fbbf24"
      glowColor="#f59e0b33"
      badge="⚙ Servicio"
      badgeColor="#fbbf24"
      label={d.label || "Servicio"}
      sublabel={d.sublabel}
      labelColor="#fcd34d"
      handles={HANDLES}
      minWidth={250}
      minHeight={90}
    />
  );
}
