"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduleEdition } from "@/lib/db/schema";

export type EditionState = { error?: string };

export async function createEditionAction(
  _prev: EditionState,
  formData: FormData,
): Promise<EditionState> {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return { error: "権限がありません。" };
  }
  const label = String(formData.get("label") ?? "").trim();
  if (!label) {
    return { error: "版の名前を入力してください。" };
  }
  await db.insert(scheduleEdition).values({ label });
  revalidatePath("/admin/editions");
  return {};
}
