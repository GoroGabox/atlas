"use client";

import { useEffect, useState } from "react";

export default function CommandPaletteButton() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const checkPlatform = () => setIsMac(navigator.platform.toUpperCase().includes("MAC"));
    window.addEventListener('resize', checkPlatform);
    return () => window.removeEventListener('resize', checkPlatform);
  }, []);

  function open() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  }

  return (
    <button
      onClick={open}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span>Buscar</span>
      <kbd className="text-[10px] border border-gray-700 rounded px-1 py-0.5">
        {isMac ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}