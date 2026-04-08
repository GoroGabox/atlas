"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createModule(formData: FormData) {
  await prisma.module.create({
    data: {
      name:                formData.get("name") as string,
      description:         formData.get("description") as string,
      domain:              formData.get("domain") as string,
      criticality:         formData.get("criticality") as string,
      riskLevel:           formData.get("riskLevel") as string,
      documentationStatus: formData.get("documentationStatus") as string,
      pmOwner:             (formData.get("pmOwner") as string) || null,
      techOwner:           (formData.get("techOwner") as string) || null,
    },
  });
  revalidatePath("/modules");
  redirect("/modules");
}

export async function updateModule(id: string, formData: FormData) {
  // Guardar snapshot del estado actual antes de modificar
  const current = await prisma.module.findUnique({ where: { id } });
  if (current) {
    await prisma.moduleHistory.create({
      data: {
        moduleId: id,
        snapshot: JSON.stringify({
          name:                current.name,
          description:         current.description,
          domain:              current.domain,
          criticality:         current.criticality,
          riskLevel:           current.riskLevel,
          documentationStatus: current.documentationStatus,
          pmOwner:             current.pmOwner,
          techOwner:           current.techOwner,
        }),
      },
    });
  }

  await prisma.module.update({
    where: { id },
    data: {
      name:                formData.get("name") as string,
      description:         formData.get("description") as string,
      domain:              formData.get("domain") as string,
      criticality:         formData.get("criticality") as string,
      riskLevel:           formData.get("riskLevel") as string,
      documentationStatus: formData.get("documentationStatus") as string,
      pmOwner:             (formData.get("pmOwner") as string) || null,
      techOwner:           (formData.get("techOwner") as string) || null,
    },
  });
  revalidatePath("/modules");
  revalidatePath(`/modules/${id}`);
  redirect(`/modules/${id}`);
}

export async function deleteModule(id: string) {
  await prisma.module.delete({ where: { id } });
  revalidatePath("/modules");
  redirect("/modules");
}