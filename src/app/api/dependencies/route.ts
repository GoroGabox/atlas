import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    type ModRow  = { id: string; name: string; domain: string; riskLevel: string };
    type FeatRow = { id: string; name: string; moduleId: string; riskLevel: string; technicalComplexity: string };
    const [modules, features, relations]: [ModRow[], FeatRow[], Awaited<ReturnType<typeof prisma.relation.findMany>>] =
      await Promise.all([
        prisma.module.findMany({ select: { id: true, name: true, domain: true, riskLevel: true } }),
        prisma.feature.findMany({ select: { id: true, name: true, moduleId: true, riskLevel: true, technicalComplexity: true } }),
        prisma.relation.findMany(),
      ]);
    return NextResponse.json({ modules, features, relations });
  } catch {
    return NextResponse.json({ error: "Error al obtener dependencias" }, { status: 500 });
  }
}