import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/daily/kpi-cards";
import { FilterBar } from "@/components/daily/filter-bar";
import { PartnerSalesChart, RepAchievementChart, type PartnerChartRow, type RepChartRow } from "@/components/daily/charts";
import {
  ExpandableTable,
  type PartnerGroup,
  type RepGroup,
  type StoreRow,
  type TableTotals,
} from "@/components/daily/expandable-table";
import { formatYen, formatDateJa, monthStart } from "@/lib/format";
import { ClipboardList, JapaneseYen, TrendingUp, ArrowLeftRight, FileCheck, Clock } from "lucide-react";
import type { Database } from "@/types/database.types";

type Office = Database["public"]["Tables"]["sf_sales_offices"]["Row"];
type Partner = Database["public"]["Tables"]["sf_sales_partners"]["Row"];
type Rep = Database["public"]["Tables"]["sf_sales_reps"]["Row"];
type Store = Database["public"]["Tables"]["sf_sales_stores"]["Row"];
type DailyActual = Database["public"]["Tables"]["sf_sales_daily_actuals"]["Row"];
type ImportJob = Database["public"]["Tables"]["sf_sales_import_jobs"]["Row"];
type MonthlyTarget = Database["public"]["Tables"]["sf_sales_monthly_targets"]["Row"];
type OfficeSummary = Database["public"]["Views"]["sf_sales_v_office_daily_summary"]["Row"];
type PartnerSummary = Database["public"]["Views"]["sf_sales_v_partner_daily_summary"]["Row"];
type RepSummary = Database["public"]["Views"]["sf_sales_v_rep_daily_summary"]["Row"];

