/**
 * 数値・日付・通貨のフォーマット関数
 */

export function formatYen(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "¥0";
  if (n >= 1_000_000) return `¥${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `¥${(n / 1_000).toFixed(0)}K`;
  return `¥${Math.round(n).toLocaleString()}`;
}

export function formatYenFull(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "¥0";
  return `¥${Math.round(n).toLocaleString()}`;
}

export function formatPercent(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return `${n.toFixed(digits)}%`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return Math.round(n).toLocaleString();
}

export function formatDateJa(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${y}年${m}月${day}日 (${wd})`;
}

export function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function monthStart(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
