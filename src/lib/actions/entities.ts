"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── SCREEN ───────────────────────────────────────────────

export async function createScreen(formData: FormData) {
  const moduleId = formData.get("moduleId") as string;
  await prisma.screen.create({
    data: {
      moduleId,
      name:       formData.get("name") as string,
      purpose:    formData.get("purpose") as string,
      route:      (formData.get("route") as string) || null,
      components: formData.get("components") as string,
    },
  });
  revalidatePath("/entities");
  revalidatePath(`/modules/${moduleId}`);
  redirect("/entities");
}

export async function updateScreen(id: string, formData: FormData) {
  const screen = await prisma.screen.update({
    where: { id },
    data: {
      name:       formData.get("name") as string,
      purpose:    formData.get("purpose") as string,
      route:      (formData.get("route") as string) || null,
      components: formData.get("components") as string,
    },
  });
  revalidatePath("/entities");
  revalidatePath(`/modules/${screen.moduleId}`);
  redirect("/entities");
}

export async function deleteScreen(id: string) {
  const screen = await prisma.screen.findUnique({ where: { id } });
  await prisma.screen.delete({ where: { id } });
  revalidatePath("/entities");
  if (screen) revalidatePath(`/modules/${screen.moduleId}`);
  redirect("/entities");
}

// ─── COMPONENT ────────────────────────────────────────────

export async function createComponent(formData: FormData) {
  await prisma.component.create({
    data: {
      name:     formData.get("name") as string,
      type:     formData.get("type") as string,
      purpose:  formData.get("purpose") as string,
      services: formData.get("services") as string,
    },
  });
  revalidatePath("/entities");
  redirect("/entities");
}

export async function updateComponent(id: string, formData: FormData) {
  await prisma.component.update({
    where: { id },
    data: {
      name:     formData.get("name") as string,
      type:     formData.get("type") as string,
      purpose:  formData.get("purpose") as string,
      services: formData.get("services") as string,
    },
  });
  revalidatePath("/entities");
  redirect("/entities");
}

export async function deleteComponent(id: string) {
  await prisma.component.delete({ where: { id } });
  revalidatePath("/entities");
  redirect("/entities");
}

// ─── SERVICE ──────────────────────────────────────────────

export async function createService(formData: FormData) {
  const moduleId = (formData.get("moduleId") as string) || null;
  await prisma.service.create({
    data: {
      name:      formData.get("name") as string,
      purpose:   formData.get("purpose") as string,
      endpoints: formData.get("endpoints") as string,
      moduleId,
    },
  });
  revalidatePath("/entities");
  if (moduleId) revalidatePath(`/modules/${moduleId}`);
  redirect("/entities");
}

export async function updateService(id: string, formData: FormData) {
  const moduleId = (formData.get("moduleId") as string) || null;
  await prisma.service.update({
    where: { id },
    data: {
      name:      formData.get("name") as string,
      purpose:   formData.get("purpose") as string,
      endpoints: formData.get("endpoints") as string,
      moduleId,
    },
  });
  revalidatePath("/entities");
  if (moduleId) revalidatePath(`/modules/${moduleId}`);
  redirect("/entities");
}

export async function deleteService(id: string) {
  await prisma.service.delete({ where: { id } });
  revalidatePath("/entities");
  redirect("/entities");
}

// ─── ENDPOINT ─────────────────────────────────────────────

export async function createEndpoint(formData: FormData) {
  await prisma.endpoint.create({
    data: {
      path:             formData.get("path") as string,
      method:           formData.get("method") as string,
      purpose:          formData.get("purpose") as string,
      requestEntities:  formData.get("requestEntities") as string,
      responseEntities: formData.get("responseEntities") as string,
    },
  });
  revalidatePath("/entities");
  redirect("/entities");
}

export async function updateEndpoint(id: string, formData: FormData) {
  await prisma.endpoint.update({
    where: { id },
    data: {
      path:             formData.get("path") as string,
      method:           formData.get("method") as string,
      purpose:          formData.get("purpose") as string,
      requestEntities:  formData.get("requestEntities") as string,
      responseEntities: formData.get("responseEntities") as string,
    },
  });
  revalidatePath("/entities");
  redirect("/entities");
}

export async function deleteEndpoint(id: string) {
  await prisma.endpoint.delete({ where: { id } });
  revalidatePath("/entities");
  redirect("/entities");
}

// ─── PATCH (inline edit — sin redirect) ───────────────────────────────────────

export async function patchScreen(
  id: string,
  data: { name?: string; route?: string | null; purpose?: string }
) {
  const screen = await prisma.screen.update({ where: { id }, data });
  revalidatePath("/entities");
  revalidatePath(`/modules/${screen.moduleId}`);
}

export async function patchComponent(
  id: string,
  data: { name?: string; type?: string; purpose?: string }
) {
  await prisma.component.update({ where: { id }, data });
  revalidatePath("/entities");
}

export async function patchService(
  id: string,
  data: { name?: string; purpose?: string }
) {
  const svc = await prisma.service.findUnique({ where: { id }, select: { moduleId: true } });
  await prisma.service.update({ where: { id }, data });
  revalidatePath("/entities");
  if (svc?.moduleId) revalidatePath(`/modules/${svc.moduleId}`);
}

export async function patchEndpoint(
  id: string,
  data: { path?: string; method?: string; purpose?: string }
) {
  await prisma.endpoint.update({ where: { id }, data });
  revalidatePath("/entities");
}