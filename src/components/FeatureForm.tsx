import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const levelOptions = [
  { value: "low",    label: "Low"    },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High"   },
];

const docOptions = [
  { value: "none",     label: "None"     },
  { value: "partial",  label: "Partial"  },
  { value: "complete", label: "Complete" },
];

type Feature = {
  moduleId?:            string;
  name?:                string;
  description?:         string;
  businessGoal?:        string;
  technicalComplexity?: string;
  businessComplexity?:  string;
  riskLevel?:           string;
  documentationStatus?: string;
  busFactor?:           number;
  pmOwner?:             string | null;
  techOwner?:           string | null;
  actors?:              string;
  screens?:             string;
  components?:          string;
  services?:            string;
  endpoints?:           string;
  entities?:            string;
  businessRules?:       string;
  dependencies?:        string;
  techDebt?:            string;
};

type Module = { id: string; name: string };

function toTextarea(json?: string): string {
  if (!json) return "";
  try { return (JSON.parse(json) as string[]).join("\n"); }
  catch { return ""; }
}

export default function FeatureForm({
  action, feature, modules, selectedModuleId, submitLabel = "Guardar feature",
}: {
  action:            (formData: FormData) => Promise<void>;
  feature?:          Feature;
  modules:           Module[];
  selectedModuleId?: string;
  submitLabel?:      string;
}) {
  const moduleId = feature?.moduleId ?? selectedModuleId ?? modules[0]?.id ?? "";

  return (
    <form action={action} className="space-y-6">

      {/* Módulo */}
      <FormField label="Módulo" name="moduleId" required>
        <Select
          name="moduleId"
          defaultValue={moduleId}
          required
          options={modules.map((m) => ({ value: m.id, label: m.name }))}
        />
      </FormField>

      {/* Nombre + objetivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Nombre" name="name" required>
          <Input name="name" defaultValue={feature?.name} required placeholder="Ej: Exportar reporte" />
        </FormField>
        <FormField label="Bus factor" name="busFactor">
          <Input name="busFactor" defaultValue={String(feature?.busFactor ?? 1)} placeholder="1" />
        </FormField>
      </div>

      <FormField label="Descripción" name="description" required>
        <Textarea name="description" defaultValue={feature?.description} required rows={2} />
      </FormField>

      <FormField label="Objetivo de negocio" name="businessGoal" required>
        <Textarea name="businessGoal" defaultValue={feature?.businessGoal} required rows={2} />
      </FormField>

      {/* Complejidad y riesgo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField label="Complejidad técnica" name="technicalComplexity">
          <Select name="technicalComplexity" defaultValue={feature?.technicalComplexity ?? "medium"} options={levelOptions} />
        </FormField>
        <FormField label="Complejidad negocio" name="businessComplexity">
          <Select name="businessComplexity" defaultValue={feature?.businessComplexity ?? "medium"} options={levelOptions} />
        </FormField>
        <FormField label="Riesgo" name="riskLevel">
          <Select name="riskLevel" defaultValue={feature?.riskLevel ?? "medium"} options={levelOptions} />
        </FormField>
        <FormField label="Documentación" name="documentationStatus">
          <Select name="documentationStatus" defaultValue={feature?.documentationStatus ?? "none"} options={docOptions} />
        </FormField>
      </div>

      {/* Owners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Owner PM" name="pmOwner">
          <Input name="pmOwner" defaultValue={feature?.pmOwner ?? ""} placeholder="Nombre del PM" />
        </FormField>
        <FormField label="Owner Técnico" name="techOwner">
          <Input name="techOwner" defaultValue={feature?.techOwner ?? ""} placeholder="Nombre del dev" />
        </FormField>
      </div>

      {/* Arrays — uno por línea */}
      <div className="border-t border-gray-800 pt-5">
        <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
          Arquitectura técnica — un ítem por línea
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Actores" name="actors" hint="Un actor por línea">
            <Textarea name="actors" defaultValue={toTextarea(feature?.actors)} rows={3} placeholder={"Supervisor\nJefe de planta"} />
          </FormField>
          <FormField label="Pantallas" name="screens" hint="Una pantalla por línea">
            <Textarea name="screens" defaultValue={toTextarea(feature?.screens)} rows={3} placeholder={"Dashboard\nFilterPanel"} />
          </FormField>
          <FormField label="Componentes" name="components" hint="Un componente por línea">
            <Textarea name="components" defaultValue={toTextarea(feature?.components)} rows={3} placeholder={"ReportGrid\nExportButton"} />
          </FormField>
          <FormField label="Servicios" name="services" hint="Un servicio por línea">
            <Textarea name="services" defaultValue={toTextarea(feature?.services)} rows={3} placeholder={"ReportService\nExportService"} />
          </FormField>
          <FormField label="Endpoints" name="endpoints" hint="Un endpoint por línea">
            <Textarea name="endpoints" defaultValue={toTextarea(feature?.endpoints)} rows={3} placeholder={"GET /reports\nPOST /export"} />
          </FormField>
          <FormField label="Entidades de datos" name="entities" hint="Una entidad por línea">
            <Textarea name="entities" defaultValue={toTextarea(feature?.entities)} rows={3} placeholder={"ReportData\nExportConfig"} />
          </FormField>
        </div>
      </div>

      {/* Reglas y deuda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Reglas de negocio" name="businessRules" hint="Una regla por línea">
          <Textarea name="businessRules" defaultValue={toTextarea(feature?.businessRules)} rows={4} placeholder={"Solo supervisores pueden exportar\nRango máximo 90 días"} />
        </FormField>
        <FormField label="Dependencias" name="dependencies" hint="Una dependencia por línea">
          <Textarea name="dependencies" defaultValue={toTextarea(feature?.dependencies)} rows={4} placeholder={"Módulo de autenticación"} />
        </FormField>
      </div>

      <FormField label="Deuda técnica" name="techDebt" hint="Un ítem por línea">
        <Textarea name="techDebt" defaultValue={toTextarea(feature?.techDebt)} rows={3} placeholder={"Falta paginación en /reports"} />
      </FormField>

      <div className="flex justify-end pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}