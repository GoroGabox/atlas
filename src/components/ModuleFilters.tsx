"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  domains: string[];
  owners: string[];
};

const levels = ["", "low", "medium", "high"];
const docStatuses = ["", "none", "partial", "complete"];

export default function ModuleFilters({ domains, owners }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/modules?${params.toString()}`);
    },
    [router, searchParams]
  );

  const current = (key: string) => searchParams.get(key) ?? "";

  const hasFilters = ["domain", "criticality", "riskLevel", "documentationStatus", "owner"].some(
    (k) => searchParams.get(k)
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Dominio */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Dominio</label>
          <select
            value={current("domain")}
            onChange={(e) => update("domain", e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Criticidad */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Criticidad</label>
          <select
            value={current("criticality")}
            onChange={(e) => update("criticality", e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {levels.map((l) => (
              <option key={l} value={l}>{l || "Todas"}</option>
            ))}
          </select>
        </div>

        {/* Riesgo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Riesgo</label>
          <select
            value={current("riskLevel")}
            onChange={(e) => update("riskLevel", e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {levels.map((l) => (
              <option key={l} value={l}>{l || "Todos"}</option>
            ))}
          </select>
        </div>

        {/* Documentación */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Documentación</label>
          <select
            value={current("documentationStatus")}
            onChange={(e) => update("documentationStatus", e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {docStatuses.map((s) => (
              <option key={s} value={s}>{s || "Todas"}</option>
            ))}
          </select>
        </div>

        {/* Owner */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Owner</label>
          <select
            value={current("owner")}
            onChange={(e) => update("owner", e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        {hasFilters && (
          <button
            onClick={() => router.push("/modules")}
            className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded px-3 py-1.5 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Indicadores activos */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-800">
          {["domain", "criticality", "riskLevel", "documentationStatus", "owner"].map((key) => {
            const val = searchParams.get(key);
            if (!val) return null;
            return (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full px-2.5 py-0.5"
              >
                {key}: {val}
                <button
                  onClick={() => update(key, "")}
                  className="text-blue-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}