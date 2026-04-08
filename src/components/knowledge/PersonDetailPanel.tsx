"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeModuleOwner, removeFeatureOwner } from "@/lib/actions/knowledge";

type OwnerEntry = { id: string; name: string; role: "pm" | "tech" };

type Person = {
  name:     string;
  modules:  OwnerEntry[];
  features: OwnerEntry[];
};

type Props = { person: Person | null };

const COLORS = [
  "#6366f1","#3b82f6","#10b981","#f59e0b",
  "#ec4899","#8b5cf6","#14b8a6","#f97316",
];

function getColor(name: string) {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

const roleLabel: Record<"pm" | "tech", string> = { pm: "PM", tech: "Tech" };
const roleBadge: Record<"pm" | "tech", string> = {
  pm:   "text-purple-300 bg-purple-500/10 border-purple-500/20",
  tech: "text-cyan-300   bg-cyan-500/10   border-cyan-500/20",
};

export default function PersonDetailPanel({ person }: Props) {
  const router = useRouter();

  if (!person) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-gray-600 text-center px-4">
          Selecciona una persona del panel izquierdo
        </p>
      </div>
    );
  }

  const color = getColor(person.name);
  const total = person.modules.length + person.features.length;

  async function handleRemoveModule(entry: OwnerEntry) {
    if (!confirm(`¿Desasignar a ${person!.name} como ${roleLabel[entry.role]} Owner de "${entry.name}"?`)) return;
    await removeModuleOwner(entry.id, entry.role);
    router.refresh();
  }

  async function handleRemoveFeature(entry: OwnerEntry) {
    if (!confirm(`¿Desasignar a ${person!.name} como ${roleLabel[entry.role]} Owner de "${entry.name}"?`)) return;
    await removeFeatureOwner(entry.id, entry.role);
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header persona */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: `${color}22`, border: `2px solid ${color}`, color }}
          >
            {person.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{person.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {person.modules.length} módulo{person.modules.length !== 1 ? "s" : ""} ·{" "}
              {person.features.length} feature{person.features.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Bus factor badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Cobertura total</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: total <= 1 ? "#ef444422" : total <= 3 ? "#f59e0b22" : "#22c55e22",
              color:      total <= 1 ? "#f87171"   : total <= 3 ? "#fbbf24"   : "#4ade80",
            }}
          >
            {total} entidad{total !== 1 ? "es" : ""}
          </span>
          {total <= 1 && (
            <span className="text-[10px] text-red-400 font-medium">⚠ bus factor crítico</span>
          )}
        </div>
      </div>

      {/* Módulos */}
      <div className="flex-1 overflow-y-auto">
        {person.modules.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">
              Módulos ({person.modules.length})
            </p>
            <div className="space-y-1">
              {person.modules.map((entry, i) => (
                <div key={`${entry.id}-${entry.role}-${i}`} className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <Link
                    href={`/modules/${entry.id}`}
                    className="flex-1 text-xs text-gray-300 group-hover:text-white transition-colors truncate"
                  >
                    {entry.name}
                  </Link>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${roleBadge[entry.role]}`}>
                    {roleLabel[entry.role]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveModule(entry)}
                    className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded"
                    title="Desasignar"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {person.features.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">
              Features ({person.features.length})
            </p>
            <div className="space-y-1">
              {person.features.map((entry, i) => (
                <div key={`${entry.id}-${entry.role}-${i}`} className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <Link
                    href={`/features/${entry.id}`}
                    className="flex-1 text-xs text-gray-300 group-hover:text-white transition-colors truncate"
                  >
                    {entry.name}
                  </Link>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${roleBadge[entry.role]}`}>
                    {roleLabel[entry.role]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(entry)}
                    className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded"
                    title="Desasignar"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {person.modules.length === 0 && person.features.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-600">Sin entidades asignadas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
