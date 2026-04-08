"use client";

import { Position, NodeProps } from "@xyflow/react";
import FlowNodeBase from "./FlowNodeBase";
import type { HandleSpec } from "./FlowNodeBase";

type Data = { label: string; sublabel?: string };

/**
 * Handles fijos:
 *   LEFT  — left     target ← Actor
 *   RIGHT — right-0  source → Componentes (único, todas las conexiones salen de aquí)
 */
const HANDLES: HandleSpec[] = [
  {
    id: "left", type: "target", position: Position.Left,
    top: "50%", color: "#3b82f6", label: "← Actor",
  },
  {
    id: "right-0", type: "source", position: Position.Right,
    top: "50%", color: "#3b82f6", label: "Comp →",
  },
];

export default function FlowNodeScreen({ data, selected }: NodeProps) {
  const d = data as Data;
  return (
    <FlowNodeBase
      selected={!!selected}
      bg="#0f2044"
      borderColor="#3b82f6"
      borderColorSel="#60a5fa"
      glowColor="#3b82f633"
      badge="🖥 Pantalla"
      badgeColor="#60a5fa"
      label={d.label || "Pantalla"}
      sublabel={d.sublabel}
      labelColor="#93c5fd"
      handles={HANDLES}
      minWidth={240}
      minHeight={68}
    />
  );
}
