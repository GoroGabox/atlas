import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const levelOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const docOptions = [
  { value: "none", label: "None" },
  { value: "partial", label: "Partial" },
  { value: "complete", label: "Complete" },
];

type Module = {
  name?: string; description?: string; domain?: string;
  criticality?: string; riskLevel?: string;
  documentationStatus?: string; pmOwner?: string | null; techOwner?: string | null;
};

export default function ModuleForm({
  action, module, submitLabel = "Guardar módulo",
}: {
  action: (formData: FormData) => Promise<void>;
  module?: Module;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Nombre" name="name" required>
          <Input name="name" defaultValue={module?.name} required placeholder="Ej: Reportes" />
        </FormField>
        <FormField label="Dominio" name="domain" required>
          <Input name="domain" defaultValue={module?.domain} required placeholder="Ej: Analytics" />
        </FormField>
      </div>

      <FormField label="Descripción" name="description" required>
        <Textarea name="description" defaultValue={module?.description} required rows={3} />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FormField label="Criticidad" name="criticality">
          <Select name="criticality" defaultValue={module?.criticality ?? "medium"} options={levelOptions} />
        </FormField>
        <FormField label="Nivel de riesgo" name="riskLevel">
          <Select name="riskLevel" defaultValue={module?.riskLevel ?? "medium"} options={levelOptions} />
        </FormField>
        <FormField label="Documentación" name="documentationStatus">
          <Select name="documentationStatus" defaultValue={module?.documentationStatus ?? "none"} options={docOptions} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Owner PM" name="pmOwner">
          <Input name="pmOwner" defaultValue={module?.pmOwner ?? ""} placeholder="Nombre del PM" />
        </FormField>
        <FormField label="Owner Técnico" name="techOwner">
          <Input name="techOwner" defaultValue={module?.techOwner ?? ""} placeholder="Nombre del dev" />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}