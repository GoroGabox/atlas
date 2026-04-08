import { prisma } from "@/lib/prisma";
import {
  createScreen, createComponent, createService, createEndpoint,
} from "@/lib/actions/entities";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import Link from "next/link";

const componentTypes = [
  { value: "page",      label: "Page"      },
  { value: "component", label: "Component" },
  { value: "widget",    label: "Widget"    },
  { value: "modal",     label: "Modal"     },
  { value: "toolbar",   label: "Toolbar"   },
];

const httpMethods = [
  { value: "GET",    label: "GET"    },
  { value: "POST",   label: "POST"   },
  { value: "PUT",    label: "PUT"    },
  { value: "DELETE", label: "DELETE" },
];

// Mapeo tab → type
const tabToType: Record<string, string> = {
  screens:    "screen",
  components: "component",
  services:   "service",
  endpoints:  "endpoint",
};

const titles: Record<string, string> = {
  screen:    "Nueva screen",
  component: "Nuevo componente",
  service:   "Nuevo servicio",
  endpoint:  "Nuevo endpoint",
};

export default async function NewEntityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  // Acepta tanto "screen" como "screens"
  const raw  = params.type ?? "screen";
  const type = tabToType[raw] ?? raw;

  const modules = await prisma.module.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const backTab = type + "s";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/entities?tab=${backTab}`} className="hover:text-gray-300 transition-colors">
          Entidades
        </Link>
        <span>/</span>
        <span className="text-gray-300">{titles[type] ?? "Nueva entidad"}</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">{titles[type] ?? "Nueva entidad"}</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">

        {/* Selector de tipo si no viene en la URL */}
        {!["screen","component","service","endpoint"].includes(type) && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-400">¿Qué tipo de entidad quieres crear?</p>
            <div className="grid grid-cols-2 gap-3">
              {["screen","component","service","endpoint"].map((t) => (
                <Link
                  key={t}
                  href={`/entities/new?type=${t}`}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 font-medium transition-colors text-center"
                >
                  {titles[t]}
                </Link>
              ))}
            </div>
          </div>
        )}

        {type === "screen" && (
          <form action={createScreen} className="space-y-5">
            <FormField label="Módulo" name="moduleId" required>
              <Select name="moduleId" required options={modules.map((m) => ({ value: m.id, label: m.name }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre" name="name" required>
                <Input name="name" required placeholder="Ej: Dashboard" />
              </FormField>
              <FormField label="Ruta" name="route">
                <Input name="route" placeholder="/dashboard" />
              </FormField>
            </div>
            <FormField label="Propósito" name="purpose" required>
              <Textarea name="purpose" required rows={2} placeholder="¿Para qué sirve esta pantalla?" />
            </FormField>
            <FormField label="Componentes" name="components" hint='JSON array: ["A","B"]'>
              <Input name="components" defaultValue="[]" placeholder='["ReportGrid","FilterPanel"]' />
            </FormField>
            <div className="flex justify-end">
              <SubmitButton label="Crear screen" />
            </div>
          </form>
        )}

        {type === "component" && (
          <form action={createComponent} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre" name="name" required>
                <Input name="name" required placeholder="Ej: ReportGrid" />
              </FormField>
              <FormField label="Tipo" name="type" required>
                <Select name="type" required options={componentTypes} />
              </FormField>
            </div>
            <FormField label="Propósito" name="purpose" required>
              <Textarea name="purpose" required rows={2} placeholder="¿Para qué sirve este componente?" />
            </FormField>
            <FormField label="Servicios" name="services" hint='JSON array: ["A","B"]'>
              <Input name="services" defaultValue="[]" placeholder='["ReportService"]' />
            </FormField>
            <div className="flex justify-end">
              <SubmitButton label="Crear componente" />
            </div>
          </form>
        )}

        {type === "service" && (
          <form action={createService} className="space-y-5">
            <FormField label="Módulo" name="moduleId" hint="Módulo al que pertenece este servicio frontend">
              <Select
                name="moduleId"
                options={[
                  { value: "", label: "Sin módulo asignado" },
                  ...modules.map((m) => ({ value: m.id, label: m.name })),
                ]}
              />
            </FormField>
            <FormField label="Nombre" name="name" required>
              <Input name="name" required placeholder="Ej: ReportService" />
            </FormField>
            <FormField label="Propósito" name="purpose" required>
              <Textarea name="purpose" required rows={2} placeholder="¿Para qué sirve este servicio?" />
            </FormField>
            <FormField label="Endpoints" name="endpoints" hint='JSON array: ["A","B"]'>
              <Input name="endpoints" defaultValue="[]" placeholder='["GET /reports","POST /export"]' />
            </FormField>
            <div className="flex justify-end">
              <SubmitButton label="Crear servicio" />
            </div>
          </form>
        )}

        {type === "endpoint" && (
          <form action={createEndpoint} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Método" name="method" required>
                <Select name="method" required options={httpMethods} />
              </FormField>
              <FormField label="Path" name="path" required>
                <Input name="path" required placeholder="/api/reports" />
              </FormField>
            </div>
            <FormField label="Propósito" name="purpose" required>
              <Textarea name="purpose" required rows={2} placeholder="¿Qué hace este endpoint?" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Entidades request" name="requestEntities" hint="JSON array">
                <Input name="requestEntities" defaultValue="[]" placeholder='["FilterParams"]' />
              </FormField>
              <FormField label="Entidades response" name="responseEntities" hint="JSON array">
                <Input name="responseEntities" defaultValue="[]" placeholder='["ReportData"]' />
              </FormField>
            </div>
            <div className="flex justify-end">
              <SubmitButton label="Crear endpoint" />
            </div>
          </form>
        )}

      </div>
    </div>
  );
}