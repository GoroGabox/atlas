"use client";

import { useState } from "react";
import ThreePanelLayout from "@/components/ThreePanelLayout";
import FlowStepTree from "@/components/feature/FlowStepTree";
import FlowSwimlane from "@/components/FlowSwimlane";
import FlowVisualizerV2 from "@/components/FlowVisualizer";
import FeatureDetailPanel from "@/components/feature/FeatureDetailPanel";
import FlowNodeInfoPanel from "@/components/feature/FlowNodeInfoPanel";
import { createFlow } from "@/lib/actions/flows";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ExportButton from "@/components/ExportButton";
import type { EntityCatalog } from "@/lib/types/entities";

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

type Flow = { id: string; graphJson: string | null; steps: Step[] } | null;

type Feature = {
  id: string; name: string; businessGoal: string;
  riskLevel: string; documentationStatus: string;
  busFactor: number; pmOwner: string | null; techOwner: string | null;
  technicalComplexity: string; businessComplexity: string;
  moduleId: string; moduleName: string;
};

type Props = {
  feature: Feature;
  flow:    Flow;
  catalog: EntityCatalog;
};

type ViewMode = "mapa" | "tabla";

export default function FeatureGraphView({ feature, flow, catalog }: Props) {
  const [selectedStepId, setSelectedStepId]   = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId]   = useState<string | null>(null);
  const [addingStep, setAddingStep]           = useState(false);
  const [creating, setCreating]               = useState(false);
  const [viewMode, setViewMode]               = useState<ViewMode>("mapa");
  const router = useRouter();

  const steps        = flow?.steps ?? [];
  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

  // Mutual exclusion: selecting a step clears node selection and vice versa
  function handleSelectStep(id: string | null) {
    setSelectedStepId(id);
    setSelectedNodeId(null);
  }
  function handleNodeClick(nodeId: string) {
    if (!nodeId) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedNodeId(nodeId);
    setSelectedStepId(null);
  }

  async function handleCreateFlow() {
    setCreating(true);
    await createFlow(feature.id);
    router.refresh();
    setCreating(false);
  }

  // ── Toggle de vista ──────────────────────────────────────────────────────────
  const viewToggle = flow && steps.length > 0 ? (
    <div className="flex items-center gap-0.5 bg-gray-900 rounded-lg p-0.5 border border-gray-800">
      <button
        onClick={() => setViewMode("mapa")}
        title="Vista narrativa — para entender el flujo de un vistazo"
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          viewMode === "mapa"
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        Mapa
      </button>
      <button
        onClick={() => setViewMode("tabla")}
        title="Vista técnica — capas de actor, pantalla, servicio y endpoint"
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          viewMode === "tabla"
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        Tabla
      </button>
    </div>
  ) : null;

  // ── Centro: breadcrumb + vista activa ───────────────────────────────────────
  const center = (
    <div className="w-full h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/modules" className="hover:text-gray-300 transition-colors">
            Módulos
          </Link>
          <span>/</span>
          <Link href={`/modules/${feature.moduleId}`} className="hover:text-gray-300 transition-colors">
            {feature.moduleName}
          </Link>
          <span>/</span>
          <span className="text-gray-300">{feature.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {viewToggle}
          <ExportButton type="feature" id={feature.id} name={feature.name} />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0">
        {!flow ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-gray-500">Sin flujo documentado.</p>
            <button
              onClick={handleCreateFlow}
              disabled={creating}
              className="text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {creating ? "Creando..." : "+ Crear flujo"}
            </button>
          </div>
        ) : steps.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">
              Agrega el primer paso desde el panel derecho.
            </p>
          </div>
        ) : viewMode === "mapa" ? (
          <FlowVisualizerV2
            steps={steps}
            flowId={flow.id}
            featureId={feature.id}
            moduleId={feature.moduleId}
            graphJson={flow.graphJson}
            catalog={catalog}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        ) : (
          <FlowSwimlane
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={handleSelectStep}
            featureId={feature.id}
            moduleId={feature.moduleId}
            catalog={catalog}
          />
        )}
      </div>

    </div>
  );

  return (
    <ThreePanelLayout
      leftTitle="Flujo"
      rightTitle="Detalle"
      left={
        <FlowStepTree
          steps={steps}
          selectedId={selectedStepId}
          onSelect={handleSelectStep}
          catalog={catalog}
        />
      }
      center={center}
      right={
        selectedNodeId && flow ? (
          <FlowNodeInfoPanel
            nodeId={selectedNodeId}
            steps={steps}
            catalog={catalog}
            flowId={flow.id}
            featureId={feature.id}
            onRemoved={() => setSelectedNodeId(null)}
          />
        ) : (
          <FeatureDetailPanel
            feature={feature}
            flowId={flow?.id ?? null}
            selectedStep={selectedStep}
            onAddStep={() => setAddingStep(true)}
            addingStep={addingStep}
            setAddingStep={setAddingStep}
            catalog={catalog}
          />
        )
      }
    />
  );
}
