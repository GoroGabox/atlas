import { prisma } from "@/lib/prisma";
import { updateFeature, deleteFeature } from "@/lib/actions/features";
import FeatureForm from "@/components/FeatureForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditFeaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [feature, modules] = await Promise.all([
    prisma.feature.findUnique({ where: { id } }),
    prisma.module.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!feature) notFound();

  const update = updateFeature.bind(null, id, feature.moduleId);
  const remove = deleteFeature.bind(null, id, feature.moduleId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
        <span>/</span>
        <Link href={`/modules/${feature.moduleId}`} className="hover:text-gray-300 transition-colors">
          Módulo
        </Link>
        <span>/</span>
        <Link href={`/features/${id}`} className="hover:text-gray-300 transition-colors">{feature.name}</Link>
        <span>/</span>
        <span className="text-gray-300">Editar</span>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editar feature</h1>
          <p className="text-gray-400 mt-1 text-sm">{feature.name}</p>
        </div>
        <DeleteButton action={remove} label="Eliminar feature" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <FeatureForm
          action={update}
          feature={feature}
          modules={modules}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}