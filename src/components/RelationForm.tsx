"use client";

import { useState, useTransition } from "react";
import { createRelation } from "@/lib/actions/relations";
import { FormField, Select, Input } from "@/components/ui/FormField";

const entityTypes = [
  { value: "module",    label: "Module"    },
  { value: "feature",   label: "Feature"   },
  { value: "screen",    label: "Screen"    },
  { value: "component", label: "Component" },
  { value: "service",   label: "Service"   },
  { value: "endpoint",  label: "Endpoint"  },
  { value: "person",    label: "Person"    },
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

type EntityOption = { id: string; name: string; type: string };

type Props = {
  entities: EntityOption[];
  onSuccess: () => void;
};

export default function RelationForm({ entities, onSuccess }: Props) {
  const [fromType, setFromType] = useState("module");
  const [toType,   setToType]   = useState("feature");
  const [isPending, startTransition] = useTransition();

  const filteredFrom = entities.filter((e) => e.type === fromType);
  const filteredTo   = entities.filter((e) => e.type === toType);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createRelation(formData);
      onSuccess();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Origen */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origen</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo" name="fromType">
            <select
              name="fromType"
              value={fromType}
              onChange={(e) => setFromType(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full"
            >
              {entityTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="ID / Nombre" name="fromId">
            {filteredFrom.length > 0 ? (
              <select
                name="fromId"
                className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full"
              >
                {filteredFrom.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            ) : (
              <Input name="fromId" placeholder="ID manual" />
            )}
          </FormField>
        </div>
      </div>

      {/* Tipo de relación */}
      <FormField label="Tipo de relación" name="relationType">
        <Select name="relationType" defaultValue="contains" options={relationTypes} />
      </FormField>

      {/* Destino */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Destino</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo" name="toType">
            <select
              name="toType"
              value={toType}
              onChange={(e) => setToType(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full"
            >
              {entityTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="ID / Nombre" name="toId">
            {filteredTo.length > 0 ? (
              <select
                name="toId"
                className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 w-full"
              >
                {filteredTo.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            ) : (
              <Input name="toId" placeholder="ID manual" />
            )}
          </FormField>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? "Guardando..." : "Crear relación"}
        </button>
      </div>
    </form>
  );
}