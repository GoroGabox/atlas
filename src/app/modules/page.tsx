import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Suspense } from "react";
import ModuleFilters from "@/components/ModuleFilters";

const riskColor: Record<string, string> = {
  low: "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high: "text-red-400 bg-red-400/10",
};

const docColor: Record<string, string> = {
  none: "text-red-400 bg-red-400/10",
  partial: "text-yellow-400 bg-yellow-400/10",
  complete: "text-green-400 bg-green-400/10",
};

const criticalityColor: Record<string, string> = {
  low: "text-gray-400 bg-gray-400/10",
  medium: "text-blue-400 bg-blue-400/10",
  high: "text-orange-400 bg-orange-400/10",
};

type SearchParams = {
  domain?: string;
  criticality?: string;
  riskLevel?: string;
  documentationStatus?: string;
  owner?: string;
};

export default async function ModulesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;

  // Datos para los filtros
  const allModules = await prisma.module.findMany({
    select: { domain: true, pmOwner: true, techOwner: true },
  });

  const domains = [...new Set(allModules.map((m) => m.domain).filter(Boolean))];
  const owners = [
    ...new Set(
      allModules
        .flatMap((m) => [m.pmOwner, m.techOwner])
        .filter((o): o is string => !!o)
    ),
  ];

  // Construir where con filtros activos
  const where: Record<string, unknown> = {};
  if (filters.domain)              where.domain              = filters.domain;
  if (filters.criticality)         where.criticality         = filters.criticality;
  if (filters.riskLevel)           where.riskLevel           = filters.riskLevel;
  if (filters.documentationStatus) where.documentationStatus = filters.documentationStatus;
  if (filters.owner) {
    where.OR = [
      { pmOwner: filters.owner },
      { techOwner: filters.owner },
    ];
  }

  const modules = await prisma.module.findMany({
    where,
    include: { features: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Módulos</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {modules.length} módulo{modules.length !== 1 ? "s" : ""}
            {Object.keys(filters).some((k) => filters[k as keyof SearchParams]) && " encontrados"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/modules/import"
            className="text-sm border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            ↑ Importar .md
          </Link>
          <Link
            href="/modules/new"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            + Nuevo módulo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Suspense fallback={null}>
        <ModuleFilters domains={domains} owners={owners} />
      </Suspense>

      {/* Tabla */}
      {modules.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-12 text-center">
          <p className="text-gray-500 text-sm">No hay módulos que coincidan con los filtros.</p>
          <Link href="/modules" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Módulo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dominio</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Features</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner PM</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner Tech</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Criticidad</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Riesgo</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Doc</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, i) => (
                <tr
                  key={mod.id}
                  className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors ${
                    i % 2 === 0 ? "" : "bg-gray-900/50"
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{mod.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{mod.description}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{mod.domain}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-purple-400 font-semibold">{mod.features.length}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{mod.pmOwner ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-300">{mod.techOwner ?? "—"}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${criticalityColor[mod.criticality]}`}>
                      {mod.criticality}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor[mod.riskLevel]}`}>
                      {mod.riskLevel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docColor[mod.documentationStatus]}`}>
                      {mod.documentationStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/modules/${mod.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}