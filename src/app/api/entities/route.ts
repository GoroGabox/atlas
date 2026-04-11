import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  CatalogScreen,
  CatalogComponent,
  CatalogService,
  CatalogEndpoint,
} from "@/lib/types/entities";

type ScreenRow = {
  id: string;
  name: string;
  route: string | null;
  moduleId: string | null;
  module: {
    name: string;
  };
};

type ComponentRow = {
  id: string;
  name: string;
  type: string | null;
  purpose: string | null;
};

type ServiceRow = {
  id: string;
  name: string;
  purpose: string | null;
  moduleId: string | null;
};

type EndpointRow = {
  id: string;
  method: string;
  path: string;
  purpose: string | null;
  requestEntities: string | null;
  responseEntities: string | null;
};

// GET /api/entities?type=screens|components|services|endpoints
// Opcional: &moduleId=xxx  → filtra screens y services por módulo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const moduleId = searchParams.get("moduleId") ?? undefined;

    if (type === "screens") {
      const rows: ScreenRow[] = await prisma.screen.findMany({
        where: moduleId ? { moduleId } : undefined,
        select: {
          id: true,
          name: true,
          route: true,
          moduleId: true,
          module: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });

      const data: CatalogScreen[] = rows.map((r: ScreenRow) => ({
        id: r.id,
        name: r.name,
        route: r.route,
        moduleId: r.moduleId ?? "",
        moduleName: r.module.name,
      }));

      return NextResponse.json(data);
    }

    if (type === "components") {
      const rows: ComponentRow[] = await prisma.component.findMany({
        select: { id: true, name: true, type: true, purpose: true },
        orderBy: { name: "asc" },
      });

      const data: CatalogComponent[] = rows.map((r) => ({
        id: r.id, name: r.name, type: r.type ?? "", purpose: r.purpose ?? "",
      }));
      return NextResponse.json(data);
    }

    if (type === "services") {
      const rows: ServiceRow[] = await prisma.service.findMany({
        where: moduleId ? { moduleId } : undefined,
        select: { id: true, name: true, purpose: true, moduleId: true },
        orderBy: { name: "asc" },
      });

      const data: CatalogService[] = rows.map((r) => ({
        id: r.id, name: r.name, purpose: r.purpose ?? "", moduleId: r.moduleId,
      }));
      return NextResponse.json(data);
    }

    if (type === "endpoints") {
      const rows: EndpointRow[] = await prisma.endpoint.findMany({
        select: {
          id: true,
          method: true,
          path: true,
          purpose: true,
          requestEntities: true,
          responseEntities: true,
        },
        orderBy: { path: "asc" },
      });

      const data: CatalogEndpoint[] = rows.map((r) => ({
        id: r.id, method: r.method, path: r.path,
        purpose: r.purpose ?? "",
        requestEntities: r.requestEntities ?? "[]",
        responseEntities: r.responseEntities ?? "[]",
      }));
      return NextResponse.json(data);
    }

    // Sin type: devuelve todo el catálogo en un solo request
    const [screenRows, componentRows, serviceRows, endpointRows]: [
      ScreenRow[],
      ComponentRow[],
      ServiceRow[],
      EndpointRow[]
    ] = await Promise.all([
      prisma.screen.findMany({
        where: moduleId ? { moduleId } : undefined,
        select: {
          id: true,
          name: true,
          route: true,
          moduleId: true,
          module: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.component.findMany({
        select: { id: true, name: true, type: true, purpose: true },
        orderBy: { name: "asc" },
      }),
      prisma.service.findMany({
        where: moduleId ? { moduleId } : undefined,
        select: { id: true, name: true, purpose: true, moduleId: true },
        orderBy: { name: "asc" },
      }),
      prisma.endpoint.findMany({
        select: {
          id: true,
          method: true,
          path: true,
          purpose: true,
          requestEntities: true,
          responseEntities: true,
        },
        orderBy: { path: "asc" },
      }),
    ]);

    return NextResponse.json({
      screens: screenRows.map((r: ScreenRow) => ({
        id: r.id,
        name: r.name,
        route: r.route,
        moduleId: r.moduleId,
        moduleName: r.module.name,
      })),
      components: componentRows,
      services: serviceRows,
      endpoints: endpointRows.map((r) => ({
        id: r.id, method: r.method, path: r.path,
        purpose: r.purpose ?? "",
        requestEntities: r.requestEntities ?? "[]",
        responseEntities: r.responseEntities ?? "[]",
      })),
    });
  } catch (error) {
    console.error("[api/entities] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener catálogo de entidades" },
      { status: 500 }
    );
  }
}