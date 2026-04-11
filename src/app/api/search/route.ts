import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ModuleRow   = { id: string; name: string; domain: string; description: string };
type FeatureRow  = { id: string; name: string; moduleId: string; businessGoal: string };
type ScreenRow   = { id: string; name: string; route: string | null; moduleId: string };
type ServiceRow  = { id: string; name: string; purpose: string };
type EndpointRow = { id: string; path: string; method: string; purpose: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() ?? "";

  if (!q || q.length < 2) return NextResponse.json([]);

  const [modules, features, screens, services, endpoints]: [ModuleRow[], FeatureRow[], ScreenRow[], ServiceRow[], EndpointRow[]] =
    await Promise.all([
      prisma.module.findMany({ select: { id: true, name: true, domain: true, description: true } }),
      prisma.feature.findMany({ select: { id: true, name: true, moduleId: true, businessGoal: true } }),
      prisma.screen.findMany({ select: { id: true, name: true, route: true, moduleId: true } }),
      prisma.service.findMany({ select: { id: true, name: true, purpose: true } }),
      prisma.endpoint.findMany({ select: { id: true, path: true, method: true, purpose: true } }),
    ]);

  type Result = {
    id: string; type: string; label: string;
    sublabel: string; href: string; score: number;
  };

  function score(text: string, q: string) {
    if (text.toLowerCase().startsWith(q)) return 3;
    if (text.toLowerCase().includes(q))  return 2;
    return 0;
  }

  const results: Result[] = [];

  modules.forEach((m) => {
    const s = Math.max(score(m.name, q), score(m.domain, q), score(m.description, q));
    if (s) results.push({ id: m.id, type: "module", label: m.name, sublabel: m.domain, href: `/modules/${m.id}`, score: s + 2 });
  });

  features.forEach((f) => {
    const s = Math.max(score(f.name, q), score(f.businessGoal, q));
    if (s) results.push({ id: f.id, type: "feature", label: f.name, sublabel: f.businessGoal, href: `/features/${f.id}`, score: s + 1 });
  });

  screens.forEach((s) => {
    const sc = Math.max(score(s.name, q), score(s.route ?? "", q));
    if (sc) results.push({ id: s.id, type: "screen", label: s.name, sublabel: s.route ?? "", href: `/entities/${s.id}/edit?type=screen`, score: sc });
  });

  services.forEach((s) => {
    const sc = Math.max(score(s.name, q), score(s.purpose, q));
    if (sc) results.push({ id: s.id, type: "service", label: s.name, sublabel: s.purpose, href: `/entities/${s.id}/edit?type=service`, score: sc });
  });

  endpoints.forEach((e) => {
    const sc = Math.max(score(e.path, q), score(e.purpose, q));
    if (sc) results.push({ id: e.id, type: "endpoint", label: `${e.method} ${e.path}`, sublabel: e.purpose, href: `/entities/${e.id}/edit?type=endpoint`, score: sc });
  });

  return NextResponse.json(
    results.sort((a, b) => b.score - a.score).slice(0, 12)
  );
}