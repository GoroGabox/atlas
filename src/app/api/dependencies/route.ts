import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [modules, features, relations] = await Promise.all([
      prisma.module.findMany({ select: { id: true, name: true, domain: true, riskLevel: true } }),
      prisma.feature.findMany({ select: { id: true, name: true, moduleId: true, riskLevel: true, technicalComplexity: true } }),
      prisma.relation.findMany(),
    ]);
    return NextResponse.json({ modules, features, relations });
  } catch {
    return NextResponse.json({ error: "Error al obtener dependencias" }, { status: 500 });
  }
}