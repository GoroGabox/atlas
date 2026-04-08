"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFlowStepField, deleteFlowStep } from "@/lib/actions/flows";
import EntityPicker from "@/components/ui/EntityPicker";
import type { EntityCatalog } from "@/lib/types/entities";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Step = {
  id:                 string;
  order:              number;
  action:             string;
  actor:              string | null;
  screen:             string | null;   // ID de Screen (o null)
  components:         string | null;   // JSON: string[] de Component.id
  services:           string | null;   // JSON: string[] de Service.id
  endpoints:          string | null;   // JSON: string[] de Endpoint.id
  responseComponents: string | null;   // JSON: string[] de Component.id
};

type Props = {
  steps:          Step[];
  selectedStepId: string | null;
  onSelectStep:   (id: string | null) => void;
  featureId:      string;
  moduleId:       string;
  catalog:        EntityCatalog;
};

type EditTarget = {
  stepId: string;
  type:   "actor" | "screen" | "service" | "component" | "respComp" | "endpoint";
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseArr(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; }
  catch { return []; }
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const GRID_COLS = "2rem 1fr 1fr 1fr 1fr 1fr";

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-green-900/60  text-green-300  border-green-700/60",
  POST:   "bg-blue-900/60   text-blue-300   border-blue-700/60",
  PUT:    "bg-amber-900/60  text-amber-300  border-amber-700/60",
  PATCH:  "bg-yellow-900/60 text-yellow-300 border-yellow-700/60",
  DELETE: "bg-red-900/60    text-red-300    border-red-700/60",
};

type RowInfo = { step: Step; actionRow: number; flowRow: number; connectorRow: number };

function computeLayout(steps: Step[]): RowInfo[] {
  let row = 2;
  return steps.map((step, i) => {
    const actionRow    = row;
    const flowRow      = row + 1;
    const connectorRow = row + 2;
    row = i < steps.length - 1 ? row + 3 : row + 2;
    return { step, actionRow, flowRow, connectorRow };
  });
}

const INPUT_BASE =
  "w-full px-2 py-1.5 text-[11px] rounded-lg border bg-gray-900/90 " +
  "text-gray-200 focus:outline-none placeholder-gray-600";

const ADD_BTN =
  "w-full h-7 rounded-lg border border-dashed text-xs transition-colors " +
  "flex items-center justify-center";

const CHIP_WRAP = "group relative";
const CHIP_ACTIONS = "absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10";
const MINI_BTN =
  "w-4 h-4 bg-gray-900/90 rounded flex items-center justify-center " +
  "text-[9px] text-gray-400 transition-colors";

