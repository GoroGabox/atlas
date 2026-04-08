import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Atlas Import Parser ────────────────────────────────────────────────────────
// Formato esperado (generado por Claude Code en la app del usuario siguiendo
// el prompt de Atlas):
//
// # NOMBRE_MODULO
// **dominio:** payments
// **criticidad:** high
// **riesgo:** medium
// **documentacion:** partial
// **owner-pm:** —
// **owner-tech:** —
// > Descripción breve del módulo.
// ---
// ## Feature: NOMBRE_FEATURE
// **objetivo:** Descripción del objetivo de negocio.
// **complejidad-tecnica:** medium
// **complejidad-negocio:** medium
// **riesgo:** medium
// **bus-factor:** 2
// **actores:** Actor1, Actor2
// ### Reglas de negocio
// - Regla 1
// ### Flujo
// 1. Paso 1
// 2. Paso 2
// ### Deuda técnica
// - Item de deuda
// ---

interface ParsedFeature {
  name:                string;
  businessGoal:        string;
  technicalComplexity: string;
  businessComplexity:  string;
  riskLevel:           string;
  busFactor:           number;
  actors:              string[];
  businessRules:       string[];
  techDebt:            string[];
  flowSteps:           { order: number; action: string }[];
}

interface ParsedModule {
  name:                string;
  description:         string;
  domain:              string;
  criticality:         string;
  riskLevel:           string;
  documentationStatus: string;
  pmOwner:             string | null;
  techOwner:           string | null;
  features:            ParsedFeature[];
}

/** Extrae { key, val } de una línea `**clave:** valor`. */
function parseKV(line: string): { key: string; val: string } | null {
  const m = line.match(/^\*\*([^*]+):\*\*\s*(.+)/);
  if (!m) return null;
  const raw = m[2].trim();
  return { key: m[1].trim().toLowerCase(), val: raw === "—" ? "" : raw };
}

