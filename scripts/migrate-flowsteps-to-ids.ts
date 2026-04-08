/**
 * Sprint 3: Migración de FlowStep — strings libres → IDs del catálogo
 *
 * Uso:
 *   npx tsx scripts/migrate-flowsteps-to-ids.ts           ← dry-run (solo reporta)
 *   npx tsx scripts/migrate-flowsteps-to-ids.ts --apply   ← aplica los cambios
 *
 * Qué hace:
 *   - screen String?      → resuelve por nombre a Screen.id
 *   - components String?  → JSON array de nombres → JSON array de Component.id
 *   - services String?    → JSON array de nombres → JSON array de Service.id
 *   - endpoints String?   → JSON array de {method,path,...} → JSON array de Endpoint.id
 *
 * Strings que no coinciden con ninguna entidad del catálogo quedan como null.
 * El script genera un reporte detallado de coincidencias y pérdidas.
 */

import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

// ─── Types ───────────────────────────────────────────────────────────────────

type ScreenRow = Prisma.ScreenGetPayload<{
  select: { id: true; name: true };
}>;

type ComponentRow = Prisma.ComponentGetPayload<{
  select: { id: true; name: true };
}>;

type ServiceRow = Prisma.ServiceGetPayload<{
  select: { id: true; name: true };
}>;

type EndpointRow = Prisma.EndpointGetPayload<{
  select: { id: true; method: true; path: true };
}>;

type FlowStepRow = Prisma.FlowStepGetPayload<Record<string, never>>;

