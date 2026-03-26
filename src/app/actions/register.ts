"use server";

import { hash } from "bcryptjs";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!email || !password || !fullName) {
    return { error: "メール・パスワード・氏名を入力してください。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }
  const [row] = await db.select({ n: count() }).from(users);
  // 初回登録者のみ管理者にし、版・シフト管理のブートストラップを可能にする
  const isFirstUser = (row?.n ?? 0) === 0;
  const passwordHash = await hash(password, 10);
  try {
    await db.insert(users).values({
      email,
      passwordHash,
      fullName,
      isAdmin: isFirstUser,
    });
  } catch {
    return { error: "登録に失敗しました（メールが既に使われている可能性）。" };
  }
  redirect("/login?registered=1");
}
