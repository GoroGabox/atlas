import { createModule } from "@/lib/actions/modules";
import ModuleForm from "@/components/ModuleForm";
import Link from "next/link";

export default function NewModulePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/modules" className="hover:text-gray-300 transition-colors">Módulos</Link>
        <span>/</span>
        <span className="text-gray-300">Nuevo</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">Nuevo módulo</h1>
        <p className="text-gray-400 mt-1 text-sm">Completa los datos del módulo</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <ModuleForm action={createModule} submitLabel="Crear módulo" />
      </div>
    </div>
  );
}