import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const modules = await prisma.module.findMany({
      include: { features: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(modules);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener módulos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newModule = await prisma.module.create({ data: body });
    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear módulo" }, { status: 500 });
  }
}