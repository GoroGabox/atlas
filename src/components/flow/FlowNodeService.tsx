"use client";

import { Position, NodeProps } from "@xyflow/react";
import FlowNodeBase from "./FlowNodeBase";
import type { HandleSpec } from "./FlowNodeBase";

type Data = { label: string; sublabel?: string };

/**
 * Handles fijos:
 *   LEFT  25%  — from-comp-0   target ← Componentes
 *   LEFT  50%  — from-svc-0    target ← Otro servicio (inter-service)
 *   LEFT  75%  — data-out-0    source → Componentes (datos response)
 *   RIGHT 25%  — to-ep-req-0   source → Endpoint req
 *   RIGHT 50%  — to-svc-0      source → Otro servicio (inter-service)
 *   RIGHT 75%  — from-ep-res-0 target ← Endpoint res
 */
const HANDLES: HandleSpec[] = [
  {
    id: "from-comp-0", type: "target", position: Position.Left,
    top: "25%", color: "#f59e0b", label: "← Comp",
  },
  {
    id: "from-svc-0", type: "target", position: Position.Left,
    top: "50%", color: "#10b981", label: "← Svc",
  },
  {
    id: "data-out-0", type: "source", position: Position.Left,
    top: "75%", color: "#7c3aed", label: "Datos →",
  },
  {
    id: "to-ep-req-0", type: "source", position: Position.Right,
    top: "25%", color: "#f59e0b", label: "Req →",
  },
  {
    id: "to-svc-0", type: "source", position: Position.Right,
    top: "50%", color: "#10b981", label: "Svc →",
  },
  {
    id: "from-ep-res-0", type: "target", position: Position.Right,
    top: "75%", color: "#7c3aed", label: "← Res",
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
      minHeight={100}
    />
  );
}
