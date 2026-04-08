"use client";

import { Position, NodeProps } from "@xyflow/react";
import FlowNodeBase from "./FlowNodeBase";
import type { HandleSpec } from "./FlowNodeBase";

type Data = { label: string };

const HANDLES: HandleSpec[] = [
  {
    id: "right", type: "source", position: Position.Right,
    top: "50%", color: "#6366f1", label: "Pantalla →",
  },
];

export default function FlowNodeActor({ data, selected }: NodeProps) {
  const d = data as Data;
  return (
    <FlowNodeBase
      selected={!!selected}
      bg="#1e1b4b"
      borderColor="#6366f1"
      borderColorSel="#818cf8"
      glowColor="#6366f133"
      badge="👤 Actor"
      badgeColor="#818cf8"
      label={d.label || "Usuario"}
      labelColor="#c7d2fe"
      handles={HANDLES}
      minWidth={180}
      padLeft={16}
      padRight={72}
      overlay={
        <div style={{
          position:      "absolute",
          inset:         -5,
          borderRadius:  14,
          border:        "2px solid #6366f1",
          opacity:       0.35,
          animation:     "pulse 2s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      }
    />
  );
}
