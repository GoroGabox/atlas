"use client";

import { useTransition } from "react";
import { createFlowStep } from "@/lib/actions/flows";
import { useRouter } from "next/navigation";

type Props = {
  flowId:    string;
  featureId: string;
  onCancel?: () => void;
};

const inputCls =
  "bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-1.5 " +
  "focus:outline-none focus:border-blue-500 w-full placeholder-gray-600";

export default function FlowStepForm({ flowId, featureId, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createFlowStep(flowId, featureId, formData);
      router.refresh();
      onCancel?.();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nuevo paso</p>

      {/* Actor — único campo requerido */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          👤 Actor <span className="text-red-400">*</span>
        </label>
        <input
          name="actor"
          required
          autoFocus
          placeholder="Ej: Supervisor, PM, Dev…"
          className={inputCls}
        />
      </div>

      {/* Acción — opcional, se puede editar después */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Descripción
          <span className="text-gray-700 ml-1">(opcional)</span>
        </label>
        <input
          name="action"
          placeholder="Ej: Selecciona filtros y aplica"
          className={inputCls}
        />
      </div>

      <p className="text-[10px] text-gray-700 leading-snug">
        El resto de nodos (pantalla, componentes, servicio, endpoint) se agregan
        directamente desde el swimlane o desde este panel una vez creado el paso.
      </p>

      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 px-4 py-1.5 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
        >
          {isPending ? "Creando..." : "Crear paso"}
        </button>
      </div>
    </form>
  );
}
