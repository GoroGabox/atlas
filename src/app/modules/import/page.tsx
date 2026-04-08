"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Template .md que Claude Code debe seguir ──────────────────────────────────
const ATLAS_TEMPLATE = `# NOMBRE_MODULO

**dominio:** payments
**criticidad:** high
**riesgo:** medium
**documentacion:** partial
**owner-pm:** —
**owner-tech:** —

> Una oración que describa qué hace este módulo y por qué existe.

---

## Feature: NOMBRE_FEATURE

**objetivo:** Qué problema de negocio resuelve esta feature.
**complejidad-tecnica:** medium
**complejidad-negocio:** medium
**riesgo:** medium
**bus-factor:** 2
**actores:** Usuario, Sistema

### Reglas de negocio

- Regla de negocio 1 identificada en el código
- Regla de negocio 2

### Flujo

1. El usuario ingresa a la pantalla principal
2. El sistema valida el estado de sesión
3. El usuario completa el formulario y confirma
4. El sistema procesa la solicitud y muestra resultado

### Deuda técnica

- TODO encontrado en el código o área de mejora identificada

---`;

// ── Prompt que el usuario copia en Claude Code ────────────────────────────────
const CLAUDE_CODE_PROMPT = `Analiza el código fuente de esta aplicación y genera un archivo de documentación para Atlas (sistema de gestión de conocimiento de producto).

**Tarea:** Documenta el módulo "${`<NOMBRE_DEL_MODULO>`}" siguiendo EXACTAMENTE el template de abajo. Basa cada campo en el código real del repositorio.

**Reglas de análisis:**
- Lee los archivos fuente del módulo antes de documentar
- Infiere las reglas de negocio desde validaciones, guards, condiciones y comentarios en el código
- Describe el flujo como una secuencia de pasos en lenguaje natural (no código)
- Marca la deuda técnica con los TODOs, hacks y áreas frágiles que encuentres
- Si un campo no aplica, usa "—" o "none" según corresponda

**Valores válidos por campo:**
- dominio: nombre del dominio (ej: payments, auth, inventory, orders, users)
- criticidad: low | medium | high | critical
- riesgo: low | medium | high
- documentacion: none | partial | complete
- complejidad-tecnica: low | medium | high
- complejidad-negocio: low | medium | high
- bus-factor: número entero del 1 al 5 (cuántas personas entienden realmente esta feature)
- actores: lista separada por comas (ej: Usuario, Administrador, Sistema de pagos)

**Template a completar:**

\`\`\`markdown
# NOMBRE_MODULO

**dominio:** valor
**criticidad:** valor
**riesgo:** valor
**documentacion:** none
**owner-pm:** —
**owner-tech:** —

> Una oración que describa qué hace este módulo y por qué existe.

---

## Feature: NOMBRE_FEATURE

**objetivo:** Qué problema de negocio resuelve esta feature.
**complejidad-tecnica:** medium
**complejidad-negocio:** medium
**riesgo:** medium
**bus-factor:** 1
**actores:** Actor1, Actor2

### Reglas de negocio

- Regla identificada en el código

### Flujo

1. Paso 1 (quién hace qué)
2. Paso 2
3. ...

### Deuda técnica

- Item de deuda técnica (TODOs, código frágil, workarounds)

---

(Repite la sección ## Feature: por cada feature relevante del módulo)
\`\`\`

Genera el archivo completo con todas las features del módulo. No incluyas nada fuera del bloque markdown.`;

