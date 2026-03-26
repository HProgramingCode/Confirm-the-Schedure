import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduleEdition } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateEditionForm } from "./create-edition-form";

export default async function AdminEditionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect("/calendar");
  }

  const editions = await db
    .select()
    .from(scheduleEdition)
    .orderBy(desc(scheduleEdition.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900">版の管理</h1>
        <Link
          href="/calendar"
          className="min-h-10 text-sm leading-10 underline text-zinc-700"
        >
          シフトへ戻る
        </Link>
      </header>

      <CreateEditionForm />

      <section>
        <h2 className="mb-2 text-lg font-medium text-zinc-900">登録済みの版</h2>
        {editions.length === 0 ? (
          <p className="text-sm text-zinc-600">まだありません。</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-300 bg-white">
            {editions.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 px-3 py-3">
                <span className="text-base font-medium text-zinc-900">
                  {e.label}
                </span>
                {/* このページを描画した時点の「今月」でシフト編集へ遷移する */}
                <Link
                  href={`/admin/month/${e.id}/${new Date().getFullYear()}/${new Date().getMonth() + 1}`}
                  className="text-sm underline text-zinc-800"
                >
                  今月のシフトを編集
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
