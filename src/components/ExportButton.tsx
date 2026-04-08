"use client";

import { useState } from "react";

type Props = {
  type: "module" | "feature";
  id:   string;
  name: string;
};

export default function ExportButton({ type, id, name }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export?type=${type}&id=${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Error ${res.status}` })) as { error?: string };
        alert(`No se pudo exportar: ${err.error ?? res.statusText}`);
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error de red al exportar. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1v8M3.5 6l3 3 3-3M1 10v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {loading ? "Exportando..." : "Exportar MD"}
    </button>
  );
}