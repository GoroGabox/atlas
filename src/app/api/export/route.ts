import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseArr(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}

function badge(label: string, value: string) {
  return `**${label}:** \`${value}\``;
}

function list(items: string[]) {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "_Sin datos_";
}

type NameRow     = { id: string; name: string };
type EndpointRow = { id: string; method: string; path: string };

async function loadCatalogMaps() {
  const [screens, components, services, endpoints]: [NameRow[], NameRow[], NameRow[], EndpointRow[]] =
    await Promise.all([
      prisma.screen.findMany({ select: { id: true, name: true } }),
      prisma.component.findMany({ select: { id: true, name: true } }),
      prisma.service.findMany({ select: { id: true, name: true } }),
      prisma.endpoint.findMany({ select: { id: true, method: true, path: true } }),
    ]);
  return {
    screenMap:    new Map(screens.map((s) => [s.id, s.name])),
    componentMap: new Map(components.map((c) => [c.id, c.name])),
    serviceMap:   new Map(services.map((s) => [s.id, s.name])),
    endpointMap:  new Map(endpoints.map((e) => [e.id, `${e.method} ${e.path}`])),
  };
}

function resolveIds(json: string | null, map: Map<string, string>): string[] {
  const ids = parseArr(json ?? "[]");
  return ids.map((id) => map.get(id) ?? id);
}

