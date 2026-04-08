"use client";

import { useState } from "react";

export type EntityOption = {
  id:        string;
  label:     string;
  sublabel?: string;
};

type Props = {
  options:     EntityOption[];
  onSelect:    (id: string) => void;
  onCancel:    () => void;
  placeholder?: string;
  inputCls?:    string;       // clases extra para el <input>
  createHref?:  string;       // link a crear nueva entidad si no hay resultados
};

/**
 * Combobox con filtro en tiempo real sobre un catálogo de entidades.
 * Uso:
 *   <EntityPicker options={catalog.screens.map(s => ({ id: s.id, label: s.name, sublabel: s.route }))}
 *                 onSelect={(id) => { save(id); }} onCancel={cancel} />
 *
 * Truco clave: onMouseDown en los items usa preventDefault() para que
 * el blur del input no dispare antes que el click.
 */
export default function EntityPicker({ options, onSelect, onCancel, placeholder = "Buscar…", inputCls = "", createHref }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div className="relative w-full">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { onCancel(); return; }
          if (e.key === "Enter" && filtered.length === 1) { onSelect(filtered[0].id); return; }
        }}
        onBlur={() => { if (filtered.length === 0 || query === "") onCancel(); }}
        placeholder={placeholder}
        className={`w-full px-2 py-1.5 text-[11px] rounded-lg border bg-gray-900/90 text-gray-200 focus:outline-none placeholder-gray-600 ${inputCls}`}
      />

      {/* Dropdown */}
      <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-44 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-[11px] text-gray-500">
            Sin coincidencias.{" "}
            {createHref && (
              <a href={createHref} target="_blank" rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 underline">
                Crear →
              </a>
            )}
          </li>
        ) : (
          filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                // preventDefault evita que el blur del input dispare antes del click
                onMouseDown={(e) => { e.preventDefault(); onSelect(opt.id); }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-800 transition-colors flex items-baseline gap-2"
              >
                <span className="text-[11px] text-gray-200 truncate">{opt.label}</span>
                {opt.sublabel && (
                  <span className="text-[10px] text-gray-500 font-mono truncate shrink-0">{opt.sublabel}</span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
