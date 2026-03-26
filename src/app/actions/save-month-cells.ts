"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { daysInMonth } from "@/lib/dates";
import { db } from "@/lib/db";
import { shiftCell } from "@/lib/db/schema";

const LETTERS = ["A", "B", "C", "D"] as const;
const VALUES = ["1", "2", "3", "休"] as const;

export async function saveMonthCellsAction(
  editionId: string,
  year: number,
  month: number,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return { error: "権限がありません。" };
  }
  const dim = daysInMonth(year, month);

  // 版×年月のマス目を A〜D 列×全日分まとめて保存（空欄は DB から削除して未入力扱い）
  for (const letter of LETTERS) {
    for (let day = 1; day <= dim; day++) {
      const key = `${letter}-${day}`;
      const raw = String(formData.get(key) ?? "").trim();
      // 空または表示用「—」はセル行を削除し、プルダウンの未選択と同義にする
      if (raw === "" || raw === "—") {
        await db
          .delete(shiftCell)
          .where(
            and(
              eq(shiftCell.editionId, editionId),
              eq(shiftCell.year, year),
              eq(shiftCell.month, month),
              eq(shiftCell.letter, letter),
              eq(shiftCell.day, day),
            ),
          );
        continue;
      }
      // 許可値以外は改ざん等として保存せずスキップする
      if (!VALUES.includes(raw as (typeof VALUES)[number])) {
        continue;
      }
      await db
        .insert(shiftCell)
        .values({
          editionId,
          year,
          month,
          letter,
          day,
          value: raw,
        })
        .onConflictDoUpdate({
          target: [
            shiftCell.editionId,
            shiftCell.year,
            shiftCell.month,
            shiftCell.letter,
            shiftCell.day,
          ],
          set: { value: raw },
        });
    }
  }

  revalidatePath("/calendar");
  revalidatePath(`/admin/month/${editionId}/${year}/${month}`);
  return { ok: true as const };
}