export default async function DailyPage(
  props: { searchParams: Promise<{ date?: string; office?: string }> }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // 営業所マスタ
  const { data: officesData } = await supabase
    .from("sf_sales_offices")
    .select("id, name, display_order")
    .order("display_order");
  const offices = (officesData ?? []) as Office[];

  // 対象日: クエリ指定が最優先、なければ最新の取込日
  const businessDate: string = await (async () => {
    if (searchParams?.date) return searchParams.date;
    const { data } = await supabase
      .from("sf_sales_import_jobs")
      .select("business_date")
      .eq("status", "success")
      .order("business_date", { ascending: false })
      .limit(1);
    const rows = (data ?? []) as Pick<ImportJob, "business_date">[];
    return rows[0]?.business_date ?? new Date().toISOString().slice(0, 10);
  })();

  // 日進度 (経過日数 / 月日数): 月次目標と日次累計実績の比較に使う
  const bd = new Date(businessDate);
  const daysInMonth = new Date(bd.getFullYear(), bd.getMonth() + 1, 0).getDate();
  const daysElapsed = bd.getDate();
  const dayProgress = daysElapsed / daysInMonth;

  // 対象営業所
  const officeId = searchParams?.office ?? null;
  const office = officeId ? offices.find((o) => o.id === officeId) : null;

  // KPI: 日次サマリビューから取得
  let summaryQuery = supabase
    .from("sf_sales_v_office_daily_summary")
    .select("office_id, store_count, order_count_actual, sales_count_actual, sales_amount_actual")
    .eq("business_date", businessDate);
  if (officeId) summaryQuery = summaryQuery.eq("office_id", officeId);

  const { data: summariesData } = await summaryQuery;
  const summaries = (summariesData ?? []) as OfficeSummary[];

  const ordersActual = summaries.reduce((a, b) => a + (b.order_count_actual ?? 0), 0);
  const salesActual  = summaries.reduce((a, b) => a + Number(b.sales_amount_actual ?? 0), 0);
  const storeCount   = summaries.reduce((a, b) => a + (b.store_count ?? 0), 0);

  // 月次目標 (KPI用、合計)
  let targetQuery = supabase
    .from("sf_sales_monthly_targets")
    .select("order_count_target, sales_amount_target, partner_id, sales_rep_id, office_id")
    .eq("year_month", monthStart(businessDate));
  if (officeId) targetQuery = targetQuery.eq("office_id", officeId);
  const { data: targetsData } = await targetQuery;
  const targets = (targetsData ?? []) as MonthlyTarget[];
  const ordersTarget = targets.reduce((a, b) => a + (b.order_count_target ?? 0), 0);
  const salesTarget  = targets.reduce((a, b) => a + Number(b.sales_amount_target ?? 0), 0);

  // 取引先別サマリ (テーブル & チャート用)
  let partnerQuery = supabase
    .from("sf_sales_v_partner_daily_summary")
    .select("partner_id, store_count, order_count_actual, sales_amount_actual")
    .eq("business_date", businessDate);
  if (officeId) partnerQuery = partnerQuery.eq("office_id", officeId);
  const { data: partnerSummariesData } = await partnerQuery;
  const partnerSummaries = (partnerSummariesData ?? []) as PartnerSummary[];

  const { data: partnersData } = await supabase
    .from("sf_sales_partners")
    .select("id, name, display_order")
    .order("display_order");
  const partners = (partnersData ?? []) as Partner[];
  const partnerById = new Map(partners.map((p) => [p.id, p]));

  // 担当者別サマリ + 担当者マスタ (チャート用)
  let repSummaryQuery = supabase
    .from("sf_sales_v_rep_daily_summary")
    .select("sales_rep_id, sales_amount_actual")
    .eq("business_date", businessDate);
  if (officeId) repSummaryQuery = repSummaryQuery.eq("office_id", officeId);
  const { data: repSummariesData } = await repSummaryQuery;
  const repSummaries = (repSummariesData ?? []) as RepSummary[];

  const { data: repsData } = await supabase
    .from("sf_sales_reps")
    .select("id, name, office_id");
  const reps = (repsData ?? []) as Rep[];
  const repById = new Map(reps.map((r) => [r.id, r]));

  // 目標を取引先・担当者別に集約 (チャート用)
  const partnerTargetMap = new Map<string, number>();
  const repTargetMap = new Map<string, number>();
  for (const t of targets) {
    const amt = Number(t.sales_amount_target ?? 0);
    if (t.partner_id) partnerTargetMap.set(t.partner_id, (partnerTargetMap.get(t.partner_id) ?? 0) + amt);
    if (t.sales_rep_id) repTargetMap.set(t.sales_rep_id, (repTargetMap.get(t.sales_rep_id) ?? 0) + amt);
  }

  // 取引先別チャート行 (売上実績の降順 Top8)
  const partnerChartRows: PartnerChartRow[] = partnerSummaries
    .map((row) => ({
      name: row.partner_id ? (partnerById.get(row.partner_id)?.name ?? "(不明)") : "(不明)",
      actual: Number(row.sales_amount_actual ?? 0),
      target: row.partner_id ? (partnerTargetMap.get(row.partner_id) ?? 0) : 0,
    }))
    .sort((a, b) => b.actual - a.actual);

  // 担当者別チャート行 (ペース達成率の降順 Top10、目標がある人のみ)
  const repChartRows: RepChartRow[] = repSummaries
    .map((row) => {
      const actual = Number(row.sales_amount_actual ?? 0);
      const target = row.sales_rep_id ? (repTargetMap.get(row.sales_rep_id) ?? 0) : 0;
      const expected = target * dayProgress;
      const achievement = expected > 0 ? (actual / expected) * 100 : 0;
      return {
        name: row.sales_rep_id ? (repById.get(row.sales_rep_id)?.name ?? "(不明)") : "(不明)",
        achievement,
        actual,
        target,
      };
    })
    .filter((r) => r.target > 0)
    .sort((a, b) => b.achievement - a.achievement);

  // ===== 店舗レベルの集計データ (展開可能テーブル用) =====

  // 店舗マスタ (営業所フィルタ適用)
  let storesQuery = supabase
    .from("sf_sales_stores")
    .select("id, name, partner_id, office_id, sales_rep_id, is_active")
    .eq("is_active", true);
  if (officeId) storesQuery = storesQuery.eq("office_id", officeId);
  const { data: storesData } = await storesQuery;
  const stores = (storesData ?? []) as Store[];

  // 日次実績 (対象日)
  const { data: actualsData } = await supabase
    .from("sf_sales_daily_actuals")
    .select("store_id, order_count, sales_amount")
    .eq("business_date", businessDate);
  const actuals = (actualsData ?? []) as DailyActual[];
  const actualByStore = new Map(
    actuals.map((a) => [
      a.store_id,
      { order: a.order_count ?? 0, sales: Number(a.sales_amount ?? 0) },
    ])
  );

  // 目標マップ: (partner_id, office_id, sales_rep_id) → { order, sales }
  const tripleKey = (p: string, o: string, r: string | null) => `${p}|${o}|${r ?? ""}`;
  const tripleTargetMap = new Map<string, { order: number; sales: number }>();
  for (const t of targets) {
    if (!t.partner_id || !t.office_id) continue;
    const k = tripleKey(t.partner_id, t.office_id, t.sales_rep_id ?? null);
    const prev = tripleTargetMap.get(k) ?? { order: 0, sales: 0 };
    tripleTargetMap.set(k, {
      order: prev.order + (t.order_count_target ?? 0),
      sales: prev.sales + Number(t.sales_amount_target ?? 0),
    });
  }

  // 店舗行を構築 (StoreRow)
  const storeRows: StoreRow[] = stores.map((s) => {
    const actual = actualByStore.get(s.id) ?? { order: 0, sales: 0 };
    const tgtKey = tripleKey(s.partner_id, s.office_id, s.sales_rep_id ?? null);
    const tgt = tripleTargetMap.get(tgtKey) ?? { order: 0, sales: 0 };
    const partnerName = partnerById.get(s.partner_id)?.name ?? "(不明)";
    const rep = s.sales_rep_id ? repById.get(s.sales_rep_id) : null;
    return {
      storeId: s.id,
      storeName: s.name,
      partnerId: s.partner_id,
      partnerName,
      officeId: s.office_id,
      repId: s.sales_rep_id ?? null,
      repName: rep?.name ?? null,
      orderActual: actual.order,
      orderTarget: tgt.order,
      salesActual: actual.sales,
      salesTarget: tgt.sales,
    };
  });

  // 取引先グループ化
  const partnerGroupMap = new Map<string, PartnerGroup>();
  for (const sr of storeRows) {
    let g = partnerGroupMap.get(sr.partnerId);
    if (!g) {
      g = {
        partnerId: sr.partnerId,
        partnerName: sr.partnerName,
        storeCount: 0,
        orderActual: 0,
        orderTarget: 0,
        salesActual: 0,
        salesTarget: 0,
        stores: [],
      };
      partnerGroupMap.set(sr.partnerId, g);
    }
    g.storeCount += 1;
    g.orderActual += sr.orderActual;
    g.salesActual += sr.salesActual;
    g.stores.push(sr);
  }
  // 取引先目標は (partner_id) でユニーク集約 (店舗を跨いで重複加算しない)
  for (const g of partnerGroupMap.values()) {
    const uniqueTriples = new Set<string>();
    for (const s of g.stores) {
      uniqueTriples.add(tripleKey(s.partnerId, s.officeId, s.repId));
    }
    for (const k of uniqueTriples) {
      const t = tripleTargetMap.get(k);
      if (t) {
        g.orderTarget += t.order;
        g.salesTarget += t.sales;
      }
    }
  }
  const partnerGroups: PartnerGroup[] = Array.from(partnerGroupMap.values()).sort(
    (a, b) => b.salesActual - a.salesActual
  );

  // 担当者グループ化
  const repGroupMap = new Map<string, RepGroup>();
  for (const sr of storeRows) {
    if (!sr.repId || !sr.repName) continue;
    let g = repGroupMap.get(sr.repId);
    if (!g) {
      g = {
        repId: sr.repId,
        repName: sr.repName,
        storeCount: 0,
        orderActual: 0,
        orderTarget: 0,
        salesActual: 0,
        salesTarget: 0,
        stores: [],
      };
      repGroupMap.set(sr.repId, g);
    }
    g.storeCount += 1;
    g.orderActual += sr.orderActual;
    g.salesActual += sr.salesActual;
    g.stores.push(sr);
  }
  for (const g of repGroupMap.values()) {
    const uniqueTriples = new Set<string>();
    for (const s of g.stores) {
      uniqueTriples.add(tripleKey(s.partnerId, s.officeId, s.repId));
    }
    for (const k of uniqueTriples) {
      const t = tripleTargetMap.get(k);
      if (t) {
        g.orderTarget += t.order;
        g.salesTarget += t.sales;
      }
    }
  }
  const repGroups: RepGroup[] = Array.from(repGroupMap.values()).sort(
    (a, b) => b.salesActual - a.salesActual
  );

  // 合計 (取引先グループのユニーク値から)
  const tableTotals: TableTotals = {
    storeCount: storeRows.length,
    orderActual: storeRows.reduce((a, b) => a + b.orderActual, 0),
    orderTarget: partnerGroups.reduce((a, b) => a + b.orderTarget, 0),
    salesActual: storeRows.reduce((a, b) => a + b.salesActual, 0),
    salesTarget: partnerGroups.reduce((a, b) => a + b.salesTarget, 0),
  };

  // 最新取込ジョブ
  const { data: latestJobsData } = await supabase
    .from("sf_sales_import_jobs")
    .select("file_name, completed_at, business_date, rows_imported, status")
    .eq("status", "success")
    .order("completed_at", { ascending: false })
    .limit(1);
  const latestJobs = (latestJobsData ?? []) as ImportJob[];
  const latestJob = latestJobs[0] ?? null;

  // ペース達成率: 実績 / (月次目標 × 日進度)
  const ordersPctPaced = ordersTarget > 0 ? (ordersActual / (ordersTarget * dayProgress)) * 100 : undefined;
  const salesPctPaced  = salesTarget > 0 ? (salesActual / (salesTarget * dayProgress)) * 100 : undefined;
  // 月次の生達成率 (補助表示用)
  const ordersPctRaw = ordersTarget > 0 ? (ordersActual / ordersTarget) * 100 : undefined;
  const salesPctRaw  = salesTarget > 0 ? (salesActual / salesTarget) * 100 : undefined;

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Page header */}
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-medium">日次集計</h1>
          <div className="text-xs text-muted mt-0.5">
            {formatDateJa(businessDate)} 時点 - {office ? `${office.name}営業所` : "全営業所"}
          </div>
        </div>
      </div>

      {/* Import banner */}
      {latestJob && (
        <div className="bg-[#E1F5EE] border border-[#9FE1CB] rounded-lg p-2.5 mb-4 flex items-center gap-2.5 text-xs text-[#085041]">
          <FileCheck className="w-4 h-4 text-good" />
          <span><span className="font-medium">{latestJob.file_name}</span> を取込済み ({latestJob.rows_imported}行)</span>
          <span className="ml-auto text-[11px] opacity-80 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {latestJob.completed_at ? new Date(latestJob.completed_at).toLocaleString("ja-JP") : ""}
          </span>
        </div>
      )}

      {/* Filter */}
      <FilterBar offices={offices} selectedOfficeId={officeId} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <KpiCard
          icon={<ClipboardList className="w-3.5 h-3.5" />}
          label="受注件数 (ペース達成率)"
          value={ordersActual.toLocaleString()}
          target={`目標 ${ordersTarget.toLocaleString()} 件 (月次 ${ordersPctRaw?.toFixed(0) ?? "-"}%)`}
          achievement={ordersPctPaced}
          meta={ordersTarget > 0 ? `残り ${Math.max(0, ordersTarget - ordersActual)} 件 / ${daysInMonth - daysElapsed}日` : "目標未設定"}
        />
        <KpiCard
          icon={<JapaneseYen className="w-3.5 h-3.5" />}
          label="売上金額 (ペース達成率)"
          value={formatYen(salesActual)}
          target={`目標 ${formatYen(salesTarget)} (月次 ${salesPctRaw?.toFixed(0) ?? "-"}%)`}
          achievement={salesPctPaced}
          meta={salesTarget > 0 ? `残り ${formatYen(Math.max(0, salesTarget - salesActual))} / ${daysInMonth - daysElapsed}日` : "目標未設定"}
        />
        <KpiCard
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="店舗数"
          value={storeCount.toLocaleString()}
          meta="集計対象"
        />
        <KpiCard
          icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
          label="平均売上 / 店舗"
          value={formatYen(storeCount > 0 ? salesActual / storeCount : 0)}
          meta={`${storeCount}店舗`}
        />
      </div>

      {/* チャート2枚 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-4">
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">取引先別 売上実績</span>
            <span className="text-[11px] text-muted">単位: 円 (実績 vs 目標 Top8)</span>
          </div>
          {partnerChartRows.length > 0 ? (
            <PartnerSalesChart rows={partnerChartRows} />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-xs text-muted">
              データがありません
            </div>
          )}
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">担当者別 ペース達成率</span>
            <span className="text-[11px] text-muted">緑≧90% / 黄≧70% / 赤&lt;70% (日進度 {(dayProgress * 100).toFixed(1)}%)</span>
          </div>
          {repChartRows.length > 0 ? (
            <RepAchievementChart rows={repChartRows} />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-xs text-muted">
              目標が設定されていません
            </div>
          )}
        </div>
      </div>

      {/* Excelライク展開可能テーブル */}
      <ExpandableTable
        partnerGroups={partnerGroups}
        repGroups={repGroups}
        flatStores={storeRows}
        totals={tableTotals}
        officeLabel={office ? `${office.name}営業所` : "全営業所"}
        dayProgress={dayProgress}
        daysElapsed={daysElapsed}
        daysInMonth={daysInMonth}
      />

      <div className="text-xs text-muted mt-4 p-3 bg-white border border-dashed border-black/15 rounded-lg">
        <strong>📝 次のフェーズ:</strong> ピン留め、エクスポート、月次集計ページ、目標設定UIなど。詳細は <code>docs/claude-code-tasks.md</code> 参照。
      </div>
    </div>
  );
}
