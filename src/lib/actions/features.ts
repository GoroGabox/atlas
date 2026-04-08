"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseJsonArray(formData: FormData, key: string): string {
  const raw = formData.get(key) as string;
  try {
    const items = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    return JSON.stringify(items);
  } catch {
    return "[]";
  }
}

export async function createFeature(formData: FormData) {
  const moduleId = formData.get("moduleId") as string;
  await prisma.feature.create({
    data: {
      moduleId,
      name:                 formData.get("name") as string,
      description:          formData.get("description") as string,
      businessGoal:         formData.get("businessGoal") as string,
      technicalComplexity:  formData.get("technicalComplexity") as string,
      businessComplexity:   formData.get("businessComplexity") as string,
      riskLevel:            formData.get("riskLevel") as string,
      documentationStatus:  formData.get("documentationStatus") as string,
      busFactor:            parseInt(formData.get("busFactor") as string) || 1,
      pmOwner:              (formData.get("pmOwner") as string) || null,
      techOwner:            (formData.get("techOwner") as string) || null,
      actors:               parseJsonArray(formData, "actors"),
      screens:              parseJsonArray(formData, "screens"),
      components:           parseJsonArray(formData, "components"),
      services:             parseJsonArray(formData, "services"),
      endpoints:            parseJsonArray(formData, "endpoints"),
      entities:             parseJsonArray(formData, "entities"),
      businessRules:        parseJsonArray(formData, "businessRules"),
      dependencies:         parseJsonArray(formData, "dependencies"),
      techDebt:             parseJsonArray(formData, "techDebt"),
    },
  });
  revalidatePath("/modules");
  revalidatePath(`/modules/${moduleId}`);
  redirect(`/modules/${moduleId}`);
}

export async function updateFeature(id: string, moduleId: string, formData: FormData) {
  await prisma.feature.update({
    where: { id },
    data: {
      name:                 formData.get("name") as string,
      description:          formData.get("description") as string,
      businessGoal:         formData.get("businessGoal") as string,
      technicalComplexity:  formData.get("technicalComplexity") as string,
      businessComplexity:   formData.get("businessComplexity") as string,
      riskLevel:            formData.get("riskLevel") as string,
      documentationStatus:  formData.get("documentationStatus") as string,
      busFactor:            parseInt(formData.get("busFactor") as string) || 1,
      pmOwner:              (formData.get("pmOwner") as string) || null,
      techOwner:            (formData.get("techOwner") as string) || null,
      actors:               parseJsonArray(formData, "actors"),
      screens:              parseJsonArray(formData, "screens"),
      components:           parseJsonArray(formData, "components"),
      services:             parseJsonArray(formData, "services"),
      endpoints:            parseJsonArray(formData, "endpoints"),
      entities:             parseJsonArray(formData, "entities"),
      businessRules:        parseJsonArray(formData, "businessRules"),
      dependencies:         parseJsonArray(formData, "dependencies"),
      techDebt:             parseJsonArray(formData, "techDebt"),
    },
  });
  revalidatePath(`/modules/${moduleId}`);
  revalidatePath(`/features/${id}`);
  redirect(`/features/${id}`);
}

export async function deleteFeature(id: string, moduleId: string) {
  await prisma.feature.delete({ where: { id } });
  revalidatePath(`/modules/${moduleId}`);
  redirect(`/modules/${moduleId}`);
}