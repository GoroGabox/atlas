import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");

    const features = await prisma.feature.findMany({
      where: moduleId ? { moduleId } : undefined,
      include: { module: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(features);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener features" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const feature = await prisma.feature.create({ data: body });
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear feature" }, { status: 500 });
  }
}