import { prisma } from "@/lib/prisma";
import {
  updateScreen, deleteScreen,
  updateComponent, deleteComponent,
  updateService, deleteService,
  updateEndpoint, deleteEndpoint,
} from "@/lib/actions/entities";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function EditEntityPage({
  params, searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id }         = await params;
  const { type = "" }  = await searchParams;
  const modules: { id: string; name: string }[] = await prisma.module.findMany({
    select: { id: true, name: true }, orderBy: { name: "asc" },
  });

  if (type === "screen") {
    const entity = await prisma.screen.findUnique({ where: { id } });
    if (!entity) notFound();
    const update = updateScreen.bind(null, id);
    const remove = deleteScreen.bind(null, id);
    return (
      <EntityEditShell title={entity.name} backHref="/entities?tab=screens" deleteAction={remove}>
        <form action={update} className="space-y-5">
          <FormField label="Módulo" name="moduleId" required>
            <Select name="moduleId" defaultValue={entity.moduleId} required
              options={modules.map((m) => ({ value: m.id, label: m.name }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" name="name" required>
              <Input name="name" defaultValue={entity.name} required />
            </FormField>
            <FormField label="Ruta" name="route">
              <Input name="route" defaultValue={entity.route ?? ""} />
            </FormField>
          </div>
          <FormField label="Propósito" name="purpose" required>
            <Textarea name="purpose" defaultValue={entity.purpose} required rows={2} />
          </FormField>
          <FormField label="Componentes" name="components" hint="JSON array">
            <Input name="components" defaultValue={entity.components} />
          </FormField>
          <div className="flex justify-end"><SubmitButton label="Guardar cambios" /></div>
        </form>
      </EntityEditShell>
    );
  }

  if (type === "component") {
    const entity = await prisma.component.findUnique({ where: { id } });
    if (!entity) notFound();
    const update = updateComponent.bind(null, id);
    const remove = deleteComponent.bind(null, id);
    return (
      <EntityEditShell title={entity.name} backHref="/entities?tab=components" deleteAction={remove}>
        <form action={update} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" name="name" required>
              <Input name="name" defaultValue={entity.name} required />
            </FormField>
            <FormField label="Tipo" name="type" required>
              <Select name="type" defaultValue={entity.type} required options={componentTypes} />
            </FormField>
          </div>
          <FormField label="Propósito" name="purpose" required>
            <Textarea name="purpose" defaultValue={entity.purpose} required rows={2} />
          </FormField>
          <FormField label="Servicios" name="services" hint="JSON array">
            <Input name="services" defaultValue={entity.services} />
          </FormField>
          <div className="flex justify-end"><SubmitButton label="Guardar cambios" /></div>
        </form>
      </EntityEditShell>
    );
  }

  if (type === "service") {
    const entity = await prisma.service.findUnique({ where: { id } });
    if (!entity) notFound();
    const update = updateService.bind(null, id);
    const remove = deleteService.bind(null, id);
    return (
      <EntityEditShell title={entity.name} backHref="/entities?tab=services" deleteAction={remove}>
        <form action={update} className="space-y-5">
          <FormField label="Módulo" name="moduleId" hint="Módulo al que pertenece este servicio frontend">
            <Select
              name="moduleId"
              defaultValue={entity.moduleId ?? ""}
              options={[
                { value: "", label: "Sin módulo asignado" },
                ...modules.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </FormField>
          <FormField label="Nombre" name="name" required>
            <Input name="name" defaultValue={entity.name} required />
          </FormField>
          <FormField label="Propósito" name="purpose" required>
            <Textarea name="purpose" defaultValue={entity.purpose} required rows={2} />
          </FormField>
          <FormField label="Endpoints" name="endpoints" hint="JSON array">
            <Input name="endpoints" defaultValue={entity.endpoints} />
          </FormField>
          <div className="flex justify-end"><SubmitButton label="Guardar cambios" /></div>
        </form>
      </EntityEditShell>
    );
  }

  if (type === "endpoint") {
    const entity = await prisma.endpoint.findUnique({ where: { id } });
    if (!entity) notFound();
    const update = updateEndpoint.bind(null, id);
    const remove = deleteEndpoint.bind(null, id);
    return (
      <EntityEditShell title={entity.path} backHref="/entities?tab=endpoints" deleteAction={remove}>
        <form action={update} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Método" name="method" required>
              <Select name="method" defaultValue={entity.method} required options={httpMethods} />
            </FormField>
            <FormField label="Path" name="path" required>
              <Input name="path" defaultValue={entity.path} required />
            </FormField>
          </div>
          <FormField label="Propósito" name="purpose" required>
            <Textarea name="purpose" defaultValue={entity.purpose} required rows={2} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Entidades request" name="requestEntities" hint="JSON array">
              <Input name="requestEntities" defaultValue={entity.requestEntities} />
            </FormField>
            <FormField label="Entidades response" name="responseEntities" hint="JSON array">
              <Input name="responseEntities" defaultValue={entity.responseEntities} />
            </FormField>
          </div>
          <div className="flex justify-end"><SubmitButton label="Guardar cambios" /></div>
        </form>
      </EntityEditShell>
    );
  }

  notFound();
}

function EntityEditShell({
  title, backHref, deleteAction, children,
}: {
  title:        string;
  backHref:     string;
  deleteAction: () => Promise<void>;
  children:     React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={backHref} className="hover:text-gray-300 transition-colors">Entidades</Link>
        <span>/</span>
        <span className="text-gray-300">{title}</span>
      </div>
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-white">Editar — {title}</h1>
        <DeleteButton action={deleteAction} />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        {children}
      </div>
    </div>
  );
}