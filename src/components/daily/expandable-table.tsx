"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Columns3, Copy, TableProperties } from "lucide-react";
import { formatYenFull } from "@/lib/format";

export type StoreRow = {
  storeId: string;
  storeName: string;
  partnerId: string;
  partnerName: string;
  officeId: string;
  repId: string | null;
  repName: string | null;
  orderActual: number;
  orderTarget: number;
  salesActual: number;
  salesTarget: number;
};

export type PartnerGroup = {
  partnerId: string;
  partnerName: string;
  storeCount: number;
  orderActual: number;
  orderTarget: number;
  salesActual: number;
  salesTarget: number;
  stores: StoreRow[];
};

export type RepGroup = {
  repId: string;
  repName: string;
  storeCount: number;
  orderActual: number;
  orderTarget: number;
  salesActual: number;
  salesTarget: number;
  stores: StoreRow[];
};

export type TableTotals = {
  storeCount: number;
  orderActual: number;
  orderTarget: number;
  salesActual: number;
  salesTarget: number;
};

type ViewMode = "partner" | "rep" | "store";

// 担当者ピル用の安定的なカラー割当 (名前ハッシュで5色をローテーション)
const PILL_PALETTE = [
  { bg: "#E6F1FB", fg: "#0C447C" },
  { bg: "#E1F5EE", fg: "#085041" },
  { bg: "#FAEEDA", fg: "#633806" },
  { bg: "#EEEDFE", fg: "#3C3489" },
  { bg: "#FBEAF0", fg: "#72243E" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pillColor(repId: string | null) {
  if (!repId) return { bg: "#ECEAE0", fg: "#5F5E5A" };
  return PILL_PALETTE[hashString(repId) % PILL_PALETTE.length];
}

function TantouPill({ name, repId }: { name: string | null; repId: string | null }) {
  if (!name) return <span className="text-[#B4B2A9]">—</span>;
  const c = pillColor(repId);
  return (
    <span
      className="inline-block px-1.5 py-px rounded-full text-[10px] font-medium"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {name}
    </span>
  );
}

// ペース達成率セル: 目標 × 日進度を分母にして達成率を計算しヒートマップ着色
function HeatCell({
  actual,
  target,
  dayProgress = 1,
  className = "",
}: {
  actual: number;
  target: number;
  dayProgress?: number;
  className?: string;
}) {
  if (target <= 0) {
    return <td className={`px-2.5 py-1.5 text-right text-[#B4B2A9] ${className}`}>-</td>;
  }
  const expected = target * Math.max(dayProgress, 0.0001);
  const pct = (actual / expected) * 100;
  let bg = "#FCEBEB", fg = "#A32D2D"; // bad
  if (pct >= 90) { bg = "#E1F5EE"; fg = "#0F6E56"; }
  else if (pct >= 70) { bg = "#FAEEDA"; fg = "#854F0B"; }
  return (
    <td
      className={`px-2.5 py-1.5 text-right font-medium ${className}`}
      style={{ backgroundColor: bg, color: fg }}
      title={`実績 ${actual.toLocaleString()} / ペース予測 ${Math.round(expected).toLocaleString()} (月次目標 ${target.toLocaleString()} × 日進度 ${(dayProgress * 100).toFixed(1)}%)`}
    >
      {pct.toFixed(1)}%
    </td>
  );
}

function NumCell({ value, zeroMuted = true, className = "" }: { value: number; zeroMuted?: boolean; className?: string }) {
  const muted = zeroMuted && value === 0;
  return (
    <td className={`px-2.5 py-1.5 text-right ${muted ? "text-[#B4B2A9]" : ""} ${className}`}>
      {value === 0 ? 0 : value.toLocaleString()}
    </td>
  );
}

function YenCell({ value, zeroMuted = true, className = "" }: { value: number; zeroMuted?: boolean; className?: string }) {
  const muted = zeroMuted && value === 0;
  return (
    <td className={`px-2.5 py-1.5 text-right ${muted ? "text-[#B4B2A9]" : ""} ${className}`}>
      {value === 0 ? 0 : formatYenFull(value).replace("¥", "")}
    </td>
  );
}

// 日進度加味目標セル: target × dayProgress を表示 (副数値なのでイタリック・色淡め)
function PacedTargetNumCell({ target, dayProgress, className = "" }: { target: number; dayProgress: number; className?: string }) {
  if (target <= 0) return <td className={`px-2.5 py-1.5 text-right text-[#B4B2A9] ${className}`}>-</td>;
  const v = Math.round(target * dayProgress);
  return (
    <td className={`px-2.5 py-1.5 text-right italic text-[#5F5E5A] ${className}`} title={`月次目標 ${target.toLocaleString()} × 日進度 ${(dayProgress * 100).toFixed(1)}%`}>
      {v.toLocaleString()}
    </td>
  );
}

function PacedTargetYenCell({ target, dayProgress, className = "" }: { target: number; dayProgress: number; className?: string }) {
  if (target <= 0) return <td className={`px-2.5 py-1.5 text-right text-[#B4B2A9] ${className}`}>-</td>;
  const v = Math.round(target * dayProgress);
  return (
    <td className={`px-2.5 py-1.5 text-right italic text-[#5F5E5A] ${className}`} title={`月次目標 ${target.toLocaleString()} × 日進度 ${(dayProgress * 100).toFixed(1)}%`}>
      {v.toLocaleString()}
    </td>
  );
}

// 月次達成率セル: 実績 / 月次目標 (ヒート無し、参考値として淡色表示)
function RawPctCell({ actual, target, className = "" }: { actual: number; target: number; className?: string }) {
  if (target <= 0) return <td className={`px-2.5 py-1.5 text-right text-[#B4B2A9] ${className}`}>-</td>;
  const pct = (actual / target) * 100;
  return (
    <td className={`px-2.5 py-1.5 text-right text-[#5F5E5A] ${className}`} title={`月次目標に対する達成率: ${actual.toLocaleString()} / ${target.toLocaleString()}`}>
      {pct.toFixed(1)}%
    </td>
  );
}

// ---------- グループ/詳細行レンダラ ----------

type GroupKind = {
  key: string;
  name: string;
  storeCount: number;
  orderActual: number;
  orderTarget: number;
  salesActual: number;
  salesTarget: number;
  stores: StoreRow[];
};

function GroupAndDetailRows({
  group,
  expanded,
  onToggle,
  detailLabel,
  showPartnerInDetail = false,
  dayProgress,
}: {
  group: GroupKind;
  expanded: boolean;
  onToggle: () => void;
  detailLabel: "store" | "store+partner";
  showPartnerInDetail?: boolean;
  dayProgress: number;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer font-medium hover:bg-[#EAE7DA]"
        style={{ backgroundColor: "#F1EFE8", borderTop: "0.5px solid #B4B2A9", borderBottom: "0.5px solid #B4B2A9" }}
      >
        <td className="px-2.5 py-2 text-center w-8">
          <ChevronDown
            className="w-3.5 h-3.5 inline-block transition-transform"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        </td>
        <td colSpan={2} className="px-2.5 py-2">
          <span className="text-[13px]">{group.name}</span>
          <span className="ml-2 text-[11px] text-muted font-normal">{group.storeCount} 店舗</span>
        </td>
        <NumCell value={group.orderTarget} />
        <PacedTargetNumCell target={group.orderTarget} dayProgress={dayProgress} />
        <NumCell value={group.orderActual} />
        <RawPctCell actual={group.orderActual} target={group.orderTarget} />
        <HeatCell actual={group.orderActual} target={group.orderTarget} dayProgress={dayProgress} />
        <YenCell value={group.salesTarget} />
        <PacedTargetYenCell target={group.salesTarget} dayProgress={dayProgress} />
        <YenCell value={group.salesActual} />
        <RawPctCell actual={group.salesActual} target={group.salesTarget} />
        <HeatCell actual={group.salesActual} target={group.salesTarget} dayProgress={dayProgress} />
        <YenCell value={group.salesActual} />
      </tr>
      {expanded &&
        group.stores.map((s, idx) => (
          <tr key={s.storeId} className="border-b border-black/5 hover:bg-[#FFF8E8] odd:bg-white even:bg-[#FAFAF7]">
            <td className="px-2.5 py-1 text-center text-muted text-[11px] w-8">{idx + 1}</td>
            <td className="px-2.5 py-1">
              <span className="pl-3 inline-block">
                {detailLabel === "store+partner" && showPartnerInDetail && (
                  <span className="text-muted text-[11px] mr-1.5">{s.partnerName}</span>
                )}
                {s.storeName}
              </span>
            </td>
            <td className="px-2.5 py-1 text-center w-20">
              <TantouPill name={s.repName} repId={s.repId} />
            </td>
            <NumCell value={s.orderTarget} />
            <PacedTargetNumCell target={s.orderTarget} dayProgress={dayProgress} />
            <NumCell value={s.orderActual} />
            <RawPctCell actual={s.orderActual} target={s.orderTarget} />
            <HeatCell actual={s.orderActual} target={s.orderTarget} dayProgress={dayProgress} />
            <YenCell value={s.salesTarget} />
            <PacedTargetYenCell target={s.salesTarget} dayProgress={dayProgress} />
            <YenCell value={s.salesActual} />
            <RawPctCell actual={s.salesActual} target={s.salesTarget} />
            <HeatCell actual={s.salesActual} target={s.salesTarget} dayProgress={dayProgress} />
            <YenCell value={s.salesActual} />
          </tr>
        ))}
    </>
  );
}

// ---------- メインコンポーネント ----------

export function ExpandableTable({
  partnerGroups,
  repGroups,
  flatStores,
  totals,
  officeLabel,
  dayProgress,
  daysElapsed,
  daysInMonth,
}: {
  partnerGroups: PartnerGroup[];
  repGroups: RepGroup[];
  flatStores: StoreRow[];
  totals: TableTotals;
  officeLabel: string;
  dayProgress: number;
  daysElapsed: number;
  daysInMonth: number;
}) {
  const [view, setView] = useState<ViewMode>("partner");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [storeQuery, setStoreQuery] = useState("");

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    if (view === "partner") setExpanded(new Set(partnerGroups.map((g) => g.partnerId)));
    if (view === "rep") setExpanded(new Set(repGroups.map((g) => g.repId)));
  };
  const collapseAll = () => setExpanded(new Set());

  const filteredFlatStores = useMemo(() => {
    if (!storeQuery.trim()) return flatStores;
    const q = storeQuery.toLowerCase();
    return flatStores.filter(
      (s) =>
        s.storeName.toLowerCase().includes(q) ||
        s.partnerName.toLowerCase().includes(q) ||
        (s.repName ?? "").toLowerCase().includes(q)
    );
  }, [flatStores, storeQuery]);

  const titleSuffix =
    view === "partner"
      ? `${partnerGroups.length} 取引先 / ${totals.storeCount} 店舗`
      : view === "rep"
      ? `${repGroups.length} 担当者 / ${totals.storeCount} 店舗`
      : `${filteredFlatStores.length} 店舗`;

  return (
    <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-black/10 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-medium">
            {view === "partner"
              ? "取引先 × 店舗 集計"
              : view === "rep"
              ? "担当者 × 店舗 集計"
              : "店舗一覧"}
          </span>
          <span className="text-[10px] text-muted px-2 py-0.5 bg-line rounded-full">{officeLabel}</span>
          <span className="text-[10px] text-muted">{titleSuffix}</span>
          <span
            className="text-[10px] text-muted px-2 py-0.5 bg-[#FAEEDA] text-[#854F0B] rounded-full"
            title={`月の経過日数 ${daysElapsed} / ${daysInMonth} 日。達成率は (実績) / (月次目標 × 日進度) で計算`}
          >
            日進度 {(dayProgress * 100).toFixed(1)}% ({daysElapsed}/{daysInMonth}日)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {view === "store" && (
            <input
              type="text"
              placeholder="店舗名で検索..."
              value={storeQuery}
              onChange={(e) => setStoreQuery(e.target.value)}
              className="h-7 px-2.5 border border-black/15 rounded text-xs w-44"
            />
          )}
          {view !== "store" && (
            <>
              <button
                onClick={expandAll}
                className="h-7 px-2.5 border border-black/15 rounded text-[11px] hover:bg-bg"
              >
                すべて展開
              </button>
              <button
                onClick={collapseAll}
                className="h-7 px-2.5 border border-black/15 rounded text-[11px] hover:bg-bg"
              >
                すべて折り畳む
              </button>
            </>
          )}
          <div className="flex border border-black/15 rounded overflow-hidden">
            {([
              ["partner", "取引先別"],
              ["rep", "担当者別"],
              ["store", "店舗一覧"],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  setExpanded(new Set());
                }}
                className={`px-3 h-7 text-[11px] border-r border-black/15 last:border-r-0 ${
                  view === v ? "bg-ink text-white" : "bg-white hover:bg-bg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="h-7 w-7 flex items-center justify-center border border-black/15 rounded hover:bg-bg" title="列の表示設定">
            <Columns3 className="w-3.5 h-3.5" />
          </button>
          <button className="h-7 w-7 flex items-center justify-center border border-black/15 rounded hover:bg-bg" title="ピボット">
            <TableProperties className="w-3.5 h-3.5" />
          </button>
          <button className="h-7 w-7 flex items-center justify-center border border-black/15 rounded hover:bg-bg" title="コピー">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* テーブル本体 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular" style={{ minWidth: 1500 }}>
          <thead>
            <tr>
              <th rowSpan={2} className="px-2.5 py-1.5 text-center w-8 bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium sticky top-0">#</th>
              <th rowSpan={2} className="px-2.5 py-1.5 text-left bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium sticky top-0" style={{ width: 220 }}>
                {view === "rep" ? "担当者 / 店舗" : "取引先 / 店舗"}
              </th>
              <th rowSpan={2} className="px-2.5 py-1.5 text-center w-20 bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium sticky top-0">担当者</th>
              <th colSpan={5} className="px-2.5 py-1.5 text-center bg-[#DDD9CB] border-r border-[#C8C5BB] border-b border-[#B4B2A9] text-[11px] font-medium sticky top-0">受注件数 (単月)</th>
              <th colSpan={5} className="px-2.5 py-1.5 text-center bg-[#DDD9CB] border-r border-[#C8C5BB] border-b border-[#B4B2A9] text-[11px] font-medium sticky top-0">売上金額 (単月)</th>
              <th rowSpan={2} className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-b border-[#888780] text-[11px] font-medium sticky top-0" style={{ width: 110 }}>累計売上</th>
            </tr>
            <tr>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-14 sticky" style={{ top: 30 }} title="月次目標">月次目標</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-14 italic sticky" style={{ top: 30 }} title="月次目標 × 日進度">日進目標</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-14 sticky" style={{ top: 30 }}>実績</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-16 sticky" style={{ top: 30 }} title="実績 / 月次目標">月次%</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-16 sticky" style={{ top: 30 }} title="実績 / 日進目標 (ペース達成率)">日進%</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-20 sticky" style={{ top: 30 }}>月次目標</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-20 italic sticky" style={{ top: 30 }}>日進目標</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-20 sticky" style={{ top: 30 }}>実績</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-16 sticky" style={{ top: 30 }}>月次%</th>
              <th className="px-2.5 py-1.5 text-right bg-[#ECEAE0] border-r border-[#C8C5BB] border-b border-[#888780] text-[11px] font-medium w-16 sticky" style={{ top: 30 }}>日進%</th>
            </tr>
          </thead>
          <tbody>
            {view === "partner" &&
              partnerGroups.map((g) => (
                <GroupAndDetailRows
                  key={g.partnerId}
                  group={{
                    key: g.partnerId,
                    name: g.partnerName,
                    storeCount: g.storeCount,
                    orderActual: g.orderActual,
                    orderTarget: g.orderTarget,
                    salesActual: g.salesActual,
                    salesTarget: g.salesTarget,
                    stores: g.stores,
                  }}
                  expanded={expanded.has(g.partnerId)}
                  onToggle={() => toggle(g.partnerId)}
                  detailLabel="store"
                  dayProgress={dayProgress}
                />
              ))}
            {view === "rep" &&
              repGroups.map((g) => (
                <GroupAndDetailRows
                  key={g.repId}
                  group={{
                    key: g.repId,
                    name: g.repName,
                    storeCount: g.storeCount,
                    orderActual: g.orderActual,
                    orderTarget: g.orderTarget,
                    salesActual: g.salesActual,
                    salesTarget: g.salesTarget,
                    stores: g.stores,
                  }}
                  expanded={expanded.has(g.repId)}
                  onToggle={() => toggle(g.repId)}
                  detailLabel="store+partner"
                  showPartnerInDetail
                  dayProgress={dayProgress}
                />
              ))}
            {view === "store" &&
              filteredFlatStores.map((s, idx) => (
                <tr key={s.storeId} className="border-b border-black/5 hover:bg-[#FFF8E8] odd:bg-white even:bg-[#FAFAF7]">
                  <td className="px-2.5 py-1 text-center text-muted text-[11px] w-8">{idx + 1}</td>
                  <td className="px-2.5 py-1">
                    <span className="text-muted text-[11px] mr-1.5">{s.partnerName}</span>
                    {s.storeName}
                  </td>
                  <td className="px-2.5 py-1 text-center w-20">
                    <TantouPill name={s.repName} repId={s.repId} />
                  </td>
                  <NumCell value={s.orderTarget} />
                  <PacedTargetNumCell target={s.orderTarget} dayProgress={dayProgress} />
                  <NumCell value={s.orderActual} />
                  <RawPctCell actual={s.orderActual} target={s.orderTarget} />
                  <HeatCell actual={s.orderActual} target={s.orderTarget} dayProgress={dayProgress} />
                  <YenCell value={s.salesTarget} />
                  <PacedTargetYenCell target={s.salesTarget} dayProgress={dayProgress} />
                  <YenCell value={s.salesActual} />
                  <RawPctCell actual={s.salesActual} target={s.salesTarget} />
                  <HeatCell actual={s.salesActual} target={s.salesTarget} dayProgress={dayProgress} />
                  <YenCell value={s.salesActual} />
                </tr>
              ))}

            {/* 合計行 (黒) */}
            <tr style={{ backgroundColor: "#2C2C2A", color: "#fff", borderTop: "1.5px solid #1F1E1B" }}>
              <td className="px-2.5 py-2 text-center" />
              <td colSpan={2} className="px-2.5 py-2 font-medium">合計 ({officeLabel})</td>
              <NumCell value={totals.orderTarget} zeroMuted={false} className="text-white" />
              <PacedTargetNumCell target={totals.orderTarget} dayProgress={dayProgress} className="!text-[#D3D1C7]" />
              <NumCell value={totals.orderActual} zeroMuted={false} className="text-white" />
              <RawPctCell actual={totals.orderActual} target={totals.orderTarget} className="!text-[#D3D1C7]" />
              <HeatCell actual={totals.orderActual} target={totals.orderTarget} dayProgress={dayProgress} />
              <YenCell value={totals.salesTarget} zeroMuted={false} className="text-white" />
              <PacedTargetYenCell target={totals.salesTarget} dayProgress={dayProgress} className="!text-[#D3D1C7]" />
              <YenCell value={totals.salesActual} zeroMuted={false} className="text-white" />
              <RawPctCell actual={totals.salesActual} target={totals.salesTarget} className="!text-[#D3D1C7]" />
              <HeatCell actual={totals.salesActual} target={totals.salesTarget} dayProgress={dayProgress} />
              <YenCell value={totals.salesActual} zeroMuted={false} className="text-white" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* フッター */}
      <div className="px-4 py-2.5 border-t border-black/10 flex justify-between items-center text-[11px] text-muted">
        <span>
          {view === "partner" && <><strong className="text-ink">{partnerGroups.length} 取引先</strong> / {totals.storeCount} 店舗 を表示中</>}
          {view === "rep" && <><strong className="text-ink">{repGroups.length} 担当者</strong> / {totals.storeCount} 店舗 を表示中</>}
          {view === "store" && <><strong className="text-ink">{filteredFlatStores.length} 店舗</strong> / {totals.storeCount} 店舗中</>}
        </span>
        <span className="text-[10px]">達成率 = 実績 ÷ (月次目標 × 日進度)。未設定は "-"</span>
      </div>
    </div>
  );
}
