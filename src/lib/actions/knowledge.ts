"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeModuleOwner(moduleId: string, role: "pm" | "tech") {
  await prisma.module.update({
    where: { id: moduleId },
    data:  role === "pm" ? { pmOwner: null } : { techOwner: null },
  });
  revalidatePath("/knowledge");
  revalidatePath("/modules");
  revalidatePath(`/modules/${moduleId}`);
}

export async function removeFeatureOwner(featureId: string, role: "pm" | "tech") {
  await prisma.feature.update({
    where: { id: featureId },
    data:  role === "pm" ? { pmOwner: null } : { techOwner: null },
  });
  revalidatePath("/knowledge");
}
