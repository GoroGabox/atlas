import { prisma } from "@/lib/prisma";
import { createFeature } from "@/lib/actions/features";
import FeatureForm from "@/components/FeatureForm";
import Link from "next/link";

export default async function NewFeaturePage({
  searchParams,
}: {
  searchParams: Promise<{ moduleId?: string }>;
}) {
  const { moduleId } = await searchParams;
  const modules = await prisma.module.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
        <span>/</span>
        <span className="text-gray-300">Nueva feature</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">Nueva feature</h1>
        <p className="text-gray-400 mt-1 text-sm">Completa los datos de la feature</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <FeatureForm
          action={createFeature}
          modules={modules}
          selectedModuleId={moduleId}
          submitLabel="Crear feature"
        />
      </div>
    </div>
  );
}