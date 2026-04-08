import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExportButton from "@/components/ExportButton";

const riskColor: Record<string, string> = {
  low: "text-green-400 bg-green-400/10 border-green-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-red-400 bg-red-400/10 border-red-400/20",
};

const docColor: Record<string, string> = {
  none: "text-red-400 bg-red-400/10 border-red-400/20",
  partial: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  complete: "text-green-400 bg-green-400/10 border-green-400/20",
};

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [mod, history] = await Promise.all([
    prisma.module.findUnique({ where: { id }, include: { features: true } }),
    prisma.moduleHistory.findMany({
      where:   { moduleId: id },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
  ]);

  if (!mod) notFound();

  // Campos que muestran label amigable
  const fieldLabels: Record<string, string> = {
    name: "Nombre", description: "Descripción", domain: "Dominio",
    criticality: "Criticidad", riskLevel: "Riesgo",
    documentationStatus: "Documentación", pmOwner: "Owner PM", techOwner: "Owner Tech",
  };

  function diffSnapshot(prev: Record<string,unknown>, next: Record<string,unknown>) {
    return Object.keys(next).filter((k) => prev[k] !== next[k]).map((k) => ({
      field: fieldLabels[k] ?? k,
      from:  String(prev[k] ?? "—"),
      to:    String(next[k] ?? "—"),
    }));
  }

  return (
    <div className="space-y-8 px-6 py-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
        <span>/</span>
        <span className="text-gray-300">{mod.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{mod.name}</h1>
          <p className="text-gray-400 mt-1">{mod.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/modules/${mod.id}/edit`}
            className="text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-1.5 rounded-lg transition-colors"
          >
            Editar
          </Link>
          <ExportButton type="module" id={mod.id} name={mod.name} />
          <div className="flex gap-2 shrink-0">
            <span className={`text-xs px-3 py-1 rounded-full font-medium border ${riskColor[mod.riskLevel]}`}>
              riesgo: {mod.riskLevel}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium border ${docColor[mod.documentationStatus]}`}>
              doc: {mod.documentationStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Dominio", value: mod.domain },
          { label: "Criticidad", value: mod.criticality },
          { label: "Owner PM", value: mod.pmOwner ?? "—" },
          { label: "Owner Tech", value: mod.techOwner ?? "—" },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-medium text-white mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Historial de cambios — siempre visible */}
      <details className="bg-gray-900 border border-gray-800 rounded-lg group">
        <summary className="flex items-center justify-between px-5 py-3 cursor-pointer select-none">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Historial de cambios
            <span className="ml-2 text-xs font-normal text-gray-500 normal-case">
              ({history.length} {history.length === 1 ? "versión" : "versiones"})
            </span>
          </h2>
          <span className="text-gray-600 text-xs group-open:hidden">▶ Expandir</span>
          <span className="text-gray-600 text-xs hidden group-open:inline">▼ Contraer</span>
        </summary>

        <div className="px-5 pb-5">
          {history.length === 0 ? (
            <p className="text-xs text-gray-600 italic py-2">
              Sin cambios registrados aún. El historial se genera automáticamente cada vez que editas el módulo.
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-800" />
              <div className="space-y-4 pl-8">
                {history.map((h, idx) => {
                  let prev: Record<string, unknown> = {};
                  let curr: Record<string, unknown> = {};
                  try { prev = JSON.parse(h.snapshot) as Record<string, unknown>; } catch {}
                  const nextH = history[idx + 1];
                  if (nextH) {
                    try { curr = JSON.parse(nextH.snapshot) as Record<string, unknown>; } catch {}
                  }
                  const diffs = idx < history.length - 1 ? diffSnapshot(curr, prev) : [];

                  return (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
                      <div className="bg-gray-800/40 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 mb-2">
                          {new Date(h.createdAt).toLocaleString("es-CL", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                          {idx === 0 && <span className="ml-2 text-blue-400 font-medium">← más reciente</span>}
                        </p>
                        {diffs.length > 0 ? (
                          <div className="space-y-1">
                            {diffs.map((d, di) => (
                              <div key={di} className="flex items-start gap-2 text-xs">
                                <span className="text-gray-500 shrink-0 w-24 truncate">{d.field}</span>
                                <span className="text-red-400/70 line-through truncate max-w-[120px]">{d.from}</span>
                                <span className="text-gray-600 shrink-0">→</span>
                                <span className="text-green-400 truncate max-w-[120px]">{d.to}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 italic">
                            {idx === history.length - 1 ? "Estado inicial registrado" : "Sin cambios detectados"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Features */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Features ({mod.features.length})
          </h2>
          <Link
            href={`/features/new?moduleId=${mod.id}`}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            + Nueva feature
          </Link>
        </div>
        {mod.features.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin features documentadas aún.</p>
        ) : (
          <div className="space-y-3">
            {mod.features.map((feature: { name: string; id: string, businessGoal: string, riskLevel: string, documentationStatus: string }) => (
              <div key={feature.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{feature.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{feature.businessGoal}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor[feature.riskLevel]}`}>
                    {feature.riskLevel}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docColor[feature.documentationStatus]}`}>
                    {feature.documentationStatus}
                  </span>
                  <Link
                    href={`/features/${feature.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}