async function exportModule(id: string) {
  const [mod, catalog] = await Promise.all([
    prisma.module.findUnique({
      where: { id },
      include: {
        features: {
          include: { flows: { include: { steps: { orderBy: { order: "asc" } } } } },
        },
      },
    }),
    loadCatalogMaps(),
  ]);
  if (!mod) return null;

  const { screenMap, componentMap, serviceMap, endpointMap } = catalog;

  const lines: string[] = [
    `# ${mod.name}`,
    ``,
    `> ${mod.description}`,
    ``,
    `${badge("Dominio", mod.domain)} · ${badge("Criticidad", mod.criticality)} · ${badge("Riesgo", mod.riskLevel)} · ${badge("Doc", mod.documentationStatus)}`,
    ``,
    `**Owner PM:** ${mod.pmOwner ?? "—"} · **Owner Tech:** ${mod.techOwner ?? "—"}`,
    ``,
    `---`,
    ``,
    `## Features (${mod.features.length})`,
    ``,
  ];

  for (const feat of mod.features) {
    lines.push(`### ${feat.name}`);
    lines.push(``);
    lines.push(`> ${feat.businessGoal}`);
    lines.push(``);
    lines.push(`${badge("Complejidad técnica", feat.technicalComplexity)} · ${badge("Complejidad negocio", feat.businessComplexity)} · ${badge("Riesgo", feat.riskLevel)} · ${badge("Bus factor", String(feat.busFactor))}`);
    lines.push(``);

    const actors    = parseArr(feat.actors);
    const rules     = parseArr(feat.businessRules);
    const debt      = parseArr(feat.techDebt);
    const endpoints = parseArr(feat.endpoints);

    if (actors.length) {
      lines.push(`**Actores:** ${actors.join(", ")}`);
      lines.push(``);
    }

    if (rules.length) {
      lines.push(`**Reglas de negocio:**`);
      lines.push(list(rules));
      lines.push(``);
    }

    if (endpoints.length) {
      lines.push(`**Endpoints:**`);
      lines.push(list(endpoints));
      lines.push(``);
    }

    const flow = feat.flows[0];
    if (flow?.steps.length) {
      lines.push(`**Flujo:**`);
      for (const step of flow.steps) {
        const parts = [step.action];
        if (step.actor) parts.push(`👤 ${step.actor}`);
        if (step.screen) parts.push(`🖥 ${screenMap.get(step.screen) ?? step.screen}`);
        const comps = resolveIds(step.components, componentMap);
        if (comps.length) parts.push(`🧩 ${comps.join(", ")}`);
        const svcs = resolveIds(step.services, serviceMap);
        if (svcs.length) parts.push(`⚙️ ${svcs.join(", ")}`);
        const eps = resolveIds(step.endpoints, endpointMap);
        if (eps.length) parts.push(`🔗 ${eps.join(", ")}`);
        const resCmps = resolveIds(step.responseComponents, componentMap);
        if (resCmps.length) parts.push(`↩ ${resCmps.join(", ")}`);
        lines.push(`${step.order}. ${parts.join(" · ")}`);
      }
      lines.push(``);
    }

    if (debt.length) {
      lines.push(`**Deuda técnica:**`);
      lines.push(list(debt));
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }

  return lines.join("\n");
}

async function exportFeature(id: string) {
  const [feat, catalog] = await Promise.all([
    prisma.feature.findUnique({
      where: { id },
      include: {
        module: true,
        flows: { include: { steps: { orderBy: { order: "asc" } } } },
      },
    }),
    loadCatalogMaps(),
  ]);
  if (!feat) return null;

  const { screenMap, componentMap, serviceMap, endpointMap } = catalog;
  const flow = feat.flows[0];

  const lines: string[] = [
    `# ${feat.name}`,
    ``,
    `**Módulo:** ${feat.module.name}`,
    ``,
    `> ${feat.businessGoal}`,
    ``,
    `${badge("Complejidad técnica", feat.technicalComplexity)} · ${badge("Complejidad negocio", feat.businessComplexity)}`,
    `${badge("Riesgo", feat.riskLevel)} · ${badge("Doc", feat.documentationStatus)} · ${badge("Bus factor", String(feat.busFactor))}`,
    ``,
    `**Owner PM:** ${feat.pmOwner ?? "—"} · **Owner Tech:** ${feat.techOwner ?? "—"}`,
    ``,
    `---`,
    ``,
    `## Arquitectura técnica`,
    ``,
    `**Actores:** ${parseArr(feat.actors).join(", ") || "—"}`,
    `**Pantallas:** ${parseArr(feat.screens).join(", ") || "—"}`,
    `**Componentes:** ${parseArr(feat.components).join(", ") || "—"}`,
    `**Servicios:** ${parseArr(feat.services).join(", ") || "—"}`,
    `**Endpoints:** ${parseArr(feat.endpoints).join(", ") || "—"}`,
    `**Entidades:** ${parseArr(feat.entities).join(", ") || "—"}`,
    ``,
    `## Reglas de negocio`,
    ``,
    list(parseArr(feat.businessRules)),
    ``,
    `## Dependencias`,
    ``,
    list(parseArr(feat.dependencies)),
    ``,
  ];

  if (flow?.steps.length) {
    lines.push(`## Flujo funcional`);
    lines.push(``);
    for (const step of flow.steps) {
      const parts = [step.action];
      if (step.actor) parts.push(`👤 ${step.actor}`);
      if (step.screen) parts.push(`🖥 ${screenMap.get(step.screen) ?? step.screen}`);
      const comps = resolveIds(step.components, componentMap);
      if (comps.length) parts.push(`🧩 ${comps.join(", ")}`);
      const svcs = resolveIds(step.services, serviceMap);
      if (svcs.length) parts.push(`⚙️ ${svcs.join(", ")}`);
      const eps = resolveIds(step.endpoints, endpointMap);
      if (eps.length) parts.push(`🔗 ${eps.join(", ")}`);
      const resCmps = resolveIds(step.responseComponents, componentMap);
      if (resCmps.length) parts.push(`↩ ${resCmps.join(", ")}`);
      lines.push(`${step.order}. ${parts.join(" · ")}`);
    }
    lines.push(``);
  }

  const debt = parseArr(feat.techDebt);
  if (debt.length) {
    lines.push(`## Deuda técnica`);
    lines.push(``);
    lines.push(list(debt));
    lines.push(``);
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id   = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Faltan parámetros type e id" }, { status: 400 });
    }

    let content: string | null = null;
    let filename = "export.md";

    if (type === "module") {
      content  = await exportModule(id);
      if (content) {
        const slug = id.slice(0, 8); // fallback si el nombre falla
        const mod  = await prisma.module.findUnique({ where: { id }, select: { name: true } });
        filename   = `${(mod?.name ?? slug).toLowerCase().replace(/[^\x00-\x7F]+/g, "").replace(/[\s/\\:*?"<>|]+/g, "-").replace(/^-+|-+$/g, "")}.md`;
      }
    } else if (type === "feature") {
      content  = await exportFeature(id);
      if (content) {
        const feat = await prisma.feature.findUnique({ where: { id }, select: { name: true } });
        filename   = `${(feat?.name ?? id.slice(0, 8)).toLowerCase().replace(/[^\x00-\x7F]+/g, "").replace(/[\s/\\:*?"<>|]+/g, "-").replace(/^-+|-+$/g, "")}.md`;
      }
    }

    if (!content) {
      return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 });
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type":        "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[api/export] Error:", err);
    return NextResponse.json({ error: "Error interno al exportar" }, { status: 500 });
  }
}