type FlowStepUpdateData = {
  screen?: string | null;
  components?: string | null;
  responseComponents?: string | null;
  services?: string | null;
  endpoints?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseArr(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

function parseEndpoints(json: string | null): Array<{ method?: string; path?: string }> {
  if (!json) return [];
  try {
    return JSON.parse(json) as Array<{ method?: string; path?: string }>;
  } catch {
    return [];
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(DRY_RUN ? "DRY-RUN: no se escriben cambios en la DB" : "APPLY: escribiendo cambios en la DB");
  console.log(`${"=".repeat(60)}\n`);

  // Cargar catálogos completos
  const [screens, components, services, endpoints, steps]: [
    ScreenRow[],
    ComponentRow[],
    ServiceRow[],
    EndpointRow[],
    FlowStepRow[]
  ] = await Promise.all([
    prisma.screen.findMany({ select: { id: true, name: true } }),
    prisma.component.findMany({ select: { id: true, name: true } }),
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.endpoint.findMany({ select: { id: true, method: true, path: true } }),
    prisma.flowStep.findMany(),
  ]);

  console.log(
    `Catálogo — Screens: ${screens.length} | Components: ${components.length} | Services: ${services.length} | Endpoints: ${endpoints.length}`
  );
  console.log(`FlowSteps a procesar: ${steps.length}\n`);

  // Índices para lookup rápido
  const screenByName = new Map<string, string>(
    screens.map((s: ScreenRow) => [normalize(s.name), s.id])
  );

  const compByName = new Map<string, string>(
    components.map((c: ComponentRow) => [normalize(c.name), c.id])
  );

  const serviceByName = new Map<string, string>(
    services.map((s: ServiceRow) => [normalize(s.name), s.id])
  );

  const endpointByKey = new Map<string, string>(
    endpoints.map((e: EndpointRow) => [`${e.method.toUpperCase()}:${normalize(e.path)}`, e.id])
  );

  // Contadores del reporte
  const report = {
    screensResolved: 0,
    screensLost: 0,
    compsResolved: 0,
    compsLost: 0,
    svcsResolved: 0,
    svcsLost: 0,
    epsResolved: 0,
    epsLost: 0,
    stepsModified: 0,
    unresolvableItems: [] as string[],
  };

  for (const step of steps) {
    const update: FlowStepUpdateData = {};
    let changed = false;

    // ── screen ────────────────────────────────────────────────────────────
    if (step.screen) {
      const resolvedId = screenByName.get(normalize(step.screen));
      if (resolvedId) {
        update.screen = resolvedId;
        report.screensResolved++;
      } else {
        update.screen = null;
        report.screensLost++;
        report.unresolvableItems.push(`step[${step.id}].screen = "${step.screen}"`);
      }
      changed = true;
    }

    // ── components ────────────────────────────────────────────────────────
    const compNames = parseArr(step.components);
    if (compNames.length > 0) {
      const resolvedIds: string[] = [];
      for (const name of compNames) {
        const id = compByName.get(normalize(name));
        if (id) {
          resolvedIds.push(id);
          report.compsResolved++;
        } else {
          report.compsLost++;
          report.unresolvableItems.push(`step[${step.id}].components = "${name}"`);
        }
      }
      update.components = resolvedIds.length > 0 ? JSON.stringify(resolvedIds) : null;
      changed = true;
    }

    // ── responseComponents ────────────────────────────────────────────────
    const respCompNames = parseArr(step.responseComponents);
    if (respCompNames.length > 0) {
      const resolvedIds: string[] = [];
      for (const name of respCompNames) {
        const id = compByName.get(normalize(name));
        if (id) {
          resolvedIds.push(id);
          report.compsResolved++;
        } else {
          report.compsLost++;
          report.unresolvableItems.push(`step[${step.id}].responseComponents = "${name}"`);
        }
      }
      update.responseComponents = resolvedIds.length > 0 ? JSON.stringify(resolvedIds) : null;
      changed = true;
    }

    // ── services ──────────────────────────────────────────────────────────
    const svcNames = parseArr(step.services);
    if (svcNames.length > 0) {
      const resolvedIds: string[] = [];
      for (const name of svcNames) {
        const id = serviceByName.get(normalize(name));
        if (id) {
          resolvedIds.push(id);
          report.svcsResolved++;
        } else {
          report.svcsLost++;
          report.unresolvableItems.push(`step[${step.id}].services = "${name}"`);
        }
      }
      update.services = resolvedIds.length > 0 ? JSON.stringify(resolvedIds) : null;
      changed = true;
    }

    // ── endpoints ─────────────────────────────────────────────────────────
    const epObjs = parseEndpoints(step.endpoints);
    if (epObjs.length > 0) {
      const resolvedIds: string[] = [];
      for (const ep of epObjs) {
        if (!ep.method || !ep.path) continue;
        const key = `${ep.method.toUpperCase()}:${normalize(ep.path)}`;
        const id = endpointByKey.get(key);

        if (id) {
          resolvedIds.push(id);
          report.epsResolved++;
        } else {
          report.epsLost++;
          report.unresolvableItems.push(`step[${step.id}].endpoints = "${ep.method} ${ep.path}"`);
        }
      }
      update.endpoints = resolvedIds.length > 0 ? JSON.stringify(resolvedIds) : null;
      changed = true;
    }

    if (changed) {
      report.stepsModified++;
      if (!DRY_RUN) {
        await prisma.flowStep.update({
          where: { id: step.id },
          data: update,
        });
      }
    }
  }

  // ── Reporte ─────────────────────────────────────────────────────────────
  console.log("─── RESULTADO ───────────────────────────────────────────");
  console.log(`Steps procesados con cambios: ${report.stepsModified}/${steps.length}`);
  console.log(`\nScreens    → resueltas: ${report.screensResolved} | perdidas: ${report.screensLost}`);
  console.log(`Components → resueltos: ${report.compsResolved} | perdidos: ${report.compsLost}`);
  console.log(`Services   → resueltos: ${report.svcsResolved} | perdidos: ${report.svcsLost}`);
  console.log(`Endpoints  → resueltos: ${report.epsResolved} | perdidos: ${report.epsLost}`);

  const totalLost = report.screensLost + report.compsLost + report.svcsLost + report.epsLost;
  const totalResolved =
    report.screensResolved + report.compsResolved + report.svcsResolved + report.epsResolved;
  const total = totalLost + totalResolved;

  if (total > 0) {
    const pct = Math.round((totalResolved / total) * 100);
    console.log(`\nTasa de resolución: ${pct}% (${totalResolved}/${total})`);
  }

  if (report.unresolvableItems.length > 0) {
    console.log(`\n─── ITEMS SIN RESOLVER (${report.unresolvableItems.length}) ────────────────────`);
    report.unresolvableItems.forEach((item) => console.log("  ✗ " + item));
    console.log("\n⚠ Estos valores quedarán como null tras el --apply.");
    console.log("  Crea las entidades correspondientes en /entities y vuelve a correr el script.");
  } else if (total > 0) {
    console.log("\n✅ Todos los valores se resolvieron correctamente.");
  } else {
    console.log("\nℹ Ningún FlowStep tiene datos que migrar (campos ya son null o vacíos).");
  }

  if (DRY_RUN) {
    console.log("\n─── Para aplicar los cambios, correr con --apply ────────");
  } else {
    console.log("\n✅ Migración aplicada.");
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });