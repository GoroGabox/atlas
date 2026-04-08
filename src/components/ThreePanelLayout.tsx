"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  left:   React.ReactNode;
  center: React.ReactNode;
  right:  React.ReactNode;
  leftTitle?:  string;
  rightTitle?: string;
};

const NAV_HEIGHT = 57; // px — altura del nav (border incluido)

export default function ThreePanelLayout({
  left, center, right,
  leftTitle  = "Secuencias",
  rightTitle = "Detalle",
}: Props) {
  const [leftOpen,  setLeftOpen]  = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [height,    setHeight]    = useState(`calc(100vh - ${NAV_HEIGHT}px)`);

  // Recalcular si el nav cambia de tamaño (e.g. mobile)
  useEffect(() => {
    function measure() {
      const nav = document.getElementById("main-nav");
      const h   = nav ? nav.getBoundingClientRect().height : NAV_HEIGHT;
      setHeight(`calc(100vh - ${h}px)`);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      className="flex overflow-hidden"
      style={{ height }}
    >
      {/* ── Panel izquierdo ── */}
      <aside
        className="flex flex-col border-r border-gray-800 bg-gray-900 transition-all duration-200 overflow-hidden"
        style={{ width: leftOpen ? "20%" : "36px", minWidth: leftOpen ? "180px" : "36px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 shrink-0">
          {leftOpen && (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
              {leftTitle}
            </span>
          )}
          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="ml-auto text-gray-500 hover:text-white transition-colors p-0.5 rounded"
            title={leftOpen ? "Colapsar panel" : "Expandir panel"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {leftOpen
                ? <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </button>
        </div>
        {/* Content */}
        {leftOpen && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {left}
          </div>
        )}
      </aside>

      {/* ── Centro — grafo ── */}
      <main className="flex-1 overflow-hidden relative">
        {center}
      </main>

      {/* ── Panel derecho ── */}
      <aside
        className="flex flex-col border-l border-gray-800 bg-gray-900 transition-all duration-200 overflow-hidden"
        style={{ width: rightOpen ? "20%" : "36px", minWidth: rightOpen ? "200px" : "36px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 shrink-0">
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="text-gray-500 hover:text-white transition-colors p-0.5 rounded"
            title={rightOpen ? "Colapsar panel" : "Expandir panel"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {rightOpen
                ? <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </button>
          {rightOpen && (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate ml-2">
              {rightTitle}
            </span>
          )}
        </div>
        {/* Content */}
        {rightOpen && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {right}
          </div>
        )}
      </aside>
    </div>
  );
}