export default function ImportModulePage() {
  const [file,     setFile]     = useState<File | null>(null);
  const [state,    setState]    = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result,   setResult]   = useState<{ moduleId: string; name: string; features: number } | null>(null);
  const [errMsg,   setErrMsg]   = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [showTpl,  setShowTpl]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  async function copyPrompt() {
    await navigator.clipboard.writeText(CLAUDE_CODE_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFile(f: File | undefined | null) {
    if (!f) return;
    if (!f.name.endsWith(".md")) {
      setErrMsg("Solo se aceptan archivos .md generados con el prompt de Atlas.");
      setState("error");
      return;
    }
    setFile(f);
    setState("idle");
    setErrMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setState("loading");
    setErrMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json() as { ok?: boolean; moduleId?: string; name?: string; features?: number; error?: string };
      if (!res.ok || !data.ok) {
        setErrMsg(data.error ?? "Error desconocido al importar.");
        setState("error");
        return;
      }
      setResult({ moduleId: data.moduleId!, name: data.name!, features: data.features! });
      setState("success");
      router.refresh();
    } catch {
      setErrMsg("No se pudo conectar con el servidor.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
          <span>/</span>
          <span className="text-gray-300">Importar desde .md</span>
        </div>
        <div className="bg-green-950/30 border border-green-500/20 rounded-xl px-6 py-10 text-center space-y-4">
          <span className="text-4xl">✅</span>
          <div>
            <p className="text-lg font-bold text-white">{result!.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Módulo importado con{" "}
              <strong className="text-green-300">{result!.features} feature{result!.features !== 1 ? "s" : ""}</strong>.
              Los pasos de flujo fueron creados; vincula pantallas, servicios y endpoints desde el detalle de cada feature.
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href={`/modules/${result!.moduleId}`}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Ver módulo →
            </Link>
            <button
              onClick={() => { setFile(null); setState("idle"); setResult(null); }}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 text-sm transition-colors"
            >
              Importar otro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
        <span>/</span>
        <span className="text-gray-300">Importar desde .md</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Importar módulo</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Usa Claude Code en tu aplicación para generar un <code className="text-blue-400">.md</code> siguiendo el template de Atlas, luego súbelo aquí.
        </p>
      </div>

      {/* ── Paso 1: Prompt ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <h2 className="text-sm font-semibold text-gray-200">Copia el prompt y úsalo en Claude Code</h2>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
            <span className="text-xs text-gray-500 font-mono">claude-code-prompt.txt</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTpl((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showTpl ? "▲ Ocultar template" : "▼ Ver template .md"}
              </button>
              <button
                onClick={copyPrompt}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  copied
                    ? "bg-green-600/20 text-green-300 border border-green-600/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <rect x="4" y="1" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M8 1V.5A.5.5 0 007.5 0h-7A.5.5 0 000 .5v9a.5.5 0 00.5.5H4" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                    Copiar prompt
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="text-xs text-gray-400 px-4 py-3 overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap">
            {CLAUDE_CODE_PROMPT.slice(0, 300)}
            <span className="text-gray-600">…</span>
          </pre>
        </div>

        {showTpl && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
              <span className="text-xs text-gray-500 font-mono">template.md</span>
              <span className="text-xs text-gray-600">Formato que Atlas espera recibir</span>
            </div>
            <pre className="text-xs text-gray-400 px-4 py-3 overflow-x-auto max-h-64 leading-relaxed">
              {ATLAS_TEMPLATE}
            </pre>
          </div>
        )}

        <div className="bg-gray-900/60 border border-gray-800 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-400">¿Cómo usarlo?</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Abre tu terminal en el proyecto a documentar</li>
            <li>Ejecuta <code className="text-blue-400 bg-blue-400/10 px-1 rounded">claude</code> (Claude Code CLI)</li>
            <li>Pega el prompt copiado y presiona Enter</li>
            <li>Claude Code analizará el código y generará el <code className="text-blue-400">.md</code></li>
            <li>Guarda el resultado como archivo <code className="text-blue-400">.md</code> y súbelo abajo</li>
          </ol>
        </div>
      </div>

      {/* ── Paso 2: Upload ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
          <h2 className="text-sm font-semibold text-gray-200">Sube el archivo <code className="text-blue-400">.md</code> generado</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
            onDragLeave={()  => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 cursor-pointer
              rounded-xl border-2 border-dashed px-8 py-10 transition-colors select-none
              ${dragging
                ? "border-blue-400 bg-blue-950/40"
                : file
                  ? "border-green-500/60 bg-green-950/20"
                  : "border-gray-700 hover:border-gray-600 bg-gray-900/40"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".md"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <span className="text-3xl">{file ? "📄" : "📥"}</span>
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-green-300">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click para cambiar</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-300 font-medium">Arrastra tu archivo .md aquí</p>
                <p className="text-xs text-gray-500 mt-0.5">o haz click para seleccionarlo</p>
              </div>
            )}
          </div>

          {state === "error" && (
            <div className="bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
              ⚠ {errMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || state === "loading"}
            className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors
              bg-blue-600 hover:bg-blue-500 text-white
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {state === "loading" ? "Importando…" : "Importar módulo"}
          </button>
        </form>
      </div>
    </div>
  );
}