function parseMd(md: string): ParsedModule | null {
  const lines = md.split("\n");
  let i = 0;

  const peek = () => lines[i] ?? "";
  const next = () => lines[i++] ?? "";

  // Buscar el título del módulo (# ...)
  while (i < lines.length && !peek().startsWith("# ")) i++;
  if (i >= lines.length) return null;

  const moduleName = next().slice(2).trim();
  if (!moduleName) return null;

  // Valores de módulo
  let description         = "";
  let domain              = "general";
  let criticality         = "medium";
  let riskLevel           = "medium";
  let documentationStatus = "none";
  let pmOwner: string | null  = null;
  let techOwner: string | null = null;
  const features: ParsedFeature[] = [];

  while (i < lines.length) {
    const line = peek();

    // ── Feature ────────────────────────────────────────────────────────────
    if (line.startsWith("## Feature:")) {
      next();
      const featName = line.slice("## Feature:".length).trim();

      let businessGoal        = "";
      let technicalComplexity = "medium";
      let businessComplexity  = "medium";
      let featRisk            = "medium";
      let busFactor           = 1;
      const actors:       string[] = [];
      const businessRules: string[] = [];
      const techDebt:     string[] = [];
      const flowSteps: { order: number; action: string }[] = [];
      let section = "";

      while (i < lines.length) {
        const fl = peek();
        // Fin de feature: siguiente ## o # o final
        if (fl.startsWith("## ") || fl.startsWith("# ")) break;
        next();

        const trimmed = fl.trim();
        if (trimmed === "" || trimmed === "---") { section = ""; continue; }

        // Sub-secciones de la feature
        if (trimmed === "### Reglas de negocio" || trimmed === "### Business rules") { section = "rules"; continue; }
        if (trimmed === "### Flujo"              || trimmed === "### Flow")           { section = "flow";  continue; }
        if (trimmed === "### Deuda técnica"      || trimmed === "### Tech debt")      { section = "debt";  continue; }
        // Ignorar otros ### sin reconocer
        if (trimmed.startsWith("### ")) { section = ""; continue; }

        // Descripción alternativa con >
        if (trimmed.startsWith("> ") && !businessGoal) {
          businessGoal = trimmed.slice(2).trim();
          continue;
        }

        // Metadatos KV
        const kv = parseKV(fl);
        if (kv) {
          switch (kv.key) {
            case "objetivo":
            case "business goal":
            case "objetivo de negocio":
              businessGoal = kv.val; break;
            case "complejidad-tecnica":
            case "complejidad técnica":
            case "technical complexity":
              technicalComplexity = kv.val || "medium"; break;
            case "complejidad-negocio":
            case "complejidad negocio":
            case "business complexity":
              businessComplexity = kv.val || "medium"; break;
            case "riesgo":
            case "risk":
              featRisk = kv.val || "medium"; break;
            case "bus-factor":
            case "bus factor":
              busFactor = parseInt(kv.val, 10) || 1; break;
            case "actores":
            case "actors":
              actors.push(...kv.val.split(",").map((a) => a.trim()).filter(Boolean)); break;
          }
          continue;
        }

        // Items de lista
        if ((section === "rules") && fl.startsWith("- ")) {
          businessRules.push(fl.slice(2).trim());
          continue;
        }
        if ((section === "debt") && fl.startsWith("- ")) {
          techDebt.push(fl.slice(2).trim());
          continue;
        }
        if (section === "flow") {
          const m = fl.match(/^(\d+)\.\s+(.+)/);
          if (m) flowSteps.push({ order: parseInt(m[1], 10), action: m[2].trim() });
        }
      }

      features.push({
        name: featName || "(sin nombre)",
        businessGoal: businessGoal || "(importado)",
        technicalComplexity,
        businessComplexity,
        riskLevel: featRisk,
        busFactor,
        actors,
        businessRules,
        techDebt,
        flowSteps,
      });
      continue;
    }

    // ── Metadatos de módulo ────────────────────────────────────────────────
    if (line.trim().startsWith("> ") && !description) {
      description = next().trim().slice(2).trim();
      continue;
    }

    const kv = parseKV(line);
    if (kv) {
      next();
      switch (kv.key) {
        case "dominio":
        case "domain":
          domain = kv.val || "general"; break;
        case "criticidad":
        case "criticality":
          criticality = kv.val || "medium"; break;
        case "riesgo":
        case "risk":
          riskLevel = kv.val || "medium"; break;
        case "documentacion":
        case "documentación":
        case "documentation":
          documentationStatus = kv.val || "none"; break;
        case "owner-pm":
        case "owner pm":
          pmOwner = kv.val || null; break;
        case "owner-tech":
        case "owner tech":
          techOwner = kv.val || null; break;
      }
      continue;
    }

    next();
  }

  return {
    name: moduleName,
    description: description || "(importado)",
    domain,
    criticality,
    riskLevel,
    documentationStatus,
    pmOwner,
    techOwner,
    features,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const text   = await file.text();
    const parsed = parseMd(text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Formato no reconocido. Asegúrate de usar el prompt de Atlas en Claude Code para generar el .md." },
        { status: 422 },
      );
    }

    const arr = (items: string[]) => JSON.stringify(items);

    // Crear módulo
    const mod = await prisma.module.create({
      data: {
        name:                parsed.name,
        description:         parsed.description,
        domain:              parsed.domain,
        criticality:         parsed.criticality,
        riskLevel:           parsed.riskLevel,
        documentationStatus: parsed.documentationStatus,
        pmOwner:             parsed.pmOwner,
        techOwner:           parsed.techOwner,
      },
    });

    // Crear features y flujos
    for (const pf of parsed.features) {
      const feat = await prisma.feature.create({
        data: {
          moduleId:            mod.id,
          name:                pf.name,
          description:         "",
          businessGoal:        pf.businessGoal,
          actors:              arr(pf.actors),
          screens:             arr([]),
          components:          arr([]),
          services:            arr([]),
          endpoints:           arr([]),
          entities:            arr([]),
          businessRules:       arr(pf.businessRules),
          dependencies:        arr([]),
          technicalComplexity: pf.technicalComplexity,
          businessComplexity:  pf.businessComplexity,
          riskLevel:           pf.riskLevel,
          busFactor:           pf.busFactor,
          techDebt:            arr(pf.techDebt),
          documentationStatus: "partial",
        },
      });

      if (pf.flowSteps.length > 0) {
        const flow = await prisma.flow.create({ data: { featureId: feat.id } });
        await prisma.flowStep.createMany({
          data: pf.flowSteps.map((s) => ({
            flowId: flow.id,
            order:  s.order,
            action: s.action,
            actor:  null,
          })),
        });
      }
    }

    revalidatePath("/modules");

    return NextResponse.json({
      ok:       true,
      moduleId: mod.id,
      name:     mod.name,
      features: parsed.features.length,
    });
  } catch (err) {
    console.error("[api/import] Error:", err);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}
