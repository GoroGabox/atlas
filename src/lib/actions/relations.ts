"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRelation(formData: FormData) {
  await prisma.relation.create({
    data: {
      fromType:     formData.get("fromType") as string,
      fromId:       formData.get("fromId") as string,
      relationType: formData.get("relationType") as string,
      toType:       formData.get("toType") as string,
      toId:         formData.get("toId") as string,
    },
  });
  revalidatePath("/dependencies");
}

export async function deleteRelation(id: string) {
  await prisma.relation.delete({ where: { id } });
  revalidatePath("/dependencies");
}