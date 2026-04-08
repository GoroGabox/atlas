import { prisma } from "@/lib/prisma";

/**
 * Scans all FlowSteps in a flow and removes references to entities
 * that no longer exist in the DB. Runs silently on page load.
 *
 * Returns true if any step was cleaned up.
 */
export async function cleanOrphanedRefs(flowId: string): Promise<boolean> {
  const steps = await prisma.flowStep.findMany({ where: { flowId } });
  if (!steps.length) return false;

  // Collect all referenced entity IDs across all steps
  const screenIds = new Set<string>();
  const compIds   = new Set<string>();
  const svcIds    = new Set<string>();
  const epIds     = new Set<string>();

  function parseArr(raw: string | null): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }

  for (const s of steps) {
    if (s.screen) screenIds.add(s.screen);
    for (const id of parseArr(s.components))         compIds.add(id);
    for (const id of parseArr(s.responseComponents)) compIds.add(id);
    for (const id of parseArr(s.services))           svcIds.add(id);
    for (const id of parseArr(s.endpoints))          epIds.add(id);
  }

  // Batch-verify existence in DB
  const [existingScreens, existingComps, existingSvcs, existingEps] = await Promise.all([
    screenIds.size
      ? prisma.screen.findMany({    where: { id: { in: [...screenIds] } }, select: { id: true } })
      : [],
    compIds.size
      ? prisma.component.findMany({ where: { id: { in: [...compIds] } },   select: { id: true } })
      : [],
    svcIds.size
      ? prisma.service.findMany({   where: { id: { in: [...svcIds] } },    select: { id: true } })
      : [],
    epIds.size
      ? prisma.endpoint.findMany({  where: { id: { in: [...epIds] } },     select: { id: true } })
      : [],
  ]);

  const validScreens = new Set(existingScreens.map((e) => e.id));
  const validComps   = new Set(existingComps.map((e) => e.id));
  const validSvcs    = new Set(existingSvcs.map((e) => e.id));
  const validEps     = new Set(existingEps.map((e) => e.id));

  // Clean each step
  let dirty = false;

  for (const step of steps) {
    const updates: Record<string, string | null> = {};

    // Screen
    if (step.screen && !validScreens.has(step.screen)) {
      updates.screen = null;
    }

    // Array fields
    const arrayFields: { field: string; valid: Set<string> }[] = [
      { field: "components",         valid: validComps },
      { field: "responseComponents", valid: validComps },
      { field: "services",           valid: validSvcs },
      { field: "endpoints",          valid: validEps },
    ];

    for (const { field, valid } of arrayFields) {
      const arr = parseArr(step[field as keyof typeof step] as string | null);
      const filtered = arr.filter((id) => valid.has(id));
      if (filtered.length !== arr.length) {
        updates[field] = filtered.length ? JSON.stringify(filtered) : null;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.flowStep.update({ where: { id: step.id }, data: updates });
      dirty = true;
    }
  }

  return dirty;
}
