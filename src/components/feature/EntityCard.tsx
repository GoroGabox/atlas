"use client";

/**
 * EntityCard — muestra info de una entidad del catálogo en el panel derecho,
 * con edición inline (sin navegar a /entities/[id]/edit).
 */

import { useState, useTransition } from "react";
import { patchScreen, patchComponent, patchService, patchEndpoint } from "@/lib/actions/entities";
import { useRouter } from "next/navigation";
import type {
  CatalogScreen, CatalogComponent, CatalogService, CatalogEndpoint,
} from "@/lib/types/entities";

export type EntityType = "screen" | "component" | "service" | "endpoint";

type Entity = CatalogScreen | CatalogComponent | CatalogService | CatalogEndpoint;

type Props = {
  entityType: EntityType;
  entity:     Entity | null;
  chipCls:    string;     // clases Tailwind para el borde/bg/color del chip
  onDelete:   () => void;
  notFound?:  boolean;
};

// ── Sublabel helper ────────────────────────────────────────────────────────────
function sublabelOf(type: EntityType, entity: Entity): string {
  switch (type) {
    case "screen":
      return (entity as CatalogScreen).route ?? "";
    case "component":
      return (entity as CatalogComponent).type ?? "";
    case "service": {
      const p = (entity as CatalogService).purpose ?? "";
      return p.length > 40 ? p.slice(0, 40) + "…" : p;
    }
    case "endpoint":
      return (entity as CatalogEndpoint).purpose ?? "";
    default:
      return "";
  }
}

function labelOf(type: EntityType, entity: Entity): string {
  if (type === "endpoint") return (entity as CatalogEndpoint).path;
  return (entity as { name: string }).name;
}

const METHOD_OPTS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const METHOD_CLS: Record<string, string> = {
  GET:    "bg-green-900/60 text-green-300 border-green-700/60",
  POST:   "bg-blue-900/60 text-blue-300 border-blue-700/60",
  PUT:    "bg-amber-900/60 text-amber-300 border-amber-700/60",
  PATCH:  "bg-yellow-900/60 text-yellow-300 border-yellow-700/60",
  DELETE: "bg-red-900/60 text-red-300 border-red-700/60",
};

const INPUT_CLS =
  "w-full bg-gray-800 border border-gray-700 text-[11px] text-gray-200 " +
  "rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 placeholder-gray-600";

