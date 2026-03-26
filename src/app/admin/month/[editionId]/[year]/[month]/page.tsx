import { auth } from "@/auth";
import { daysInMonth } from "@/lib/dates";
import { db } from "@/lib/db";
import { scheduleEdition, shiftCell } from "@/lib/db/schema";
import { saveMonthCellsAction } from "@/app/actions/save-month-cells";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

const VALUE_OPTIONS = ["", "1", "2", "3", "休"] as const;
const LETTERS = ["A", "B", "C", "D"] as const;

type PageProps = {
  params: Promise<{ editionId: string; year: string; month: string }>;
};

export default async function AdminMonthPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect("/calendar");
  }

  const { editionId, year: yStr, month: mStr } = await params;
  const year = Number(yStr);
  const month = Number(mStr);
  // パスパラメータの年月が数値として無効なら版一覧へ戻す
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    redirect("/admin/editions");
  }

  const [edition] = await db
    .select()
    .from(scheduleEdition)
    .where(eq(scheduleEdition.id, editionId))
    .limit(1);
  if (!edition) {
    redirect("/admin/editions");
  }

  const dim = daysInMonth(year, month);
  const rows = await db
    .select()
    .from(shiftCell)
    .where(
      and(
        eq(shiftCell.editionId, editionId),
        eq(shiftCell.year, year),
        eq(shiftCell.month, month),
      ),
    );

  // フォームの name（列-日）と DB のセル値を対応付け、select の default に使う
  const map = new Map<string, string>();
  for (const r of rows) {
    map.set(`${r.letter}-${r.day}`, r.value);
  }

  async function submit(formData: FormData) {
    "use server";
    // 版 ID・年月はサーバー側のクロージャで固定し、POST からの改ざんを防ぐ
    await saveMonthCellsAction(editionId, year, month, formData);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-6 sm:px-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            シフト入力
          </h1>
          <p className="text-sm text-zinc-600">
            {edition.label} / {year}年{month}月
          </p>
        </div>
        <Link href="/admin/editions" className="text-sm underline">
          版一覧へ
        </Link>
      </header>

      <form action={submit} className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-200">
              <th className="sticky left-0 z-10 bg-zinc-200 px-1 py-2 text-left">
                列＼日
              </th>
              {Array.from({ length: dim }, (_, i) => i + 1).map((d) => (
                <th key={d} className="min-w-[3rem] px-0.5 py-2 text-center font-medium">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LETTERS.map((letter) => (
              <tr key={letter} className="border-b border-zinc-200">
                <th className="sticky left-0 bg-zinc-100 px-2 py-2 text-left font-medium">
                  {letter}
                </th>
                {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
                  const name = `${letter}-${day}`;
                  const current = map.get(name) ?? "";
                  return (
                    <td key={name} className="p-0.5">
                      <select
                        name={name}
                        defaultValue={current}
                        className="min-h-10 w-full min-w-[2.75rem] rounded border border-zinc-300 bg-white px-0.5 text-center text-base"
                        aria-label={`${letter}列 ${day}日`}
                      >
                        {VALUE_OPTIONS.map((v) => (
                          <option key={v || "empty"} value={v}>
                            {v === "" ? "—" : v}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <button
            type="submit"
            className="min-h-12 w-full max-w-xs rounded-md bg-zinc-800 text-base font-medium text-white sm:w-auto sm:px-8"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
