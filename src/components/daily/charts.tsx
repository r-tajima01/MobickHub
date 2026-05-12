"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

export type PartnerChartRow = {
  name: string;
  actual: number;
  target: number;
};

export type RepChartRow = {
  name: string;
  achievement: number;
  actual: number;
  target: number;
};

function tierColor(pct: number): string {
  if (pct >= 90) return "#0F6E56";
  if (pct >= 70) return "#BA7517";
  return "#993C1D";
}

function formatYenAxis(v: number): string {
  if (v >= 1_000_000) return `¥${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `¥${(v / 1_000).toFixed(0)}K`;
  return `¥${v}`;
}

export function PartnerSalesChart({ rows }: { rows: PartnerChartRow[] }) {
  const data = rows.slice(0, 8);
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatYenAxis}
            tick={{ fontSize: 10, fill: "#5F5E5A" }}
            stroke="#C8C5BB"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11, fill: "#1F1E1B" }}
            stroke="#C8C5BB"
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={{ fontSize: 11, borderRadius: 6, borderColor: "#ECEAE0" }}
            formatter={(v: number, name) => [`¥${v.toLocaleString()}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="square"
            iconSize={10}
          />
          <Bar dataKey="actual" name="実績" fill="#378ADD" radius={[0, 2, 2, 0]} barSize={10} />
          <Bar dataKey="target" name="目標" fill="rgba(180,178,169,0.4)" radius={[0, 2, 2, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RepAchievementChart({ rows }: { rows: RepChartRow[] }) {
  const data = rows.slice(0, 10);
  // ペース達成率は100%超もありうる。データの最大値を踏まえて軸上限を決める
  const maxAch = Math.max(100, ...data.map((r) => r.achievement));
  const axisMax = Math.ceil(maxAch / 25) * 25; // 25%刻みで丸め
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, axisMax]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: "#5F5E5A" }}
            stroke="#C8C5BB"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            tick={{ fontSize: 11, fill: "#1F1E1B" }}
            stroke="#C8C5BB"
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={{ fontSize: 11, borderRadius: 6, borderColor: "#ECEAE0" }}
            formatter={(_v: number, _n, item) => {
              const r = item.payload as RepChartRow;
              return [
                `達成率 ${r.achievement.toFixed(1)}% (¥${r.actual.toLocaleString()} / ¥${r.target.toLocaleString()})`,
                "",
              ];
            }}
          />
          <Bar dataKey="achievement" name="達成率" radius={[0, 2, 2, 0]} barSize={14}>
            {data.map((r, i) => (
              <Cell key={i} fill={tierColor(r.achievement)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
