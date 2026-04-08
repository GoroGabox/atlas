"use client";

import { Position, NodeProps } from "@xyflow/react";
import FlowNodeBase from "./FlowNodeBase";
import type { HandleSpec } from "./FlowNodeBase";

type Data = { label: string; method: string };

const METHOD_COLOR: Record<string, string> = {
  GET:    "#22c55e",
  POST:   "#3b82f6",
  PUT:    "#f59e0b",
  PATCH:  "#eab308",
  DELETE: "#ef4444",
};

const HANDLES: HandleSpec[] = [
  // LEFT top — req-in: receives request from Service
  {
    id: "req-in", type: "target", position: Position.Left,
    top: "35%", color: "#eab308", label: "← Req",
  },
  // LEFT bottom — res-out: sends response back to Service
  {
    id: "res-out", type: "source", position: Position.Left,
    top: "65%", color: "#7c3aed", label: "Res →",
  },
];

export default function FlowNodeEndpoint({ data, selected }: NodeProps) {
  const d     = data as Data;
  const color = METHOD_COLOR[d.method?.toUpperCase()] ?? "#6b7280";

  return (
    <FlowNodeBase
      selected={!!selected}
      bg="#14110a"
      borderColor="#eab308"
      borderColorSel="#facc15"
      glowColor="#eab30833"
      badge="🔗 Endpoint"
      badgeColor="#facc15"
      handles={HANDLES}
      minWidth={220}
      minHeight={88}
      padLeft={72}
      padRight={16}
      labelContent={
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
          <span style={{
            fontSize:       9,
            fontWeight:     800,
            padding:        "2px 6px",
            borderRadius:   4,
            background:     `${color}22`,
            color,
            border:         `1px solid ${color}55`,
            letterSpacing:  "0.04em",
            flexShrink:     0,
          }}>
            {d.method || "GET"}
          </span>
          <span style={{
            fontSize:    11,
            fontWeight:  500,
            color:       "#fde047",
            fontFamily:  "monospace",
            wordBreak:   "break-all",
            lineHeight:  1.3,
          }}>
            {d.label || "/path"}
          </span>
        </div>
      }
    />
  );
}
