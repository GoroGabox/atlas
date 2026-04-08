import { prisma } from "@/lib/prisma";
import { updateModule, deleteModule } from "@/lib/actions/modules";
import ModuleForm from "@/components/ModuleForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await prisma.module.findUnique({ where: { id } });
  if (!mod) notFound();

  const update = updateModule.bind(null, id);
  const remove = deleteModule.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
        <span>/</span>
        <Link href={`/modules/${id}`} className="hover:text-gray-300 transition-colors">{mod.name}</Link>
        <span>/</span>
        <span className="text-gray-300">Editar</span>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editar módulo</h1>
          <p className="text-gray-400 mt-1 text-sm">{mod.name}</p>
        </div>
        <DeleteButton action={remove} label="Eliminar módulo" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <ModuleForm action={update} module={mod} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}