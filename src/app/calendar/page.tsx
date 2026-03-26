import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { daysInMonth } from "@/lib/dates";
import { db } from "@/lib/db";
import {
  scheduleEdition,
  shiftCell,
  userLetterBinding,
  users,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

type CalendarSearchParams = { view?: string };

const LETTERS = ["A", "B", "C", "D"] as const;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<CalendarSearchParams>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sp = await searchParams;
  // view は A〜D のみ有効。それ以外のクエリは無視し、登録済みの自分の列表示に戻す
  const requested = sp.view?.trim().toUpperCase();
  const validView =
    requested && (LETTERS as readonly string[]).includes(requested)
      ? (requested as (typeof LETTERS)[number])
      : null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dim = daysInMonth(year, month);

  // カレンダーは常に最新の版だけを対象にする
  const [edition] = await db
    .select()
    .from(scheduleEdition)
    .orderBy(desc(scheduleEdition.createdAt))
    .limit(1);

  // 版が無いときはユーザー列の紐付け取得を省略する
  const [binding] = edition
    ? await db
        .select()
        .from(userLetterBinding)
        .where(
          and(
            eq(userLetterBinding.userId, session.user.id),
            eq(userLetterBinding.editionId, edition.id),
          ),
        )
        .limit(1)
    : [];

  const letter = binding?.letter ?? null;
  // 列タブで他列を見るときは view を優先し、未指定なら自分の割当列だけ表示する
  const viewLetter = validView ?? letter;

  const cells =
    edition && viewLetter
      ? await db
          .select()
          .from(shiftCell)
          .where(
            and(
              eq(shiftCell.editionId, edition.id),
              eq(shiftCell.year, year),
              eq(shiftCell.month, month),
              eq(shiftCell.letter, viewLetter),
            ),
          )
      : [];

  const byDay = new Map<number, string>();
  for (const c of cells) {
    byDay.set(c.day, c.value);
  }

  const colleagues =
    edition && viewLetter
      ? await db
          .select({ fullName: users.fullName, id: users.id })
          .from(userLetterBinding)
          .innerJoin(users, eq(users.id, userLetterBinding.userId))
          .where(
            and(
              eq(userLetterBinding.editionId, edition.id),
              eq(userLetterBinding.letter, viewLetter),
            ),
          )
      : [];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">シフト</h1>
        <div className="flex flex-wrap items-center gap-2">
          {session.user.isAdmin ? (
            <Link
              href="/admin/editions"
              className="min-h-10 rounded-md border border-zinc-400 px-3 text-sm leading-10 text-zinc-800"
            >
              管理
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      {!edition ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
          版がまだありません。管理者が「管理」から版を作成してください。
        </p>
      ) : null}

      {edition ? (
        <p className="text-sm text-zinc-600">
          版: <strong>{edition.label}</strong>（最新）
        </p>
      ) : null}

      <p className="text-base text-zinc-800">
        {year}年{month}月
      </p>

      {edition ? (
        <nav className="flex flex-wrap gap-2" aria-label="表示する列">
          {LETTERS.map((L) => {
            const active = viewLetter === L;
            return (
              <Link
                key={L}
                href={`/calendar?view=${L}`}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-base font-medium ${
                  active
                    ? "border-zinc-800 bg-zinc-800 text-white"
                    : "border-zinc-400 bg-white text-zinc-800"
                }`}
              >
                {L}
              </Link>
            );
          })}
          {validView ? (
            <Link
              href="/calendar"
              className="inline-flex min-h-11 items-center rounded-md border border-zinc-400 px-3 text-sm leading-11 text-zinc-700"
            >
              自分の列へ
            </Link>
          ) : null}
        </nav>
      ) : null}

      {validView && letter && validView !== letter ? (
        <p className="text-sm text-zinc-600">
          「{validView}」列を表示中（あなたの設定は {letter}）。
        </p>
      ) : null}

      {!letter && !validView ? (
        <p className="rounded-md border border-zinc-300 bg-white px-3 py-2">
          あなたの <strong>A〜D</strong> が未設定です。列タブで他列だけ閲覧するか、{" "}
          <Link href="/me/letter" className="font-medium underline">
            自分の列を設定
          </Link>
          。
        </p>
      ) : null}

      {viewLetter ? (
        <>
          <section>
            <h2 className="mb-2 text-lg font-medium text-zinc-900">
              {viewLetter} 列
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-300 bg-white">
              {Array.from({ length: dim }, (_, i) => i + 1).map((d) => (
                <li
                  key={d}
                  className="flex min-h-12 items-center justify-between px-3 py-2"
                >
                  <span className="text-zinc-700">{d}日</span>
                  <span className="text-lg font-medium text-zinc-900">
                    {byDay.get(d) ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-zinc-900">
              同じ「{viewLetter}」のメンバー
            </h2>
            <ul className="list-inside list-disc text-base text-zinc-800">
              {colleagues.map((c) => (
                <li key={c.id}>{c.fullName}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <nav className="border-t border-zinc-200 pt-4">
        <Link href="/me/letter" className="text-base underline text-zinc-800">
          A〜D の設定を変更
        </Link>
      </nav>
    </div>
  );
}
