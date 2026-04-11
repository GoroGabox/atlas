import { prisma } from "@/lib/prisma";
import DependencyGraphView from "@/components/dependencies/DependencyGraphView";

type ModRow      = { id: string; name: string; domain: string; riskLevel: string };
type FeatRow     = { id: string; name: string; moduleId: string; riskLevel: string; technicalComplexity: string };
type NameRow     = { id: string; name: string };
type EndpRow     = { id: string; path: string };
type StepRow     = { services: string | null; flowId: string };
type FlowRow     = { id: string; feature: { moduleId: string } };

export default async function DependenciesPage() {
  const [modules, features, screens, components, services, endpoints, relations]: [
    ModRow[], FeatRow[], NameRow[], NameRow[], NameRow[], EndpRow[],
    Awaited<ReturnType<typeof prisma.relation.findMany>>
  ] = await Promise.all([
    prisma.module.findMany({ select: { id: true, name: true, domain: true, riskLevel: true } }),
    prisma.feature.findMany({ select: { id: true, name: true, moduleId: true, riskLevel: true, technicalComplexity: true } }),
    prisma.screen.findMany({ select: { id: true, name: true } }),
    prisma.component.findMany({ select: { id: true, name: true } }),
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.endpoint.findMany({ select: { id: true, path: true } }),
    prisma.relation.findMany(),
  ]);

  // Servicios compartidos: usados por ≥2 módulos distintos en FlowSteps
  // Dos queries planas para evitar el límite de profundidad de joins en Prisma/SQLite
  const [rawSteps, rawFlows]: [StepRow[], FlowRow[]] = await Promise.all([
    prisma.flowStep.findMany({
      where:  { NOT: { services: null } },
      select: { services: true, flowId: true },
    }),
    prisma.flow.findMany({
      select: { id: true, feature: { select: { moduleId: true } } },
    }),
  ]);

  const flowModuleMap = new Map(rawFlows.map((f) => [f.id, f.feature.moduleId]));

  // Para cada servicio, contar módulos únicos que lo usan
  const serviceModules = new Map<string, Set<string>>();
  for (const step of rawSteps) {
    if (!step.services) continue;
    const modId = flowModuleMap.get(step.flowId);
    if (!modId) continue;
    try {
      const ids = JSON.parse(step.services) as string[];
      for (const id of ids) {
        if (!serviceModules.has(id)) serviceModules.set(id, new Set());
        serviceModules.get(id)!.add(modId);
      }
    } catch { /* ignorar */ }
  }

  // Solo los que aparecen en ≥2 módulos
  const sharedServiceIds = new Set(
    [...serviceModules.entries()]
      .filter(([, mods]) => mods.size >= 2)
      .map(([id]) => id)
  );

  const entities = [
    ...modules.map((m) => ({ id: m.id, name: m.name,  type: "module"    })),
    ...features.map((f) => ({ id: f.id, name: f.name,  type: "feature"   })),
    ...screens.map((s)  => ({ id: s.id, name: s.name,  type: "screen"    })),
    ...components.map((c) => ({ id: c.id, name: c.name, type: "component" })),
    ...services.map((s) => ({ id: s.id, name: s.name,  type: "service"   })),
    ...endpoints.map((e) => ({ id: e.id, name: e.path,  type: "endpoint"  })),
  ];

  // Construir relaciones sintéticas: módulo → "usa" → servicio compartido
  const sharedServices = services.filter((s) => sharedServiceIds.has(s.id));
  const syntheticRelations = sharedServices.flatMap((svc) => {
    const usedByModules = serviceModules.get(svc.id) ?? new Set<string>();
    return [...usedByModules].map((modId) => ({
      id:           `synthetic-${svc.id}-${modId}`,
      fromType:     "module",
      fromId:       modId,
      relationType: "uses",
      toType:       "service",
      toId:         svc.id,
    }));
  });

  return (
    <DependencyGraphView
      modules={modules}
      features={features}
      relations={[...relations, ...syntheticRelations]}
      entities={entities}
      sharedServiceIds={sharedServiceIds}
    />
  );
}