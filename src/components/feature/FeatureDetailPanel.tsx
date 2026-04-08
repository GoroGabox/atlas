"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import FlowStepForm from "@/components/FlowStepForm";
import { deleteFlowStep, updateFlowStepField } from "@/lib/actions/flows";
import { useRouter } from "next/navigation";
import EntityPicker from "@/components/ui/EntityPicker";
import EntityCard from "@/components/feature/EntityCard";
import type { EntityCatalog } from "@/lib/types/entities";

// ─── Tipos ────────────────────────────────────────────────────────────────────
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

type Feature = {
  id: string; name: string; businessGoal: string;
  riskLevel: string; documentationStatus: string;
  busFactor: number; pmOwner: string | null; techOwner: string | null;
  technicalComplexity: string; businessComplexity: string;
  moduleId: string;
};

type Props = {
  feature:       Feature;
  flowId:        string | null;
  selectedStep:  Step | null;
  onAddStep:     () => void;
  addingStep:    boolean;
  setAddingStep: (v: boolean) => void;
  catalog:       EntityCatalog;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseArr(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; }
  catch { return []; }
}

const RISK_COLOR: Record<string, string> = {
  low:    "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high:   "text-red-400 bg-red-400/10",
};

const INPUT_CLS =
  "w-full bg-gray-800 border border-gray-700 text-[11px] text-gray-200 " +
  "rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 placeholder-gray-600";

