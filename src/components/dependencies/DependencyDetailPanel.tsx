"use client";

import { useState, useTransition } from "react";
import { createRelation } from "@/lib/actions/relations";
import { FormField, Select } from "@/components/ui/FormField";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Relation = {
  id: string; fromType: string; fromId: string;
  relationType: string; toType: string; toId: string;
};

type EntityOption = { id: string; name: string; type: string };

type SelectedNode = {
  id: string; label: string; type: "module" | "feature" | string;
} | null;

type Props = {
  selectedRelation: Relation | null;
  selectedNode:     SelectedNode;
  entities:         EntityOption[];
  onSuccess:        () => void;
};

const entityTypes = [
  { value: "module",    label: "Module"    },
  { value: "feature",   label: "Feature"   },
  { value: "screen",    label: "Screen"    },
  { value: "component", label: "Component" },
  { value: "service",   label: "Service"   },
  { value: "endpoint",  label: "Endpoint"  },
];

const relationTypes = [
  { value: "contains",   label: "contains"   },
  { value: "uses",       label: "uses"       },
  { value: "calls",      label: "calls"      },
  { value: "depends_on", label: "depends_on" },
  { value: "owned_by",   label: "owned_by"   },
  { value: "known_by",   label: "known_by"   },
  { value: "has_risk",   label: "has_risk"   },
  { value: "has_debt",   label: "has_debt"   },
];

const nodeTypeColor: Record<string, string> = {
  module:  "text-indigo-400 bg-indigo-400/10",
  feature: "text-blue-400 bg-blue-400/10",
};

const relationColors: Record<string, string> = {
  contains:   "text-indigo-400", uses:     "text-blue-400",
  calls:      "text-yellow-400", depends_on: "text-red-400",
  owned_by:   "text-purple-400", known_by: "text-green-400",
  has_risk:   "text-orange-400", has_debt: "text-pink-400",
};

function entityLabel(entities: EntityOption[], type: string, id: string) {
  return entities.find((e) => e.id === id)?.name ?? id.slice(0, 8) + "…";
}

export default function DependencyDetailPanel({
  selectedRelation, selectedNode, entities, onSuccess,
}: Props) {
  const [fromType, setFromType] = useState("module");
  const [toType,   setToType]   = useState("feature");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredFrom = entities.filter((e) => e.type === fromType);
  const filteredTo   = entities.filter((e) => e.type === toType);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createRelation(formData);
      onSuccess();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col h-full">

      {/* Nodo seleccionado */}
      {selectedNode && (
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-[10px] text-gray-600 mb-1">Nodo seleccionado</p>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${nodeTypeColor[selectedNode.type] ?? "text-gray-400 bg-gray-400/10"}`}>
              {selectedNode.type}
            </span>
            <p className="text-xs font-semibold text-white truncate">{selectedNode.label}</p>
          </div>
          {/* Links de navegación según tipo */}
          <div className="flex flex-col gap-1">
            {selectedNode.type === "module" && (
              <Link
                href={`/modules/${selectedNode.id}`}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Ver módulo →
              </Link>
            )}
            {selectedNode.type === "feature" && (
              <>
                <Link
                  href={`/features/${selectedNode.id}`}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  Ver feature →
                </Link>
                <Link
                  href={`/features/${selectedNode.id}/edit`}
                  className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  Editar feature →
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Relación seleccionada */}
      {selectedRelation && (
        <div className="px-4 py-3 border-b border-gray-800 space-y-2">
          <p className="text-[10px] text-gray-600">Relación seleccionada</p>
          <div className="bg-gray-800/60 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-gray-300">
              <span className="text-gray-500">{selectedRelation.fromType}: </span>
              <span className="text-white font-medium">
                {entityLabel(entities, selectedRelation.fromType, selectedRelation.fromId)}
              </span>
            </p>
            <p className={`text-xs font-semibold ${relationColors[selectedRelation.relationType] ?? "text-gray-400"}`}>
              → {selectedRelation.relationType}
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-gray-500">{selectedRelation.toType}: </span>
              <span className="text-white font-medium">
                {entityLabel(entities, selectedRelation.toType, selectedRelation.toId)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Form nueva relación */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 mb-3">Nueva relación</p>
        <form action={handleSubmit} className="space-y-3">

          <div className="bg-gray-800/40 rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Origen</p>
            <FormField label="Tipo" name="fromType">
              <select
                name="fromType" value={fromType}
                onChange={(e) => setFromType(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-blue-500"
              >
                {entityTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Entidad" name="fromId">
              {filteredFrom.length > 0 ? (
                <select
                  name="fromId"
                  className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-blue-500"
                >
                  {filteredFrom.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              ) : (
                <input name="fromId" placeholder="ID manual"
                  className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-blue-500"
                />
              )}
            </FormField>
          </div>

          <FormField label="Tipo de relación" name="relationType">
            <Select name="relationType" defaultValue="contains" options={relationTypes} />
          </FormField>

          <div className="bg-gray-800/40 rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Destino</p>
            <FormField label="Tipo" name="toType">
              <select
                name="toType" value={toType}
                onChange={(e) => setToType(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-blue-500"
              >
                {entityTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Entidad" name="toId">
              {filteredTo.length > 0 ? (
                <select
                  name="toId"
                  className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-blue-500"
                >
                  {filteredTo.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              ) : (
                <input name="toId" placeholder="ID manual"
                  className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-blue-500"
                />
              )}
            </FormField>
          </div>

          <button
            type="submit" disabled={isPending}
            className="w-full text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2 rounded-lg transition-colors font-medium"
          >
            {isPending ? "Guardando..." : "+ Crear relación"}
          </button>
        </form>
      </div>
    </div>
  );
}