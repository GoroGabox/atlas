import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FeatureGraphView from "@/components/feature/FeatureGraphView";
import type { EntityCatalog } from "@/lib/types/entities";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [feature, screenRows, componentRows, serviceRows, endpointRows] =
    await Promise.all([
      prisma.feature.findUnique({
        where: { id },
        include: {
          module: true,
          flows: { include: { steps: { orderBy: { order: "asc" } } } },
        },
      }),
      prisma.screen.findMany({
        select:  { id: true, name: true, route: true, moduleId: true, module: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.component.findMany({
        select:  { id: true, name: true, type: true, purpose: true },
        orderBy: { name: "asc" },
      }),
      prisma.service.findMany({
        select:  { id: true, name: true, purpose: true, moduleId: true },
        orderBy: { name: "asc" },
      }),
      prisma.endpoint.findMany({
        select:  { id: true, method: true, path: true, purpose: true, requestEntities: true, responseEntities: true },
        orderBy: { path: "asc" },
      }),
    ]);

  if (!feature) notFound();

  const flow = feature.flows[0] ?? null;

  const featureData = {
    id:                  feature.id,
    name:                feature.name,
    businessGoal:        feature.businessGoal,
    riskLevel:           feature.riskLevel,
    documentationStatus: feature.documentationStatus,
    busFactor:           feature.busFactor,
    pmOwner:             feature.pmOwner,
    techOwner:           feature.techOwner,
    technicalComplexity: feature.technicalComplexity,
    businessComplexity:  feature.businessComplexity,
    moduleId:            feature.moduleId,
    moduleName:          feature.module.name,
  };

  const catalog: EntityCatalog = {
    screens:    screenRows.map((r) => ({ id: r.id, name: r.name, route: r.route, moduleId: r.moduleId, moduleName: r.module.name })),
    components: componentRows,
    services:   serviceRows,
    endpoints:  endpointRows,
  };

  return (
    <FeatureGraphView
      feature={featureData}
      flow={flow}
      catalog={catalog}
    />
  );
}
