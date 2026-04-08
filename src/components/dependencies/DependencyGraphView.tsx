"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ThreePanelLayout from "@/components/ThreePanelLayout";
import RelationTree from "@/components/dependencies/RelationTree";
import DependencyGraph from "@/components/DependencyGraph";
import DependencyDetailPanel from "@/components/dependencies/DependencyDetailPanel";
import { deleteRelation } from "@/lib/actions/relations";

type Relation = {
  id: string; fromType: string; fromId: string;
  relationType: string; toType: string; toId: string;
};
type RawModule  = { id: string; name: string; domain: string; riskLevel: string };
type RawFeature = { id: string; name: string; moduleId: string; riskLevel: string; technicalComplexity: string };
type EntityOption = { id: string; name: string; type: string };

type Props = {
  modules: RawModule[]; features: RawFeature[];
  relations: Relation[]; entities: EntityOption[];
  sharedServiceIds?: Set<string>;
};

const ALL_TYPES = ["contains","uses","calls","depends_on","owned_by","known_by","has_risk","has_debt"];

const typeColor: Record<string, string> = {
  contains:   "bg-indigo-400/10 text-indigo-400 border-indigo-400/20",
  uses:       "bg-blue-400/10 text-blue-400 border-blue-400/20",
  calls:      "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  depends_on: "bg-red-400/10 text-red-400 border-red-400/20",
  owned_by:   "bg-purple-400/10 text-purple-400 border-purple-400/20",
  known_by:   "bg-green-400/10 text-green-400 border-green-400/20",
  has_risk:   "bg-orange-400/10 text-orange-400 border-orange-400/20",
  has_debt:   "bg-pink-400/10 text-pink-400 border-pink-400/20",
};

export default function DependencyGraphView({ modules, features, relations, entities, sharedServiceIds }: Props) {
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const [selectedNode,       setSelectedNode]       = useState<{ id: string; label: string; type: string } | null>(null);
  const [activeTypes,        setActiveTypes]        = useState<Set<string>>(new Set(ALL_TYPES));
  const router = useRouter();

  const filteredRelations = relations.filter((r) => activeTypes.has(r.relationType));
  const selectedRelation  = relations.find((r) => r.id === selectedRelationId) ?? null;

  function toggleType(type: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta relación?")) return;
    await deleteRelation(id);
    router.refresh();
  }

  const handleNodeClick = useCallback((_: unknown, node: { id: string; data: { label: unknown } }) => {
    const parts = (node.id as string).split("-");
    const type  = parts[0];
    const rawId = parts.slice(1).join("-");
    const found = entities.find((e) => e.id === rawId);
    setSelectedNode(found
      ? { id: rawId, label: found.name, type }
      : { id: rawId, label: rawId, type }
    );
  }, [entities]);

  // Panel izquierdo con filtros + lista
  const leftPanel = (
    <div className="flex flex-col h-full">
      {/* Filtros por tipo */}
      <div className="px-3 py-2.5 border-b border-gray-800">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Filtrar por tipo</p>
        <div className="flex flex-wrap gap-1">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium transition-opacity
                ${typeColor[type]}
                ${activeTypes.has(type) ? "opacity-100" : "opacity-30"}`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">
          {filteredRelations.length} de {relations.length} relaciones
        </p>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        <RelationTree
          relations={filteredRelations}
          entities={entities}
          selectedId={selectedRelationId}
          onSelect={setSelectedRelationId}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );

  return (
    <ThreePanelLayout
      leftTitle="Relaciones"
      rightTitle="Detalle"
      left={leftPanel}
      center={
        <DependencyGraph
          modules={modules}
          features={features}
          relations={filteredRelations}
          onNodeClick={handleNodeClick}
          sharedServiceIds={sharedServiceIds}
          sharedServices={entities.filter((e) => e.type === "service" && sharedServiceIds?.has(e.id))}
        />
      }
      right={
        <DependencyDetailPanel
          selectedRelation={selectedRelation}
          selectedNode={selectedNode}
          entities={entities}
          onSuccess={() => setSelectedRelationId(null)}
        />
      }
    />
  );
}