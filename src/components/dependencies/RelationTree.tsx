"use client";

const relationColors: Record<string, string> = {
  contains:   "text-indigo-400 bg-indigo-400/10",
  uses:       "text-blue-400 bg-blue-400/10",
  calls:      "text-yellow-400 bg-yellow-400/10",
  depends_on: "text-red-400 bg-red-400/10",
  owned_by:   "text-purple-400 bg-purple-400/10",
  known_by:   "text-green-400 bg-green-400/10",
  has_risk:   "text-orange-400 bg-orange-400/10",
  has_debt:   "text-pink-400 bg-pink-400/10",
};

type Relation = {
  id: string; fromType: string; fromId: string;
  relationType: string; toType: string; toId: string;
};

type EntityOption = { id: string; name: string; type: string };

type Props = {
  relations:  Relation[];
  entities:   EntityOption[];
  selectedId: string | null;
  onSelect:   (id: string) => void;
  onDelete:   (id: string) => void;
};

function label(entities: EntityOption[], type: string, id: string) {
  return entities.find((e) => e.id === id)?.name ?? id.slice(0, 8) + "…";
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export default function RelationTree({
  relations, entities, selectedId, onSelect, onDelete,
}: Props) {
  const grouped = groupBy(relations, (r) => r.relationType);

  if (!relations.length) {
    return (
      <div className="px-4 py-6 text-center text-xs text-gray-500">
        Sin relaciones registradas.
      </div>
    );
  }

  return (
    <div className="py-2">
      {Object.entries(grouped).map(([type, rels]) => (
        <div key={type}>
          {/* Grupo header */}
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${relationColors[type] ?? "text-gray-400 bg-gray-400/10"}`}>
              {type}
            </span>
            <span className="text-[10px] text-gray-600">{rels.length}</span>
          </div>

          {rels.map((rel) => (
            // ← div en vez de button para evitar button>button
            <div
              key={rel.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(rel.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(rel.id)}
              className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors
                hover:bg-gray-800/60 cursor-pointer group
                ${selectedId === rel.id ? "bg-blue-500/10 border-r-2 border-blue-500" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-300 leading-snug truncate">
                  <span className="text-gray-500">{rel.fromType}: </span>
                  {label(entities, rel.fromType, rel.fromId)}
                </p>
                <p className="text-[11px] text-gray-300 leading-snug truncate">
                  <span className="text-gray-500">{rel.toType}: </span>
                  {label(entities, rel.toType, rel.toId)}
                </p>
              </div>
              {/* Botón eliminar — ahora es hermano del div, no hijo de button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(rel.id); }}
                className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 p-0.5 rounded"
                aria-label="Eliminar relación"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}