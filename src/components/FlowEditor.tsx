"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFlowStep, reorderFlowSteps, createFlow, deleteFlow } from "@/lib/actions/flows";

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

type Flow = { id: string; steps: Step[] };

type Props = { flow: Flow | null; featureId: string };

export default function FlowEditor({ flow, featureId }: Props) {
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [addingStep, setAddingStep]   = useState(false);
  const [dragging, setDragging]       = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const router = useRouter();

  function handleDelete(stepId: string) {
    if (!confirm("¿Eliminar este paso?")) return;
    startTransition(async () => {
      await deleteFlowStep(stepId, featureId);
      router.refresh();
    });
  }

  function handleDeleteFlow() {
    if (!flow) return;
    if (!confirm("¿Eliminar el flujo completo y todos sus pasos?")) return;
    startTransition(async () => {
      await deleteFlow(flow.id, featureId);
      router.refresh();
    });
  }

  function handleCreateFlow() {
    startTransition(async () => {
      await createFlow(featureId);
      router.refresh();
    });
  }

  // Drag & drop para reordenar
  function onDragStart(stepId: string) { setDragging(stepId); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }

  function onDrop(targetId: string) {
    if (!flow || !dragging || dragging === targetId) return;
    const ids = flow.steps.map((s) => s.id);
    const fromIdx = ids.indexOf(dragging);
    const toIdx   = ids.indexOf(targetId);
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragging);
    setDragging(null);
    startTransition(async () => {
      await reorderFlowSteps(flow.id, featureId, reordered);
      router.refresh();
    });
  }

  // Sin flujo creado aún
  if (!flow) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-gray-500">Sin flujo documentado aún.</p>
        <button
          onClick={handleCreateFlow}
          disabled={isPending}
          className="text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {isPending ? "Creando..." : "+ Crear flujo"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pasos */}
      {flow.steps.map((step, i) => (
        <div key={step.id}>
          {editingId === step.id ? (
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-400">Editar paso #{step.order} — usa el panel de detalle en la vista de flujo.</p>
              <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-300">Cerrar</button>
            </div>
          ) : (
            <div
              draggable
              onDragStart={() => onDragStart(step.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(step.id)}
              className={`flex gap-3 items-start group cursor-grab active:cursor-grabbing
                ${dragging === step.id ? "opacity-40" : "opacity-100"} transition-opacity`}
            >
              {/* Número + línea */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">
                  {step.order}
                </div>
                {i < flow.steps.length - 1 && (
                  <div className="w-px h-5 bg-gray-700 mt-1" />
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-200">{step.action}</p>
                  {/* Acciones — visibles en hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingId(step.id)}
                      className="text-xs text-gray-400 hover:text-blue-400 px-2 py-0.5 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(step.id)}
                      className="text-xs text-gray-400 hover:text-red-400 px-2 py-0.5 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {step.actor    && <span className="text-xs text-purple-400">👤 {step.actor}</span>}
                  {step.screen   && <span className="text-xs text-blue-400">🖥 {step.screen}</span>}
                  {step.services && <span className="text-xs text-yellow-400">⚙️ {(() => { try { return (JSON.parse(step.services) as string[]).join(", "); } catch { return ""; } })()}</span>}
                  {step.endpoints && (() => { try { const ep = (JSON.parse(step.endpoints) as {method:string;path:string}[])[0]; return ep ? <span className="text-xs text-yellow-300 font-mono">{ep.method} {ep.path}</span> : null; } catch { return null; } })()}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Agregar paso */}
      {addingStep ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
          Usa el panel de detalle en la vista de flujo para agregar pasos.
          <button onClick={() => setAddingStep(false)} className="ml-2 text-gray-500 hover:text-gray-300">Cerrar</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingStep(true)}
          className="w-full text-sm text-gray-500 hover:text-blue-400 border border-dashed border-gray-700 hover:border-blue-500/50 rounded-lg py-2.5 transition-colors"
        >
          + Agregar paso
        </button>
      )}

      {/* Footer — eliminar flujo */}
      <div className="flex justify-end pt-2 border-t border-gray-800">
        <button
          onClick={handleDeleteFlow}
          disabled={isPending}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Eliminar flujo completo
        </button>
      </div>
    </div>
  );
}