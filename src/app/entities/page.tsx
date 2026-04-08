import { prisma } from "@/lib/prisma";
import Link from "next/link";

const methodColor: Record<string, string> = {
  GET:    "text-green-400  bg-green-400/10  border-green-400/20",
  POST:   "text-blue-400   bg-blue-400/10   border-blue-400/20",
  PUT:    "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  DELETE: "text-red-400    bg-red-400/10    border-red-400/20",
};

const componentTypeColor: Record<string, string> = {
  page:      "text-indigo-400 bg-indigo-400/10",
  component: "text-blue-400   bg-blue-400/10",
  widget:    "text-cyan-400   bg-cyan-400/10",
  modal:     "text-purple-400 bg-purple-400/10",
  toolbar:   "text-orange-400 bg-orange-400/10",
};

function toArray(json: string): string[] {
  try { return JSON.parse(json) as string[]; }
  catch { return []; }
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "screens" } = await searchParams;

  const [screens, components, services, endpoints, rawSteps, rawFlows] = await Promise.all([
    prisma.screen.findMany({ include: { module: true }, orderBy: { name: "asc" } }),
    prisma.component.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ include: { module: true }, orderBy: { name: "asc" } }),
    prisma.endpoint.findMany({ orderBy: { path: "asc" } }),
    // Dos queries simples en lugar de un select anidado 4 niveles
    prisma.flowStep.findMany({
      where:  { NOT: { endpoints: null } },
      select: { endpoints: true, flowId: true },
    }),
    prisma.flow.findMany({
      select: { id: true, feature: { select: { moduleId: true, module: { select: { id: true, name: true } } } } },
    }),
  ]);

  // Mapa flowId → módulo
  const flowModMap = new Map(rawFlows.map((f) => [f.id, f.feature.module]));

  // Mapa endpointId → módulos únicos donde se llama
  const endpointModules = new Map<string, Map<string, string>>();
  for (const step of rawSteps) {
    if (!step.endpoints) continue;
    const mod = flowModMap.get(step.flowId);
    if (!mod) continue;
    try {
      const ids = JSON.parse(step.endpoints) as string[];
      for (const id of ids) {
        if (!endpointModules.has(id)) endpointModules.set(id, new Map());
        endpointModules.get(id)!.set(mod.id, mod.name);
      }
    } catch { /* JSON inválido — ignorar */ }
  }

  const tabs = [
    { key: "screens",    label: "Screens",    count: screens.length    },
    { key: "components", label: "Components", count: components.length },
    { key: "services",   label: "Services",   count: services.length   },
    { key: "endpoints",  label: "Endpoints",  count: endpoints.length  },
  ];

  return (
    <div className="space-y-6 px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Entidades técnicas</h1>
          <p className="text-gray-400 mt-1 text-sm">Screens, componentes, servicios y endpoints</p>
        </div>
        <Link
          href={`/entities/new?type=${tab}`}
          className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          + Nueva entidad
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/entities?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "text-white border-blue-500"
                : "text-gray-400 hover:text-gray-200 border-transparent"
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.key ? "bg-blue-500/20 text-blue-300" : "bg-gray-800 text-gray-500"
            }`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Screens */}
      {tab === "screens" && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Módulo</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Ruta</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Propósito</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {screens.map((s) => (
                <tr key={s.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{s.module.name}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{s.route ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-300 text-xs line-clamp-1">{s.purpose}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/entities/${s.id}/edit?type=screen`} className="text-xs text-blue-400 hover:text-blue-300">Editar</Link>
                  </td>
                </tr>
              ))}
              {screens.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">Sin screens registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Components */}
      {tab === "components" && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Propósito</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Servicios</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${componentTypeColor[c.type] ?? "text-gray-400 bg-gray-400/10"}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-300 text-xs line-clamp-1">{c.purpose}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{toArray(c.services).join(", ") || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/entities/${c.id}/edit?type=component`} className="text-xs text-blue-400 hover:text-blue-300">Editar</Link>
                  </td>
                </tr>
              ))}
              {components.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">Sin componentes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Services */}
      {tab === "services" && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Módulo</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Propósito</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Endpoints</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {s.module ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {s.module.name}
                      </span>
                    ) : <span className="text-gray-600">Global</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-300 text-xs line-clamp-1">{s.purpose}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{toArray(s.endpoints).join(", ") || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/entities/${s.id}/edit?type=service`} className="text-xs text-blue-400 hover:text-blue-300">Editar</Link>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">Sin servicios registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Endpoints */}
      {tab === "endpoints" && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Método</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Path</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Propósito</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Request → Response</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">Usado en</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => {
                const usedIn = Array.from(endpointModules.get(e.id)?.values() ?? []);
                return (
                  <tr key={e.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border ${methodColor[e.method] ?? "text-gray-400"}`}>
                        {e.method}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-200">{e.path}</td>
                    <td className="px-5 py-3 text-gray-300 text-xs line-clamp-1">{e.purpose}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {toArray(e.requestEntities).join(", ") || "—"}
                      {" → "}
                      {toArray(e.responseEntities).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {usedIn.length === 0 ? (
                        <span className="text-xs text-gray-600">Sin uso</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {usedIn.map((name) => (
                            <span key={name} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/entities/${e.id}/edit?type=endpoint`} className="text-xs text-blue-400 hover:text-blue-300">Editar</Link>
                    </td>
                  </tr>
                );
              })}
              {endpoints.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500 text-sm">Sin endpoints registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}