"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduleEdition, userLetterBinding } from "@/lib/db/schema";

export type LetterState = { error?: string; ok?: boolean };

export async function setLetterAction(
  _prev: LetterState,
  formData: FormData,
): Promise<LetterState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "ログインしてください。" };
  }
  const letterRaw = String(formData.get("letter") ?? "").trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(letterRaw)) {
    return { error: "A・B・C・D のいずれかを選んでください。" };
  }
  // 列の割当は常に「最新の版」に対して行う（古い版への誤結合を防ぐ）
  const [edition] = await db
    .select()
    .from(scheduleEdition)
    .orderBy(desc(scheduleEdition.createdAt))
    .limit(1);
  if (!edition) {
    return { error: "版がまだありません。管理者に作成を依頼してください。" };
  }
  const [existing] = await db
    .select()
    .from(userLetterBinding)
    .where(
      and(
        eq(userLetterBinding.userId, session.user.id),
        eq(userLetterBinding.editionId, edition.id),
      ),
    )
    .limit(1);
  // 版ごとにユーザーは 1 列だけなので、既存行は更新・無ければ新規作成する
  if (existing) {
    await db
      .update(userLetterBinding)
      .set({ letter: letterRaw })
      .where(eq(userLetterBinding.id, existing.id));
  } else {
    await db.insert(userLetterBinding).values({
      userId: session.user.id,
      editionId: edition.id,
      letter: letterRaw,
    });
  }
  revalidatePath("/calendar");
  revalidatePath("/me/letter");
  return { ok: true };
}
