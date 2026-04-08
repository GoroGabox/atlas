"use client";

import type { EntityCatalog } from "@/lib/types/entities";

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

type Props = {
  steps:      Step[];
  selectedId: string | null;
  onSelect:   (id: string) => void;
  catalog?:   EntityCatalog;
};

function parseIds(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; }
  catch { return []; }
}

export default function FlowStepTree({ steps, selectedId, onSelect, catalog }: Props) {
  if (!steps.length) {
    return (
      <div className="px-4 py-6 text-center text-xs text-gray-500">
        Sin pasos documentados.
      </div>
    );
  }

  return (
    <div className="py-2">
      {steps.map((step, i) => (
        <div key={step.id}>
          <button
            onClick={() => onSelect(step.id)}
            className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-gray-800/60
              ${selectedId === step.id ? "bg-blue-500/10 border-r-2 border-blue-500" : ""}`}
          >
            {/* Número */}
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                ${selectedId === step.id
                  ? "bg-blue-500/30 text-blue-300"
                  : "bg-gray-800 text-gray-500"}`}
            >
              {step.order}
            </span>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-200 leading-snug line-clamp-2">{step.action}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {step.actor && <span className="text-[10px]" title="Actor">👤</span>}
                {step.screen && <span className="text-[10px]" title="Pantalla">🖥</span>}
                {step.services && <span className="text-[10px]" title="Servicios">⚙</span>}
                {step.endpoints && (() => {
                  const ids = parseIds(step.endpoints);
                  if (!ids.length) return null;
                  const first = catalog?.endpoints.find((e) => e.id === ids[0]);
                  const label = first
                    ? `${first.method} ${first.path}`
                    : ids[0].slice(0, 8) + "…";
                  return (
                    <span className="text-[9px] font-mono text-yellow-500/70" title={label}>
                      {label}
                      {ids.length > 1 && ` +${ids.length - 1}`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </button>

          {/* Conector visual */}
          {i < steps.length - 1 && (
            <div className="w-px h-3 bg-gray-800 ml-[1.375rem]" />
          )}
        </div>
      ))}
    </div>
  );
}
