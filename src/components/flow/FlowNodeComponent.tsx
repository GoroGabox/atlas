"use client";

import { Position, NodeProps } from "@xyflow/react";
import FlowNodeBase from "./FlowNodeBase";
import type { HandleSpec } from "./FlowNodeBase";

type Data = { label: string; sublabel?: string };

/**
 * Handles fijos (sin conteo dinámico):
 *   LEFT  — from-screen   target ← Pantalla
 *   RIGHT — to-service-0  source → Servicio  (único)
 *   RIGHT — data-in       target ← Datos de Servicio  (siempre abajo)
 */
const HANDLES: HandleSpec[] = [
  {
    id: "from-screen", type: "target", position: Position.Left,
    top: "50%", color: "#06b6d4", label: "← Pantalla",
  },
  {
    id: "to-service-0", type: "source", position: Position.Right,
    top: "35%", color: "#06b6d4", label: "Servicio →",
  },
  {
    id: "data-in", type: "target", position: Position.Right,
    top: "65%", color: "#7c3aed", label: "← Datos",
  },
];

export default function FlowNodeComponent({ data, selected }: NodeProps) {
  const d = data as Data;
  return (
    <FlowNodeBase
      selected={!!selected}
      bg="#0a2020"
      borderColor="#06b6d4"
      borderColorSel="#22d3ee"
      glowColor="#06b6d433"
      badge="◻ Componente"
      badgeColor="#22d3ee"
      label={d.label || "Componente"}
      sublabel={d.sublabel}
      labelColor="#67e8f9"
      handles={HANDLES}
      minWidth={240}
      minHeight={88}
    />
  );
}
