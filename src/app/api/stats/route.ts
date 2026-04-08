import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalModules,
      totalFeatures,
      featuresWithoutDocs,
      highRiskFeatures,
      lowBusFactorFeatures,
      modulesByRisk,
    ] = await Promise.all([
      prisma.module.count(),
      prisma.feature.count(),
      prisma.feature.count({ where: { documentationStatus: "none" } }),
      prisma.feature.count({ where: { riskLevel: "high" } }),
      prisma.feature.count({ where: { busFactor: { lte: 1 } } }),
      prisma.module.groupBy({
        by: ["riskLevel"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      totalModules,
      totalFeatures,
      featuresWithoutDocs,
      highRiskFeatures,
      lowBusFactorFeatures,
      modulesByRisk,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener stats" }, { status: 500 });
  }
}