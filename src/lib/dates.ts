export function daysInMonth(year: number, month: number): number {
  // month は 1〜12。翌月の「0日」= 当月末日（Date の月は 0-based のためこの指定になる）
  return new Date(year, month, 0).getDate();
}