// ─── Sub-componentes ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 pb-1 border-b border-gray-800">
      <span className={`text-xs ${color}`}>{icon}</span>
      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function ActionInline({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  function save() {
    const t = val.trim();
    if (t && t !== value) onSave(t);
    setEditing(false);
  }

  if (editing) {
    return (
      <input autoFocus value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        onBlur={save}
        className={INPUT_CLS} />
    );
  }
  return (
    <button onClick={() => { setVal(value); setEditing(true); }}
      className="w-full text-left px-2 py-1.5 rounded-lg bg-gray-800/40 hover:bg-gray-800/70 text-xs text-gray-200 transition-colors">
      {value}
    </button>
  );
}

function ActorNode({ value, onSave, onDelete }: {
  value:    string | null;
  onSave:   (v: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value ?? "");

  function save() {
    const t = val.trim();
    if (t) onSave(t);
    setEditing(false);
  }

  if (editing) {
    return (
      <input autoFocus value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        onBlur={save}
        placeholder="Ej: Supervisor"
        className={`${INPUT_CLS} border-indigo-500/50`} />
    );
  }
  if (value) {
    return (
      <div className="group flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/70 text-indigo-200 text-[11px]">
        <span className="truncate">{value}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
          <button onClick={() => { setVal(value); setEditing(true); }} className="text-[9px] text-gray-500 hover:text-white">✎</button>
          <button onClick={onDelete} className="text-[9px] text-gray-500 hover:text-red-400">×</button>
        </div>
      </div>
    );
  }
  return (
    <button onClick={() => { setVal(""); setEditing(true); }}
      className="w-full text-[10px] text-gray-600 hover:text-gray-400 border border-dashed border-gray-800 hover:border-gray-600 rounded-lg py-1 transition-colors">
      + Agregar
    </button>
  );
}

// ─── Panel principal ───────────────────────────────────────────────────────────
export default function FeatureDetailPanel({
  feature, flowId, selectedStep, addingStep, setAddingStep, catalog,
}: Props) {
  const [, start] = useTransition();
  const router = useRouter();

  const [pickingScreen,   setPickingScreen]   = useState(false);
  const [pickingComp,     setPickingComp]     = useState(false);
  const [pickingRespComp, setPickingRespComp] = useState(false);
  const [pickingSvc,      setPickingSvc]      = useState(false);
  const [pickingEp,       setPickingEp]       = useState(false);

  function mutate(data: Parameters<typeof updateFlowStepField>[2]) {
    if (!selectedStep) return;
    start(async () => {
      await updateFlowStepField(selectedStep.id, feature.id, data);
      router.refresh();
    });
  }

  async function handleDeleteStep() {
    if (!selectedStep) return;
    if (!confirm("¿Eliminar este paso?")) return;
    await deleteFlowStep(selectedStep.id, feature.id);
    router.refresh();
  }

  // ── Catalog options ────────────────────────────────────────────────────────
  const screenOptions = [
    ...catalog.screens
      .filter((s) => s.moduleId === feature.moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: s.route ?? undefined })),
    ...catalog.screens
      .filter((s) => s.moduleId !== feature.moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: s.moduleName })),
  ];
  const serviceOptions = [
    ...catalog.services
      .filter((s) => s.moduleId === feature.moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: "este módulo" })),
    ...catalog.services
      .filter((s) => s.moduleId !== feature.moduleId)
      .map((s) => ({ id: s.id, label: s.name, sublabel: s.moduleId ? "otro módulo" : "global" })),
  ];
  const componentOptions = catalog.components.map((c) => ({ id: c.id, label: c.name, sublabel: c.type }));
  const endpointOptions  = catalog.endpoints.map((e) => ({ id: e.id, label: e.path, sublabel: e.method }));

  // ── Resolvers ──────────────────────────────────────────────────────────────
  const resolveScreen    = (id: string | null) => catalog.screens.find((s) => s.id === id) ?? null;
  const resolveComp      = (id: string) => catalog.components.find((c) => c.id === id) ?? null;
  const resolveService   = (id: string) => catalog.services.find((s) => s.id === id) ?? null;
  const resolveEndpoint  = (id: string) => catalog.endpoints.find((e) => e.id === id) ?? null;

  // ── Array mutations ────────────────────────────────────────────────────────
  function pickScreen(id: string) { mutate({ screen: id }); setPickingScreen(false); }

  function pickComp(id: string) {
    const arr = [...parseArr(selectedStep?.components ?? null), id];
    mutate({ components: JSON.stringify(arr) }); setPickingComp(false);
  }
  function pickRespComp(id: string) {
    const arr = [...parseArr(selectedStep?.responseComponents ?? null), id];
    mutate({ responseComponents: JSON.stringify(arr) }); setPickingRespComp(false);
  }
  function removeComp(idx: number, field: "components" | "responseComponents") {
    if (!selectedStep) return;
    const arr = parseArr(selectedStep[field]).filter((_, i) => i !== idx);
    mutate({ [field]: arr.length ? JSON.stringify(arr) : null });
  }

  function pickService(id: string) {
    const arr = [...parseArr(selectedStep?.services ?? null), id];
    mutate({ services: JSON.stringify(arr) }); setPickingSvc(false);
  }
  function removeService(idx: number) {
    if (!selectedStep) return;
    const arr = parseArr(selectedStep.services).filter((_, i) => i !== idx);
    mutate({ services: arr.length ? JSON.stringify(arr) : null });
  }

  function pickEndpoint(id: string) {
    const arr = [...parseArr(selectedStep?.endpoints ?? null), id];
    mutate({ endpoints: JSON.stringify(arr) }); setPickingEp(false);
  }
  function removeEndpoint(idx: number) {
    if (!selectedStep) return;
    const arr = parseArr(selectedStep.endpoints).filter((_, i) => i !== idx);
    mutate({ endpoints: arr.length ? JSON.stringify(arr) : null });
  }

  const s = selectedStep;

  return (
    <div className="flex flex-col h-full">

      {/* ── Feature info ── */}
      <div className="px-4 py-3 border-b border-gray-800 space-y-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xs font-semibold text-white leading-snug">{feature.name}</h2>
          <Link href={`/features/${feature.id}/edit`}
            className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0">
            Editar
          </Link>
        </div>
        <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{feature.businessGoal}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${RISK_COLOR[feature.riskLevel]}`}>
            {feature.riskLevel}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">
            bus: {feature.busFactor}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">
            doc: {feature.documentationStatus}
          </span>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {addingStep && flowId ? (
          <FlowStepForm flowId={flowId} featureId={feature.id}
            onCancel={() => setAddingStep(false)} />

        ) : s ? (
          <div className="space-y-4">

            {/* Header del paso */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Paso #{s.order}
              </span>
              <button onClick={handleDeleteStep}
                className="text-[10px] text-red-500/60 hover:text-red-400 transition-colors">
                Eliminar paso
              </button>
            </div>

            {/* ── Acción ── */}
            <div className="space-y-1.5">
              <SectionHeader icon="▸" label="Acción" color="text-gray-500" />
              <ActionInline value={s.action} onSave={(v) => mutate({ action: v })} />
            </div>

            {/* ── Actor ── */}
            <div className="space-y-1.5">
              <SectionHeader icon="👤" label="Actor" color="text-indigo-400" />
              <ActorNode
                value={s.actor}
                onSave={(v) => mutate({ actor: v })}
                onDelete={() => mutate({ actor: null })}
              />
            </div>

            {/* ── Pantalla ── */}
            <div className="space-y-1.5">
              <SectionHeader icon="🖥" label="Pantalla" color="text-blue-400" />
              {pickingScreen ? (
                <EntityPicker options={screenOptions} onSelect={pickScreen}
                  onCancel={() => setPickingScreen(false)}
                  placeholder="Buscar pantalla…" inputCls="border-blue-500/50"
                  createHref="/entities/new?type=screen" />
              ) : s.screen ? (
                <EntityCard
                  entityType="screen"
                  entity={resolveScreen(s.screen)}
                  chipCls="border-blue-500/40 bg-blue-950/70 text-blue-200"
                  notFound={!resolveScreen(s.screen)}
                  onDelete={() => mutate({ screen: null })}
                />
              ) : (
                <button onClick={() => setPickingScreen(true)}
                  className="w-full text-[10px] text-gray-600 hover:text-gray-400 border border-dashed border-gray-800 hover:border-gray-600 rounded-lg py-1 transition-colors">
                  + Agregar pantalla
                </button>
              )}
            </div>

            {/* ── Componentes ── */}
            <div className="space-y-1.5">
              <SectionHeader icon="◻" label="Componentes" color="text-cyan-400" />

              {parseArr(s.components).map((id, i) => (
                <EntityCard key={`req-${i}`}
                  entityType="component"
                  entity={resolveComp(id)}
                  chipCls="border-cyan-500/30 bg-cyan-950/50 text-cyan-200"
                  notFound={!resolveComp(id)}
                  onDelete={() => removeComp(i, "components")} />
              ))}

              {parseArr(s.responseComponents).map((id, i) => {
                const comp = resolveComp(id);
                return (
                  <div key={`res-${i}`} className="relative">
                    <span className="absolute -left-1 top-1.5 text-[8px] text-violet-500 font-bold z-10">↩</span>
                    <div className="pl-2">
                      <EntityCard
                        entityType="component"
                        entity={comp}
                        chipCls="border-violet-500/30 bg-violet-950/50 text-violet-200"
                        notFound={!comp}
                        onDelete={() => removeComp(i, "responseComponents")} />
                    </div>
                  </div>
                );
              })}

              {pickingComp ? (
                <EntityPicker options={componentOptions} onSelect={pickComp}
                  onCancel={() => setPickingComp(false)}
                  placeholder="Componente request…" inputCls="border-cyan-500/50"
                  createHref="/entities/new?type=component" />
              ) : pickingRespComp ? (
                <EntityPicker options={componentOptions} onSelect={pickRespComp}
                  onCancel={() => setPickingRespComp(false)}
                  placeholder="Componente response…" inputCls="border-violet-500/50"
                  createHref="/entities/new?type=component" />
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => setPickingComp(true)}
                    className="flex-1 text-[10px] text-cyan-700 hover:text-cyan-400 border border-dashed border-cyan-800/40 hover:border-cyan-500/40 rounded-lg py-1 transition-colors">
                    + req
                  </button>
                  <button onClick={() => setPickingRespComp(true)}
                    className="flex-1 text-[10px] text-violet-700 hover:text-violet-400 border border-dashed border-violet-800/40 hover:border-violet-500/40 rounded-lg py-1 transition-colors">
                    + res
                  </button>
                </div>
              )}
            </div>

            {/* ── Servicios ── */}
            <div className="space-y-1.5">
              <SectionHeader icon="⚙" label="Servicios" color="text-amber-400" />

              {parseArr(s.services).map((id, i) => (
                <EntityCard key={i}
                  entityType="service"
                  entity={resolveService(id)}
                  chipCls="border-amber-500/40 bg-amber-950/70 text-amber-200"
                  notFound={!resolveService(id)}
                  onDelete={() => removeService(i)} />
              ))}

              {pickingSvc ? (
                <EntityPicker options={serviceOptions} onSelect={pickService}
                  onCancel={() => setPickingSvc(false)}
                  placeholder="Buscar servicio…" inputCls="border-amber-500/50"
                  createHref="/entities/new?type=service" />
              ) : (
                <button onClick={() => setPickingSvc(true)}
                  className="w-full text-[10px] text-gray-600 hover:text-gray-400 border border-dashed border-gray-800 hover:border-gray-600 rounded-lg py-1 transition-colors">
                  + Agregar servicio
                </button>
              )}
            </div>

            {/* ── Endpoints ── */}
            <div className="space-y-1.5">
              <SectionHeader icon="🔗" label="Endpoints" color="text-yellow-400" />

              {parseArr(s.endpoints).map((id, i) => (
                <EntityCard key={i}
                  entityType="endpoint"
                  entity={resolveEndpoint(id)}
                  chipCls=""
                  notFound={!resolveEndpoint(id)}
                  onDelete={() => removeEndpoint(i)} />
              ))}

              {pickingEp ? (
                <EntityPicker options={endpointOptions} onSelect={pickEndpoint}
                  onCancel={() => setPickingEp(false)}
                  placeholder="Buscar endpoint…" inputCls="border-yellow-500/50"
                  createHref="/entities/new?type=endpoint" />
              ) : (
                <button onClick={() => setPickingEp(true)}
                  className="w-full text-[10px] text-gray-600 hover:text-gray-400 border border-dashed border-gray-800 hover:border-gray-600 rounded-lg py-1 transition-colors">
                  + Agregar endpoint
                </button>
              )}
            </div>

          </div>
        ) : (
          <p className="text-xs text-gray-600 text-center py-6">
            Selecciona un paso para ver y editar sus nodos.
          </p>
        )}
      </div>

      {/* ── Footer ── */}
      {flowId && !addingStep && (
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <button onClick={() => setAddingStep(true)}
            className="w-full text-xs text-blue-400 hover:text-blue-300 border border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-lg py-2 transition-colors">
            + Agregar paso
          </button>
        </div>
      )}
    </div>
  );
}
