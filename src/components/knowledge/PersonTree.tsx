"use client";

type OwnerEntry = { id: string; name: string; role: "pm" | "tech" };
type Person = {
  name:     string;
  modules:  OwnerEntry[];
  features: OwnerEntry[];
};

type Props = {
  people:     Person[];
  selectedName: string | null;
  onSelect:   (name: string) => void;
};

const COLORS = [
  "#6366f1","#3b82f6","#10b981","#f59e0b",
  "#ec4899","#8b5cf6","#14b8a6","#f97316",
];

function busFactorColor(total: number) {
  if (total <= 1) return "text-red-400";
  if (total <= 2) return "text-yellow-400";
  return "text-green-400";
}

export default function PersonTree({ people, selectedName, onSelect }: Props) {
  if (!people.length) {
    return (
      <div className="px-4 py-6 text-center text-xs text-gray-500">
        Sin personas registradas como owners.
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Stats rápidos */}
      <div className="px-3 py-2 border-b border-gray-800 mb-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/60 rounded px-2 py-1.5">
            <p className="text-[10px] text-gray-500">Personas</p>
            <p className="text-sm font-bold text-white">{people.length}</p>
          </div>
          <div className="bg-gray-800/60 rounded px-2 py-1.5">
            <p className="text-[10px] text-gray-500">Bus factor crítico</p>
            <p className={`text-sm font-bold ${busFactorColor(
              people.filter((p) => p.modules.length + p.features.length <= 1).length === 0 ? 3 : 1
            )}`}>
              {people.filter((p) => p.modules.length + p.features.length <= 1).length}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de personas */}
      {people.map((person, pi) => {
        const color    = COLORS[pi % COLORS.length];
        const total    = person.modules.length + person.features.length;
        const selected = selectedName === person.name;

        return (
          <div
            key={person.name}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(person.name)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(person.name)}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors
              hover:bg-gray-800/60 cursor-pointer
              ${selected ? "bg-blue-500/10 border-r-2 border-blue-500" : ""}`}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${color}22`, border: `1.5px solid ${color}`, color }}
            >
              {person.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{person.name}</p>
              <div className="flex gap-2 mt-0.5">
                <span className="text-[10px] text-indigo-400">{person.modules.length}m</span>
                <span className="text-[10px] text-blue-400">{person.features.length}f</span>
              </div>
            </div>

            {/* Bus factor indicator */}
            <div className="shrink-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: total <= 1 ? "#ef444422" : total <= 3 ? "#f59e0b22" : "#22c55e22",
                  color:      total <= 1 ? "#f87171"   : total <= 3 ? "#fbbf24"   : "#4ade80",
                  border:     `1px solid ${total <= 1 ? "#f8717133" : total <= 3 ? "#fbbf2433" : "#4ade8033"}`,
                }}
              >
                {total}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}