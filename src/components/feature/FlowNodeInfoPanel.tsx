"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { extractEntityId, isStepBacked } from "@/components/FlowVisualizer";
import { removeEntityFromFlow } from "@/lib/actions/flows";
import type { EntityCatalog } from "@/lib/types/entities";

// ── Types ────────────────────────────────────────────────────────────────────
type Step = {
  id:                 string;
  order:              number;
  action:             string;
  actor:              string | null;
  screen:             string | null;
  components:         string | null;
  services:           string | null;
  endpoints:          string | null;
  responseComponents: string | null;
};

type Props = {
  nodeId:    string;
  steps:     Step[];
  catalog:   EntityCatalog;
  flowId:    string;
  featureId: string;
  /** Called after the entity is removed from the flow (to clear selection) */
  onRemoved?: () => void;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseArr(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

type NodeMeta = {
  prefix:     string;
  entityType: "actor" | "screen" | "component" | "service" | "endpoint";
  label:      string;
  sublabel:   string;
  icon:       string;
  color:      string;     // tailwind text color
  bgColor:    string;     // tailwind bg color
};

function resolveNode(nodeId: string, catalog: EntityCatalog): NodeMeta | null {
  const idx = nodeId.indexOf("::");
  if (idx < 0) return null;

  const prefix = nodeId.slice(0, idx);
  const rawId  = nodeId.slice(idx + 2);

  switch (prefix) {
    case "actor":
      return {
        prefix, entityType: "actor",
        label: rawId.replace(/_/g, " "), sublabel: "Actor del flujo",
        icon: "👤", color: "text-indigo-300", bgColor: "bg-indigo-500/10",
      };

    case "screen": {
      const s = catalog.screens.find((x) => x.id === rawId);
      return {
        prefix, entityType: "screen",
        label: s?.name ?? rawId, sublabel: s?.route ?? "",
        icon: "🖥", color: "text-blue-300", bgColor: "bg-blue-500/10",
      };
    }

    case "comp": {
      const c = catalog.components.find((x) => x.id === rawId);
      return {
        prefix, entityType: "component",
        label: c?.name ?? rawId, sublabel: c?.type ?? "",
        icon: "◻", color: "text-cyan-300", bgColor: "bg-cyan-500/10",
      };
    }

    case "service": {
      const s = catalog.services.find((x) => x.id === rawId);
      return {
        prefix, entityType: "service",
        label: s?.name ?? rawId,
        sublabel: s?.purpose ? (s.purpose.length > 50 ? s.purpose.slice(0, 50) + "…" : s.purpose) : "",
        icon: "⚙", color: "text-amber-300", bgColor: "bg-amber-500/10",
      };
    }

    case "ep": {
      const e = catalog.endpoints.find((x) => x.id === rawId);
      return {
        prefix, entityType: "endpoint",
        label: e?.path ?? rawId, sublabel: e?.method ?? "GET",
        icon: "🔗", color: "text-yellow-300", bgColor: "bg-yellow-500/10",
      };
    }

    default:
      return null;
  }
}

// ── Compute which steps reference this entity ────────────────────────────────
function stepsReferencing(
  entityType: string,
  rawId: string,
  steps: Step[],
): { step: Step; roles: string[] }[] {
  const result: { step: Step; roles: string[] }[] = [];

  for (const s of steps) {
    const roles: string[] = [];

    if (entityType === "actor") {
      if ((s.actor ?? "Usuario").replace(/[^a-zA-Z0-9_\-]/g, "_") === rawId) roles.push("actor");
    }
    if (entityType === "screen") {
      if (s.screen === rawId) roles.push("pantalla");
    }
    if (entityType === "component") {
      if (parseArr(s.components).includes(rawId)) roles.push("request");
      if (parseArr(s.responseComponents).includes(rawId)) roles.push("response");
    }
    if (entityType === "service") {
      if (parseArr(s.services).includes(rawId)) roles.push("servicio");
    }
    if (entityType === "endpoint") {
      if (parseArr(s.endpoints).includes(rawId)) roles.push("endpoint");
    }

    if (roles.length) result.push({ step: s, roles });
  }
  return result;
}

// ── Component context: which screens / services relate to this entity ────────
function computeContext(
  entityType: string,
  rawId: string,
  steps: Step[],
  catalog: EntityCatalog,
) {
  const screenIds  = new Set<string>();
  const serviceIds = new Set<string>();
  let isInput  = false;
  let isOutput = false;

  for (const s of steps) {
    if (entityType === "component") {
      if (parseArr(s.components).includes(rawId)) {
        isInput = true;
        if (s.screen) screenIds.add(s.screen);
        parseArr(s.services).forEach((id) => serviceIds.add(id));
      }
      if (parseArr(s.responseComponents).includes(rawId)) {
        isOutput = true;
        if (s.screen) screenIds.add(s.screen);
        parseArr(s.services).forEach((id) => serviceIds.add(id));
      }
    }
    if (entityType === "screen") {
      if (s.screen === rawId) {
        parseArr(s.components).forEach(() => { /* screens don't need this */ });
      }
    }
    if (entityType === "service") {
      if (parseArr(s.services).includes(rawId)) {
        if (s.screen) screenIds.add(s.screen);
      }
    }
    if (entityType === "endpoint") {
      if (parseArr(s.endpoints).includes(rawId)) {
        parseArr(s.services).forEach((id) => serviceIds.add(id));
      }
    }
  }

  return {
    screens:  [...screenIds].map((id) => catalog.screens.find((s) => s.id === id)?.name ?? id),
    services: [...serviceIds].map((id) => catalog.services.find((s) => s.id === id)?.name ?? id),
    isInput,
    isOutput,
  };
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function FlowNodeInfoPanel({ nodeId, steps, catalog, flowId, featureId, onRemoved }: Props) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  const meta = useMemo(() => resolveNode(nodeId, catalog), [nodeId, catalog]);
  const rawId = extractEntityId(nodeId);
  const stepBacked = isStepBacked(nodeId);

  const refs = useMemo(
    () => meta ? stepsReferencing(meta.entityType, rawId, steps) : [],
    [meta, rawId, steps],
  );

  const ctx = useMemo(
    () => meta ? computeContext(meta.entityType, rawId, steps, catalog) : null,
    [meta, rawId, steps, catalog],
  );

  if (!meta) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-gray-500">Nodo no reconocido</p>
        <p className="text-[10px] text-gray-600 mt-1 font-mono break-all">{nodeId}</p>
      </div>
    );
  }

  function handleRemoveFromFlow() {
    if (!meta) return;
    if (!confirm(`¿Eliminar "${meta.label}" de todos los pasos del flujo?`)) return;
    startTransition(async () => {
      await removeEntityFromFlow(flowId, featureId, meta.entityType, rawId);
      router.refresh();
      onRemoved?.();
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 space-y-4 flex-1 overflow-y-auto">

        {/* ── Header: entity type + name ── */}
        <div className={`rounded-lg p-3 ${meta.bgColor} border border-gray-800`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{meta.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${meta.color} truncate`}>{meta.label}</p>
              {meta.sublabel && (
                <p className="text-[10px] text-gray-500 truncate">{meta.sublabel}</p>
              )}
            </div>
          </div>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium uppercase tracking-wider">
              {meta.entityType}
            </span>
            {!stepBacked && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                Solo canvas
              </span>
            )}
          </div>
        </div>

        {/* ── Pasos que lo referencian ── */}
        <div className="space-y-1.5">
          <h4 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            Pasos ({refs.length})
          </h4>
          {refs.length === 0 ? (
            <p className="text-[10px] text-gray-600 italic">
              No está vinculado a ningún paso
            </p>
          ) : (
            <div className="space-y-1">
              {refs.map(({ step, roles }) => (
                <div key={step.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50 border border-gray-800">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-300 truncate">
                      <span className="text-gray-600 mr-1">#{step.order}</span>
                      {step.action}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {roles.map((r) => (
                      <span key={r}
                        className="text-[8px] px-1 py-0.5 rounded bg-gray-700 text-gray-400">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Contexto: pantallas, servicios, I/O ── */}
        {ctx && (meta.entityType === "component" || meta.entityType === "service" || meta.entityType === "endpoint") && (
          <div className="space-y-2">

            {/* I/O badges for components */}
            {meta.entityType === "component" && (ctx.isInput || ctx.isOutput) && (
              <div className="space-y-1">
                <h4 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  Rol en el flujo
                </h4>
                <div className="flex gap-1.5">
                  {ctx.isInput && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                      Input (request)
                    </span>
                  )}
                  {ctx.isOutput && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium">
                      Output (response)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Pantallas */}
            {ctx.screens.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  Pantallas ({ctx.screens.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ctx.screens.map((name) => (
                    <span key={name}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Servicios */}
            {ctx.services.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  Servicios ({ctx.services.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {ctx.services.map((name) => (
                    <span key={name}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Footer: remove from flow ── */}
      <div className="px-4 py-3 border-t border-gray-800 shrink-0">
        <button
          onClick={handleRemoveFromFlow}
          className="w-full text-xs text-red-400/70 hover:text-red-400 border border-dashed border-red-500/30 hover:border-red-500/60 rounded-lg py-2 transition-colors"
        >
          Eliminar del flujo
        </button>
      </div>
    </div>
  );
}
