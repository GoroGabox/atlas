"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import RelationForm from "@/components/RelationForm";
import { deleteRelation } from "@/lib/actions/relations";
import { useRouter } from "next/navigation";

const relationColors: Record<string, string> = {
  contains:   "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  uses:       "text-blue-400 bg-blue-400/10 border-blue-400/20",
  calls:      "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  depends_on: "text-red-400 bg-red-400/10 border-red-400/20",
  owned_by:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  known_by:   "text-green-400 bg-green-400/10 border-green-400/20",
  has_risk:   "text-orange-400 bg-orange-400/10 border-orange-400/20",
  has_debt:   "text-pink-400 bg-pink-400/10 border-pink-400/20",
};

type Relation = {
  id: string;
  fromType: string;
  fromId: string;
  relationType: string;
  toType: string;
  toId: string;
};

type EntityOption = { id: string; name: string; type: string };

type Props = {
  relations: Relation[];
  entities: EntityOption[];
};

function entityLabel(entities: EntityOption[], type: string, id: string) {
  const found = entities.find((e) => e.id === id);
  return found ? found.name : id.slice(0, 8) + "…";
}

export default function RelationsPanel({ relations, entities }: Props) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta relación?")) return;
    await deleteRelation(id);
    router.refresh();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Relaciones ({relations.length})
          </h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          + Nueva relación
        </button>
      </div>

      {/* Lista */}
      {relations.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-500 text-sm">
          Sin relaciones registradas.
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {relations.map((rel) => (
            <div key={rel.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/40 transition-colors">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {/* Origen */}
                <span className="text-gray-400 text-xs">{rel.fromType}</span>
                <span className="text-white font-medium">
                  {entityLabel(entities, rel.fromType, rel.fromId)}
                </span>

                {/* Relación */}
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${relationColors[rel.relationType] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}>
                  {rel.relationType}
                </span>

                {/* Destino */}
                <span className="text-gray-400 text-xs">{rel.toType}</span>
                <span className="text-white font-medium">
                  {entityLabel(entities, rel.toType, rel.toId)}
                </span>
              </div>

              {/* Eliminar */}
              <button
                onClick={() => handleDelete(rel.id)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors ml-4 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title="Nueva relación" onClose={() => setShowModal(false)}>
          <RelationForm
            entities={entities}
            onSuccess={() => {
              setShowModal(false);
              router.refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}