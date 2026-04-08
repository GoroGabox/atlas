import { prisma } from "@/lib/prisma";
import KnowledgeGraphView from "@/components/knowledge/KnowledgeGraphView";

export type OwnerEntry = { id: string; name: string; role: "pm" | "tech" };
export type Person     = {
  name:     string;
  modules:  OwnerEntry[];
  features: OwnerEntry[];
};

export default async function KnowledgePage() {
  const modules = await prisma.module.findMany({
    include: { features: true },
    orderBy: { createdAt: "asc" },
  });

  const peopleMap = new Map<string, { modules: OwnerEntry[]; features: OwnerEntry[] }>();

  function ensurePerson(owner: string) {
    if (!peopleMap.has(owner)) peopleMap.set(owner, { modules: [], features: [] });
    return peopleMap.get(owner)!;
  }

  for (const mod of modules) {
    if (mod.pmOwner) {
      const p = ensurePerson(mod.pmOwner);
      if (!p.modules.find((m) => m.id === mod.id && m.role === "pm"))
        p.modules.push({ id: mod.id, name: mod.name, role: "pm" });
    }
    if (mod.techOwner && mod.techOwner !== mod.pmOwner) {
      const p = ensurePerson(mod.techOwner);
      if (!p.modules.find((m) => m.id === mod.id && m.role === "tech"))
        p.modules.push({ id: mod.id, name: mod.name, role: "tech" });
    } else if (mod.techOwner && mod.techOwner === mod.pmOwner) {
      // Misma persona: agregar rol tech a la entrada existente si no está
      const p = ensurePerson(mod.techOwner);
      if (!p.modules.find((m) => m.id === mod.id && m.role === "tech"))
        p.modules.push({ id: mod.id, name: mod.name, role: "tech" });
    }

    for (const feat of mod.features) {
      if (feat.pmOwner) {
        const p = ensurePerson(feat.pmOwner);
        if (!p.features.find((f) => f.id === feat.id && f.role === "pm"))
          p.features.push({ id: feat.id, name: feat.name, role: "pm" });
      }
      if (feat.techOwner) {
        const p = ensurePerson(feat.techOwner);
        if (!p.features.find((f) => f.id === feat.id && f.role === "tech"))
          p.features.push({ id: feat.id, name: feat.name, role: "tech" });
      }
    }
  }

  const people: Person[] = Array.from(peopleMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) =>
      b.modules.length + b.features.length - (a.modules.length + a.features.length)
    );

  return <KnowledgeGraphView people={people} />;
}