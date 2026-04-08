"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: string; type: string; label: string; sublabel: string; href: string;
};

const typeIcon: Record<string, string> = {
  module:   "📦",
  feature:  "⚡",
  screen:   "🖥",
  service:  "⚙️",
  endpoint: "🔗",
  person:   "👤",
};

const typeColor: Record<string, string> = {
  module:   "text-indigo-400 bg-indigo-400/10",
  feature:  "text-blue-400 bg-blue-400/10",
  screen:   "text-cyan-400 bg-cyan-400/10",
  service:  "text-yellow-400 bg-yellow-400/10",
  endpoint: "text-green-400 bg-green-400/10",
};

function highlight(text: string, q: string) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-500/30 text-blue-200 rounded-sm">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function CommandPalette() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor,  setCursor]  = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const router    = useRouter();

  // Abrir con Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setCursor(0);
    }
  }, [open]);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setCursor(0);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  // Navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      router.push(results[cursor].href);
      setOpen(false);
    }
  }, [results, cursor, router]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-500 shrink-0">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar módulos, features, screens, servicios..."
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border border-gray-600 border-t-blue-400 rounded-full animate-spin shrink-0" />
          )}
          <kbd className="text-[10px] text-gray-600 border border-gray-800 rounded px-1.5 py-0.5 shrink-0">
            Esc
          </kbd>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((r, i) => (
              <button
                key={r.id + r.type}
                onClick={() => navigate(r.href)}
                onMouseEnter={() => setCursor(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
                  ${cursor === i ? "bg-gray-800" : "hover:bg-gray-800/60"}`}
              >
                <span className="text-base shrink-0">{typeIcon[r.type] ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-100 truncate">
                    {highlight(r.label, query)}
                  </p>
                  {r.sublabel && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {highlight(r.sublabel, query)}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${typeColor[r.type] ?? "text-gray-400 bg-gray-400/10"}`}>
                  {r.type}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            Sin resultados para &quot;{query}&quot;
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800">
          {[
            { keys: ["↑","↓"], label: "navegar" },
            { keys: ["↵"],     label: "abrir"   },
            { keys: ["Esc"],   label: "cerrar"  },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              {item.keys.map((k) => (
                <kbd key={k} className="text-[10px] text-gray-600 border border-gray-800 rounded px-1 py-0.5">{k}</kbd>
              ))}
              <span className="text-[10px] text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}