const DELETE_STEP_BTN =
  "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 " +
  "w-5 h-5 rounded flex items-center justify-center text-gray-600 " +
  "hover:text-red-400 hover:bg-red-400/10 transition-all text-xs";

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FlowSwimlane({
  steps, selectedStepId, onSelectStep, featureId, moduleId, catalog,
}: Props) {
  const [edit, setEdit]   = useState<EditTarget | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [pending, start]  = useTransition();
  const router = useRouter();

  const isEditing = (stepId: string, type: EditTarget["type"]) =>
    edit?.stepId === stepId && edit?.type === type;

  function startEdit(stepId: string, type: EditTarget["type"]) {
    setEdit({ stepId, type });
    setInputVal("");
  }

  function cancel() { setEdit(null); setInputVal(""); }

  function mutate(stepId: string, data: Parameters<typeof updateFlowStepField>[2]) {
    start(async () => {
      await updateFlowStepField(stepId, featureId, data);
      router.refresh();
    });
  }

  // ── Actor (texto libre — no es entidad del catálogo) ──────────────────────
  function saveActor(stepId: string) {
    const val = inputVal.trim();
    if (val) mutate(stepId, { actor: val });
    cancel();
  }
  function clearActor(stepId: string) { mutate(stepId, { actor: null }); }

  // ── Screen ────────────────────────────────────────────────────────────────
  function pickScreen(stepId: string, id: string) {
    mutate(stepId, { screen: id });
    cancel();
  }
  function clearScreen(stepId: string) { mutate(stepId, { screen: null }); }

  // ── Componentes request ───────────────────────────────────────────────────
  function pickComp(step: Step, id: string) {
    const arr = [...parseArr(step.components), id];
    mutate(step.id, { components: JSON.stringify(arr) });
    cancel();
  }
  function removeComp(step: Step, idx: number) {
    const arr = parseArr(step.components).filter((_, i) => i !== idx);
    mutate(step.id, { components: arr.length ? JSON.stringify(arr) : null });
  }

  // ── Componentes response ──────────────────────────────────────────────────
  function pickRespComp(step: Step, id: string) {
    const arr = [...parseArr(step.responseComponents), id];
    mutate(step.id, { responseComponents: JSON.stringify(arr) });
    cancel();
  }
  function removeRespComp(step: Step, idx: number) {
    const arr = parseArr(step.responseComponents).filter((_, i) => i !== idx);
    mutate(step.id, { responseComponents: arr.length ? JSON.stringify(arr) : null });
  }

  // ── Servicios ─────────────────────────────────────────────────────────────
  function pickService(step: Step, id: string) {
    const arr = [...parseArr(step.services), id];
    mutate(step.id, { services: JSON.stringify(arr) });
    cancel();
  }
  function removeService(step: Step, idx: number) {
    const arr = parseArr(step.services).filter((_, i) => i !== idx);
    mutate(step.id, { services: arr.length ? JSON.stringify(arr) : null });
  }

  // ── Endpoints ─────────────────────────────────────────────────────────────
  function pickEndpoint(step: Step, id: string) {
    const arr = [...parseArr(step.endpoints), id];
    mutate(step.id, { endpoints: JSON.stringify(arr) });
    cancel();
  }
  function removeEndpoint(step: Step, idx: number) {
    const arr = parseArr(step.endpoints).filter((_, i) => i !== idx);
    mutate(step.id, { endpoints: arr.length ? JSON.stringify(arr) : null });
  }

  // ── Delete paso ───────────────────────────────────────────────────────────
  function handleDeleteStep(stepId: string) {
    if (!confirm("¿Eliminar este paso?")) return;
    start(async () => {
      await deleteFlowStep(stepId, featureId);
      router.refresh();
    });
  }

  // ── Opciones de catálogo ──────────────────────────────────────────────────
  // Screens: primero las del mismo módulo, luego el resto
  const screenOptions = [
    ...catalog.screens
      .filter((s) => s.moduleId === moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: s.route ?? undefined })),
    ...catalog.screens
      .filter((s) => s.moduleId !== moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: `${s.moduleName}${s.route ? ` · ${s.route}` : ""}` })),
  ];

  // Services: primero los del mismo módulo, luego globales (sin moduleId)
  const serviceOptions = [
    ...catalog.services
      .filter((s) => s.moduleId === moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: "este módulo" })),
    ...catalog.services
      .filter((s) => s.moduleId !== moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: s.moduleId ? "otro módulo" : "global" })),
  ];

  const componentOptions = catalog.components.map((c) => ({
    id: c.id, label: c.name, sublabel: c.type,
  }));

  const endpointOptions = catalog.endpoints.map((e) => ({
    id: e.id, label: e.path, sublabel: e.method,
  }));

  // ── Resolvers ID → nombre ─────────────────────────────────────────────────
  function resolveScreen(id: string | null) {
    if (!id) return null;
    return catalog.screens.find((s) => s.id === id) ?? null;
  }
  function resolveComp(id: string) {
    return catalog.components.find((c) => c.id === id) ?? null;
  }
  function resolveService(id: string) {
    return catalog.services.find((s) => s.id === id) ?? null;
  }
  function resolveEndpoint(id: string) {
    return catalog.endpoints.find((e) => e.id === id) ?? null;
  }

  const layout = computeLayout(steps);

  return (
    <div className="w-full h-full overflow-auto">
      <div className="min-w-175 px-5 py-5">

        <div style={{ display: "grid", gridTemplateColumns: GRID_COLS, columnGap: "6px", rowGap: "3px" }}>

          {/* ══ HEADER ══ */}
          <div style={{ gridRow: 1, gridColumn: 1 }} />
          {(
            [
              { col: 2, icon: "👤", label: "Actor",        desc: "Quién inicia",    color: "text-indigo-400", bg: "bg-indigo-950/20" },
              { col: 3, icon: "🖥", label: "Pantalla",     desc: "Dónde ocurre",    color: "text-blue-400",   bg: "bg-blue-950/20"   },
              { col: 4, icon: "◻",  label: "Componentes",  desc: "UI req → res",    color: "text-cyan-400",   bg: "bg-cyan-950/20"   },
              { col: 5, icon: "⚙",  label: "Servicios",    desc: "Frontend service", color: "text-amber-400",  bg: "bg-amber-950/20"  },
              { col: 6, icon: "🔗", label: "Endpoints",    desc: "API calls",        color: "text-yellow-400", bg: "bg-yellow-950/20" },
            ] as const
          ).map((h) => (
            <div key={h.col} style={{ gridRow: 1, gridColumn: h.col }}
              className={`flex flex-col items-center gap-1 py-2 pb-3 rounded-lg ${h.bg}`}>
              <span className={`text-sm ${h.color}`}>{h.icon}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h.label}</span>
              <span className="text-[9px] text-gray-600">{h.desc}</span>
            </div>
          ))}

          {/* ══ PASOS ══ */}
          {layout.map(({ step, actionRow, flowRow, connectorRow }, stepIdx) => {
            const isSelected   = step.id === selectedStepId;
            const reqCompIds   = parseArr(step.components);
            const resCompIds   = parseArr(step.responseComponents);
            const serviceIds   = parseArr(step.services);
            const endpointIds  = parseArr(step.endpoints);
            const screenEntity = resolveScreen(step.screen);
            const screenLabel  = screenEntity?.name ?? null;

            return (
              <Fragment key={step.id}>

                {/* ── Número ── */}
                <div style={{ gridRow: actionRow, gridColumn: 1 }} className="flex justify-center items-center">
                  <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center
                    ${isSelected ? "bg-blue-500/20 text-blue-300" : "bg-gray-800 text-gray-600"}`}>
                    {step.order}
                  </span>
                </div>

                {/* ── Acción ── */}
                <div style={{ gridRow: actionRow, gridColumn: "2 / 7" }} className="relative group">
                  <button
                    onClick={() => onSelectStep(isSelected ? null : step.id)}
                    className={`w-full text-left px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold transition-all
                      ${isSelected
                        ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/40"
                        : "bg-gray-800/40 text-gray-300 hover:bg-gray-800/70"}`}
                  >
                    {step.action}
                  </button>
                  <button onClick={() => handleDeleteStep(step.id)} disabled={pending}
                    title="Eliminar paso" className={DELETE_STEP_BTN}>×</button>
                </div>

                {/* ── Actor (texto libre) ── */}
                <div style={{ gridRow: flowRow, gridColumn: 2 }} className="flex items-start">
                  {isEditing(step.id, "actor") ? (
                    <input autoFocus value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveActor(step.id); if (e.key === "Escape") cancel(); }}
                      onBlur={() => saveActor(step.id)}
                      placeholder="Ej: Supervisor"
                      className={`${INPUT_BASE} border-indigo-500/50`} />
                  ) : step.actor ? (
                    <div className={`${CHIP_WRAP} w-full`}>
                      <div className="w-full px-2 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/70 text-[11px] font-medium text-indigo-200 text-center truncate pr-6" title={step.actor}>
                        {step.actor}
                      </div>
                      <div className={CHIP_ACTIONS}>
                        <button onClick={() => { setEdit({ stepId: step.id, type: "actor" }); setInputVal(step.actor ?? ""); }} className={`${MINI_BTN} hover:text-white`} title="Editar">✎</button>
                        <button onClick={() => clearActor(step.id)} disabled={pending} className={`${MINI_BTN} hover:text-red-400`} title="Eliminar">×</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(step.id, "actor")}
                      className={`${ADD_BTN} border-indigo-500/20 text-indigo-700 hover:text-indigo-400 hover:border-indigo-500/40`}>+</button>
                  )}
                </div>

                {/* ── Pantalla (EntityPicker) ── */}
                <div style={{ gridRow: flowRow, gridColumn: 3 }} className="flex items-start">
                  {isEditing(step.id, "screen") ? (
                    <EntityPicker
                      options={screenOptions}
                      onSelect={(id) => pickScreen(step.id, id)}
                      onCancel={cancel}
                      placeholder="Buscar pantalla…"
                      inputCls="border-blue-500/50"
                      createHref="/entities/new?type=screen"
                    />
                  ) : screenLabel ? (
                    <div className={`${CHIP_WRAP} w-full h-full`}>
                      <div className="w-full px-2 py-1.5 rounded-lg border border-blue-500/40 bg-blue-950/70 pr-6" title={screenLabel}>
                        <div className="text-[11px] font-medium text-blue-200 truncate">{screenLabel}</div>
                        {screenEntity?.route && (
                          <div className="text-[9px] text-blue-400/60 truncate">{screenEntity.route}</div>
                        )}
                      </div>
                      <div className={CHIP_ACTIONS}>
                        <button onClick={() => startEdit(step.id, "screen")} className={`${MINI_BTN} hover:text-white`} title="Cambiar">✎</button>
                        <button onClick={() => clearScreen(step.id)} disabled={pending} className={`${MINI_BTN} hover:text-red-400`} title="Quitar">×</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(step.id, "screen")}
                      className={`${ADD_BTN} border-blue-500/20 text-blue-700 hover:text-blue-400 hover:border-blue-500/40`}>+</button>
                  )}
                </div>

                {/* ── Componentes (request + response, EntityPicker) ── */}
                <div style={{ gridRow: flowRow, gridColumn: 4 }} className="flex flex-col gap-1 min-w-0">
                  {reqCompIds.map((id, i) => {
                    const c = resolveComp(id);
                    return (
                      <div key={`req-${i}`} className="group flex items-center gap-1 min-w-0 rounded border border-cyan-500/30 bg-cyan-950/50">
                        <div className="flex-1 px-2 py-1 min-w-0" title={c?.name ?? id}>
                          <div className="text-[11px] text-cyan-200 truncate">{c?.name ?? id}</div>
                          {c?.type && <div className="text-[9px] text-cyan-400/60 truncate">{c.type}</div>}
                        </div>
                        <button onClick={() => removeComp(step, i)} disabled={pending}
                          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-gray-600 hover:text-red-400 text-xs shrink-0 transition-opacity">×</button>
                      </div>
                    );
                  })}
                  {resCompIds.map((id, i) => {
                    const c = resolveComp(id);
                    return (
                      <div key={`res-${i}`} className="group flex items-center gap-1 min-w-0 rounded border border-violet-500/30 bg-violet-950/50">
                        <div className="flex-1 px-2 py-1 min-w-0" title={c?.name ?? id}>
                          <div className="text-[11px] text-violet-200 truncate">↩ {c?.name ?? id}</div>
                          {c?.type && <div className="text-[9px] text-violet-400/60 truncate">{c.type}</div>}
                        </div>
                        <button onClick={() => removeRespComp(step, i)} disabled={pending}
                          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-gray-600 hover:text-red-400 text-xs shrink-0 transition-opacity">×</button>
                      </div>
                    );
                  })}
                  {isEditing(step.id, "component") ? (
                    <EntityPicker
                      options={componentOptions}
                      onSelect={(id) => pickComp(step, id)}
                      onCancel={cancel}
                      placeholder="Buscar componente…"
                      inputCls="border-cyan-500/50"
                      createHref="/entities/new?type=component"
                    />
                  ) : isEditing(step.id, "respComp") ? (
                    <EntityPicker
                      options={componentOptions}
                      onSelect={(id) => pickRespComp(step, id)}
                      onCancel={cancel}
                      placeholder="Componente de respuesta…"
                      inputCls="border-violet-500/50"
                      createHref="/entities/new?type=component"
                    />
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(step.id, "component")}
                        className="flex-1 h-6 rounded border border-dashed border-cyan-700/40 text-cyan-700 hover:text-cyan-400 hover:border-cyan-500/40 text-xs transition-colors"
                        title="Agregar componente request">+req</button>
                      <button onClick={() => startEdit(step.id, "respComp")}
                        className="flex-1 h-6 rounded border border-dashed border-violet-700/40 text-violet-700 hover:text-violet-400 hover:border-violet-500/40 text-xs transition-colors"
                        title="Agregar componente response">+res</button>
                    </div>
                  )}
                </div>

                {/* ── Servicios (EntityPicker) ── */}
                <div style={{ gridRow: flowRow, gridColumn: 5 }} className="flex flex-col gap-1 min-w-0">
                  {serviceIds.map((id, i) => {
                    const svc = resolveService(id);
                    return (
                      <div key={i} className="group flex items-center gap-1 min-w-0 rounded-lg border border-amber-500/40 bg-amber-950/70">
                        <div className="flex-1 px-2 py-1.5 min-w-0" title={svc?.name ?? id}>
                          <div className="text-[11px] font-medium text-amber-200 truncate">{svc?.name ?? id}</div>
                          {svc?.purpose && (
                            <div className="text-[9px] text-amber-400/60 truncate">
                              {svc.purpose.length > 30 ? svc.purpose.slice(0, 30) + "…" : svc.purpose}
                            </div>
                          )}
                        </div>
                        <button onClick={() => removeService(step, i)} disabled={pending}
                          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-gray-600 hover:text-red-400 text-xs shrink-0 transition-opacity">×</button>
                      </div>
                    );
                  })}
                  {isEditing(step.id, "service") ? (
                    <EntityPicker
                      options={serviceOptions}
                      onSelect={(id) => pickService(step, id)}
                      onCancel={cancel}
                      placeholder="Buscar servicio…"
                      inputCls="border-amber-500/50"
                      createHref="/entities/new?type=service"
                    />
                  ) : (
                    <button onClick={() => startEdit(step.id, "service")}
                      className={`${ADD_BTN} border-amber-500/20 text-amber-700 hover:text-amber-400 hover:border-amber-500/40`}>+</button>
                  )}
                </div>

                {/* ── Endpoints (EntityPicker) ── */}
                <div style={{ gridRow: flowRow, gridColumn: 6 }} className="flex flex-col gap-1 min-w-0">
                  {endpointIds.map((id, i) => {
                    const ep   = resolveEndpoint(id);
                    const mCls = ep ? (METHOD_CLS[ep.method] ?? "bg-gray-800 text-gray-400 border-gray-700") : "bg-gray-800 text-gray-500 border-gray-700";
                    let reqItems: string[] = [];
                    let resItems: string[] = [];
                    if (ep) {
                      try { reqItems = JSON.parse(ep.requestEntities ?? "[]") as string[]; } catch { reqItems = []; }
                      try { resItems = JSON.parse(ep.responseEntities ?? "[]") as string[]; } catch { resItems = []; }
                    }
                    return (
                      <div key={i} className="group relative rounded-lg border border-yellow-500/40 bg-yellow-950/60 overflow-hidden">
                        {/* Fila principal: método + path */}
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${mCls}`}>
                            {ep?.method ?? "?"}
                          </span>
                          <span className="text-[11px] font-mono text-yellow-200 truncate" title={ep?.path ?? id}>
                            {ep?.path ?? id}
                          </span>
                        </div>
                        {/* Payload → Response (visible si hay datos) */}
                        {(reqItems.length > 0 || resItems.length > 0) && (
                          <div className="px-2 pb-1.5 space-y-1">
                            {reqItems.length > 0 && (
                              <div className="flex items-start gap-1">
                                <span className="text-[9px] text-green-400 font-mono shrink-0 mt-0.5">↑ req</span>
                                <span className="text-[9px] text-gray-400 break-all leading-tight">{reqItems.join(", ")}</span>
                              </div>
                            )}
                            {resItems.length > 0 && (
                              <div className="flex items-start gap-1">
                                <span className="text-[9px] text-violet-400 font-mono shrink-0 mt-0.5">↓ res</span>
                                <span className="text-[9px] text-gray-400 break-all leading-tight">{resItems.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <button onClick={() => removeEndpoint(step, i)} disabled={pending}
                          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-gray-600 hover:text-red-400 text-xs transition-opacity">×</button>
                      </div>
                    );
                  })}
                  {isEditing(step.id, "endpoint") ? (
                    <EntityPicker
                      options={endpointOptions}
                      onSelect={(id) => pickEndpoint(step, id)}
                      onCancel={cancel}
                      placeholder="Buscar endpoint…"
                      inputCls="border-yellow-500/50"
                      createHref="/entities/new?type=endpoint"
                    />
                  ) : (
                    <button onClick={() => startEdit(step.id, "endpoint")}
                      className={`${ADD_BTN} border-yellow-500/20 text-yellow-700 hover:text-yellow-500 hover:border-yellow-500/40`}>+</button>
                  )}
                </div>

                {/* ── Conector ── */}
                {stepIdx < steps.length - 1 && (
                  <div style={{ gridRow: connectorRow, gridColumn: "1 / 7" }} className="flex justify-center items-center py-0.5">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-2 bg-gray-700" />
                      <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                        <path d="M3.5 5L0 0h7L3.5 5z" fill="#374151" />
                      </svg>
                    </div>
                  </div>
                )}

              </Fragment>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="mt-6 flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-gray-800" />
          <p className="text-[10px] text-gray-700 whitespace-nowrap">
            {steps.length} {steps.length === 1 ? "paso" : "pasos"} · hover sobre un nodo para editarlo o eliminarlo
          </p>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

      </div>
    </div>
  );
}
