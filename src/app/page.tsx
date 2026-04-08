import { prisma } from "@/lib/prisma";
import { calcModuleScore, calcGlobalScore } from "@/lib/healthScore";
import HealthScoreCard from "@/components/HealthScoreCard";
import Link from "next/link";

async function getStats() {
  const [
    totalModules, totalFeatures, featuresWithoutDocs,
    highRiskFeatures, lowBusFactorFeatures, recentFeatures, modules,
  ] = await Promise.all([
    prisma.module.count(),
    prisma.feature.count(),
    prisma.feature.count({ where: { documentationStatus: "none" } }),
    prisma.feature.count({ where: { riskLevel: "high" } }),
    prisma.feature.count({ where: { busFactor: { lte: 1 } } }),
    prisma.feature.findMany({
      take: 5, orderBy: { createdAt: "desc" }, include: { module: true },
    }),
    prisma.module.findMany({ include: { features: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const scores      = modules.map(calcModuleScore);
  const globalScore = calcGlobalScore(scores);

  return {
    totalModules, totalFeatures, featuresWithoutDocs,
    highRiskFeatures, lowBusFactorFeatures, recentFeatures,
    modules, scores, globalScore,
  };
}

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

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8 px-6 py-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Vista general del estado del producto</p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Módulos", value: stats.totalModules, color: "text-blue-400" },
          { label: "Features", value: stats.totalFeatures, color: "text-purple-400" },
          { label: "Sin documentar", value: stats.featuresWithoutDocs, color: "text-red-400" },
          { label: "Alto riesgo", value: stats.highRiskFeatures, color: "text-orange-400" },
          { label: "Bus factor crítico", value: stats.lowBusFactorFeatures, color: "text-yellow-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Módulos */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Módulos
          </h2>
          <div className="space-y-3">
            {stats.modules.map((mod: { name: string; riskLevel: string; documentationStatus: string, id: string, domain: string, features: { name: string; id: string }[] }) => (
              <Link href={`/modules/${mod.id}`} key={mod.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 hover:bg-gray-700/10 hover:rounded-lg hover:cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">{mod.name}</p>
                  <p className="text-xs text-gray-500">{mod.domain} · {mod.features.length} features</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor[mod.riskLevel]}`}>
                    {mod.riskLevel}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docColor[mod.documentationStatus]}`}>
                    {mod.documentationStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features recientes */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Features recientes
          </h2>
          <div className="space-y-3">
            {stats.recentFeatures.map((feature: { name: string; module: { name: string }, riskLevel: string, businessGoal: string, id: string }) => (
              <Link href={`/features/${feature.id}`} key={feature.id} className="mb-1">
                <div className="py-2 border-b border-gray-800 last:border-0 hover:bg-gray-700/10 hover:rounded-lg hover:cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{feature.name}</p>
                      <p className="text-xs text-gray-500">{feature.module.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${riskColor[feature.riskLevel]}`}>
                      {feature.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{feature.businessGoal}</p>
                </div>              
              </Link>
            ))}
          </div>
        </div>
      </div>      

      {/* Health score global */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Health score</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Score global: <span className={`font-bold ${
                stats.globalScore >= 85 ? "text-green-400" :
                stats.globalScore >= 70 ? "text-blue-400"  :
                stats.globalScore >= 55 ? "text-yellow-400": "text-red-400"
              }`}>{stats.globalScore}/100</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.scores.map((s) => (
            <Link key={s.moduleId} href={`/modules/${s.moduleId}`} className="block hover:opacity-90 transition-opacity">
              <HealthScoreCard
                name={s.moduleName}
                score={s.score}
                grade={s.grade}
                breakdown={s.breakdown}
                alerts={s.alerts}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}