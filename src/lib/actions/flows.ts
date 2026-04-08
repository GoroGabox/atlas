"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Convierte un textarea "una línea por ítem" en JSON array para la DB */
function parseLines(raw: FormDataEntryValue | null): string | null {
  const arr = ((raw as string) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

/** Devuelve string limpio o null si vacío */
function str(raw: FormDataEntryValue | null): string | null {
  return (raw as string)?.trim() || null;
}

// ─── Flow ─────────────────────────────────────────────────────────────────────
export async function createFlow(featureId: string) {
  const flow = await prisma.flow.create({ data: { featureId } });
  revalidatePath(`/features/${featureId}`);
  return flow;
}

export async function deleteFlow(id: string, featureId: string) {
  await prisma.flow.delete({ where: { id } });
  revalidatePath(`/features/${featureId}`);
}

// ─── FlowStep ─────────────────────────────────────────────────────────────────
export async function createFlowStep(
  flowId: string,
  featureId: string,
  formData: FormData
) {
  const steps = await prisma.flowStep.findMany({ where: { flowId } });
  const actorVal = str(formData.get("actor")) ?? "Actor";
  const actionVal = str(formData.get("action")) ?? `Paso de ${actorVal}`;

  await prisma.flowStep.create({
    data: {
      flowId,
      order:             steps.length + 1,
      action:            actionVal,
      actor:             actorVal,
      screen:            str(formData.get("screen")),
      components:        parseLines(formData.get("components")),
      services:          parseLines(formData.get("services")),
      endpoints:         null,
      responseComponents: parseLines(formData.get("responseComponents")),
    },
  });
  revalidatePath(`/features/${featureId}`);
}

export async function updateFlowStep(
  id: string,
  featureId: string,
  formData: FormData
) {
  await prisma.flowStep.update({
    where: { id },
    data: {
      action:            formData.get("action") as string,
      actor:             str(formData.get("actor")),
      screen:            str(formData.get("screen")),
      components:        parseLines(formData.get("components")),
      services:          parseLines(formData.get("services")),
      endpoints:         null,
      responseComponents: parseLines(formData.get("responseComponents")),
    },
  });
  revalidatePath(`/features/${featureId}`);
}

export async function deleteFlowStep(id: string, featureId: string) {
  const step = await prisma.flowStep.findUnique({ where: { id } });
  if (!step) return;

  await prisma.flowStep.delete({ where: { id } });

  const remaining = await prisma.flowStep.findMany({
    where: { flowId: step.flowId },
    orderBy: { order: "asc" },
  });
  await Promise.all(
    remaining.map((s, i) =>
      prisma.flowStep.update({ where: { id: s.id }, data: { order: i + 1 } })
    )
  );

  revalidatePath(`/features/${featureId}`);
}

export async function reorderFlowSteps(
  flowId: string,
  featureId: string,
  orderedIds: string[]
) {
  await Promise.all(
    orderedIds.map((id, i) =>
      prisma.flowStep.update({ where: { id }, data: { order: i + 1 } })
    )
  );
  revalidatePath(`/features/${featureId}`);
}

// ─── Mutación granular de campos ─────────────────────────────────────────────
export async function updateFlowStepField(
  stepId: string,
  featureId: string,
  data: Partial<{
    action:             string;
    actor:              string | null;
    screen:             string | null;
    components:         string | null;
    services:           string | null;
    endpoints:          string | null;
    responseComponents: string | null;
  }>
) {
  await prisma.flowStep.update({ where: { id: stepId }, data });
  revalidatePath(`/features/${featureId}`);
}

export async function saveFlowGraph(
  flowId: string,
  featureId: string,
  nodes: unknown[],
  edges: unknown[]
) {
  await prisma.flow.update({
    where: { id: flowId },
    data: { graphJson: JSON.stringify({ nodes, edges }) },
  });
  revalidatePath(`/features/${featureId}`);
}

// ─── Create entity + wire it into the flow steps ────────────────────────────
// Called when the user drops a new node on the FlowVisualizer canvas.
// Creates the real DB entity, then appends its ID to the matching steps.

function parseJsonArr(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

/**
 * Maps a FlowVisualizer source-handle to the step field that should receive the
 * new entity, and tells us how to find the "source" steps.
 */
function handleToField(sourceHandle: string): {
  /** Field on FlowStep that holds the new entity */
  targetField: "screen" | "components" | "services" | "endpoints" | "responseComponents";
  /** How to find the source step: which field contains the source entity ID */
  sourceField: "actor" | "screen" | "components" | "services";
  /** Whether sourceField is a JSON array (vs plain string) */
  sourceIsArray: boolean;
} | null {
  // actor → screen: source is step.actor (plain string)
  if (sourceHandle === "right")
    return { targetField: "screen", sourceField: "actor", sourceIsArray: false };
  // screen → component: source is step.screen
  if (sourceHandle.startsWith("right-"))
    return { targetField: "components", sourceField: "screen", sourceIsArray: false };
  // component → service
  if (sourceHandle.startsWith("to-service-"))
    return { targetField: "services", sourceField: "components", sourceIsArray: true };
  // service → endpoint (request)
  if (sourceHandle.startsWith("to-ep-req-"))
    return { targetField: "endpoints", sourceField: "services", sourceIsArray: true };
  // service → component (data response)
  if (sourceHandle.startsWith("data-out-"))
    return { targetField: "responseComponents", sourceField: "services", sourceIsArray: true };
  return null;
}

export async function createEntityForFlow(
  flowId: string,
  featureId: string,
  moduleId: string,
  entityType: "screen" | "component" | "service" | "endpoint",
  defaultLabel: string,
  sourceHandle: string,
  sourceEntityId: string, // raw entity ID (not nid), or actor name for actors
): Promise<{ id: string; nidPrefix: string }> {
  // 1. Create the entity in the DB
  let newId: string;
  const nidPrefixMap: Record<string, string> = {
    screen: "screen", component: "comp", service: "service", endpoint: "ep",
  };

  switch (entityType) {
    case "screen": {
      const e = await prisma.screen.create({
        data: { moduleId, name: defaultLabel, route: "", purpose: "", components: "[]" },
      });
      newId = e.id;
      break;
    }
    case "component": {
      const e = await prisma.component.create({
        data: { name: defaultLabel, type: "ui", purpose: "", services: "[]" },
      });
      newId = e.id;
      break;
    }
    case "service": {
      const e = await prisma.service.create({
        data: { name: defaultLabel, purpose: "", endpoints: "[]", moduleId },
      });
      newId = e.id;
      break;
    }
    case "endpoint": {
      const e = await prisma.endpoint.create({
        data: { path: "/endpoint", method: "GET", purpose: "", requestEntities: "[]", responseEntities: "[]" },
      });
      newId = e.id;
      break;
    }
  }

  // 2. Find matching steps and append entity ID
  const mapping = handleToField(sourceHandle);
  if (mapping) {
    const steps = await prisma.flowStep.findMany({ where: { flowId } });

    for (const step of steps) {
      // Check if this step references the source entity
      let matches = false;
      if (mapping.sourceIsArray) {
        matches = parseJsonArr(step[mapping.sourceField] as string | null).includes(sourceEntityId);
      } else {
        // For actor, sourceEntityId is the actor name; for screen, it's an ID
        const fieldVal = step[mapping.sourceField] as string | null;
        if (mapping.sourceField === "actor") {
          matches = (fieldVal ?? "Usuario") === sourceEntityId;
        } else {
          matches = fieldVal === sourceEntityId;
        }
      }
      if (!matches) continue;

      // Append the new entity ID to the target field
      if (mapping.targetField === "screen") {
        // Screen is a single value — only set if null
        if (!step.screen) {
          await prisma.flowStep.update({
            where: { id: step.id },
            data: { screen: newId },
          });
        }
      } else {
        // Array field — append
        const arr = parseJsonArr(step[mapping.targetField] as string | null);
        if (!arr.includes(newId)) {
          arr.push(newId);
          await prisma.flowStep.update({
            where: { id: step.id },
            data: { [mapping.targetField]: JSON.stringify(arr) },
          });
        }
      }
    }
  }

  revalidatePath(`/features/${featureId}`);
  return { id: newId, nidPrefix: nidPrefixMap[entityType] };
}

// ─── Remove entity from ALL steps in a flow ──────────────────────────────────
// Removes every reference to the entity across all steps. Does NOT delete the
// entity itself from the DB — only unlinks it from the flow.
export async function removeEntityFromFlow(
  flowId: string,
  featureId: string,
  entityType: "actor" | "screen" | "component" | "service" | "endpoint",
  entityId: string, // entity DB ID, or actor name for actors
): Promise<void> {
  const steps = await prisma.flowStep.findMany({ where: { flowId } });

  for (const step of steps) {
    const updates: Record<string, string | null> = {};

    if (entityType === "actor") {
      if ((step.actor ?? "Usuario") === entityId) {
        updates.actor = null;
      }
    }

    if (entityType === "screen") {
      if (step.screen === entityId) {
        updates.screen = null;
      }
    }

    // Remove from array fields
    const arrayFields: { field: string; types: string[] }[] = [
      { field: "components",         types: ["component"] },
      { field: "services",           types: ["service"] },
      { field: "endpoints",          types: ["endpoint"] },
      { field: "responseComponents", types: ["component"] },
    ];

    for (const { field, types } of arrayFields) {
      if (!types.includes(entityType)) continue;
      const arr = parseJsonArr(step[field as keyof typeof step] as string | null);
      const filtered = arr.filter((id) => id !== entityId);
      if (filtered.length !== arr.length) {
        updates[field] = filtered.length ? JSON.stringify(filtered) : null;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.flowStep.update({ where: { id: step.id }, data: updates });
    }
  }

  revalidatePath(`/features/${featureId}`);
}