// ── Inline editor per entity type ─────────────────────────────────────────────
function EditorFields({
  type, entity, onSave, onCancel,
}: {
  type:     EntityType;
  entity:   Entity;
  onSave:   (data: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>(() => {
    switch (type) {
      case "screen": {
        const s = entity as CatalogScreen;
        return { name: s.name, route: s.route ?? "" } as Record<string, string>;
      }
      case "component": {
        const c = entity as CatalogComponent;
        return { name: c.name, type: c.type ?? "", purpose: c.purpose ?? "" } as Record<string, string>;
      }
      case "service": {
        const s = entity as CatalogService;
        return { name: s.name, purpose: s.purpose ?? "" } as Record<string, string>;
      }
      case "endpoint": {
        const e = entity as CatalogEndpoint;
        return { path: e.path, method: e.method, purpose: e.purpose ?? "" } as Record<string, string>;
      }
    }
  });

  function set(key: string, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onCancel();
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSave(fields);
  }

  return (
    <div className="space-y-1.5 p-2 rounded-lg border border-gray-700 bg-gray-900/60" onKeyDown={handleKey}>
      {/* Fields per type */}
      {type === "screen" && (
        <>
          <input value={fields.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Nombre" className={INPUT_CLS} autoFocus />
          <input value={fields.route} onChange={(e) => set("route", e.target.value)}
            placeholder="Ruta (ej: /settings)" className={INPUT_CLS} />
        </>
      )}
      {type === "component" && (
        <>
          <input value={fields.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Nombre" className={INPUT_CLS} autoFocus />
          <input value={fields.type} onChange={(e) => set("type", e.target.value)}
            placeholder="Tipo (ej: Button, Table, Form)" className={INPUT_CLS} />
          <input value={fields.purpose} onChange={(e) => set("purpose", e.target.value)}
            placeholder="Propósito" className={INPUT_CLS} />
        </>
      )}
      {type === "service" && (
        <>
          <input value={fields.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Nombre" className={INPUT_CLS} autoFocus />
          <textarea value={fields.purpose} onChange={(e) => set("purpose", e.target.value)}
            placeholder="Propósito" rows={2}
            className={`${INPUT_CLS} resize-none`} />
        </>
      )}
      {type === "endpoint" && (
        <>
          <div className="flex gap-1.5">
            <select value={fields.method} onChange={(e) => set("method", e.target.value)}
              className={`${INPUT_CLS} w-24 shrink-0`}>
              {METHOD_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={fields.path} onChange={(e) => set("path", e.target.value)}
              placeholder="/path" className={`${INPUT_CLS} font-mono`} autoFocus />
          </div>
          <input value={fields.purpose} onChange={(e) => set("purpose", e.target.value)}
            placeholder="Propósito" className={INPUT_CLS} />
        </>
      )}

      <div className="flex gap-1.5 pt-0.5">
        <button
          onClick={() => onSave(fields)}
          className="flex-1 text-[10px] py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="text-[10px] px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
          Cancelar
        </button>
      </div>
      <p className="text-[9px] text-gray-600 text-center">⌘↵ para guardar · Esc para cancelar</p>
    </div>
  );
}

// ── EntityCard principal ──────────────────────────────────────────────────────
export default function EntityCard({ entityType, entity, chipCls, onDelete, notFound }: Props) {
  const [editing, setEditing]   = useState(false);
  const [pending, start]        = useTransition();
  const router = useRouter();

  // ── Entidad no encontrada en catálogo ────────────────────────────────────────
  if (!entity || notFound) {
    return (
      <div className="flex items-center justify-between gap-1 px-2 py-1 rounded border border-red-500/40 bg-red-950/40 text-[11px] text-red-400">
        <span className="truncate text-[10px]">⚠ Entidad no encontrada</span>
        <button onClick={onDelete} className="shrink-0 text-[9px] text-gray-500 hover:text-red-400">×</button>
      </div>
    );
  }

  const label    = labelOf(entityType, entity);
  const sublabel = sublabelOf(entityType, entity);

  // ── Guardar desde el editor ──────────────────────────────────────────────────
  function handleSave(data: Record<string, string>) {
    const id = entity!.id;
    start(async () => {
      switch (entityType) {
        case "screen":
          await patchScreen(id, { name: data.name, route: data.route || null });
          break;
        case "component":
          await patchComponent(id, { name: data.name, type: data.type, purpose: data.purpose });
          break;
        case "service":
          await patchService(id, { name: data.name, purpose: data.purpose });
          break;
        case "endpoint":
          await patchEndpoint(id, { path: data.path, method: data.method, purpose: data.purpose });
          break;
      }
      setEditing(false);
      router.refresh();
    });
  }

  // ── Modo edición ─────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <EditorFields
        type={entityType}
        entity={entity}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  // ── Modo display ─────────────────────────────────────────────────────────────
  if (entityType === "endpoint") {
    const ep = entity as CatalogEndpoint;
    const mCls = METHOD_CLS[ep.method] ?? "bg-gray-800 text-gray-400 border-gray-700";
    return (
      <div className={`group relative rounded-lg border p-2 border-yellow-500/40 bg-yellow-950/60`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${mCls}`}>
            {ep.method}
          </span>
          <span className="text-[11px] font-mono text-yellow-200 truncate flex-1" title={ep.path}>
            {ep.path}
          </span>
        </div>
        {sublabel && (
          <p className="text-[9px] text-gray-500 mt-0.5 truncate">{sublabel}</p>
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} disabled={pending}
            className="text-[9px] text-gray-500 hover:text-white" title="Editar">✎</button>
          <button onClick={onDelete} disabled={pending}
            className="text-[9px] text-gray-500 hover:text-red-400" title="Quitar">×</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start justify-between gap-1 px-2 py-1.5 rounded border text-[11px] ${chipCls}`}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10px] font-medium">{label}</div>
        {sublabel && (
          <div className="text-[9px] opacity-55 truncate mt-0.5">{sublabel}</div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} disabled={pending}
          className="text-[9px] text-gray-500 hover:text-white" title="Editar">✎</button>
        <button onClick={onDelete} disabled={pending}
          className="text-[9px] text-gray-500 hover:text-red-400" title="Quitar">×</button>
      </div>
    </div>
  );
}
