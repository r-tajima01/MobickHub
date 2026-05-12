"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type Office = { id: string; name: string };

export function FilterBar({ offices, selectedOfficeId }: { offices: Office[]; selectedOfficeId: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || "";

  function shiftDate(days: number) {
    const d = date ? new Date(date) : new Date();
    d.setDate(d.getDate() + days);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    update({ date: iso });
  }

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="bg-white border border-black/10 rounded-lg p-3 mb-4 flex items-center gap-2 flex-wrap text-xs">
      <span className="text-muted">営業所</span>
      <select
        className="h-7 px-2 border border-black/15 rounded text-xs"
        value={selectedOfficeId ?? ""}
        onChange={(e) => update({ office: e.target.value || null })}
      >
        <option value="">全営業所</option>
        {offices.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-black/10 mx-1" />

      <span className="text-muted">日付</span>
      <button onClick={() => shiftDate(-1)} className="h-7 w-7 border border-black/15 rounded flex items-center justify-center hover:bg-bg">
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => update({ date: e.target.value })}
        className="h-7 px-2 border border-black/15 rounded text-xs"
      />
      <button onClick={() => shiftDate(1)} className="h-7 w-7 border border-black/15 rounded flex items-center justify-center hover:bg-bg">
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <div className="ml-auto" />

      <button
        onClick={() => router.refresh()}
        className="h-7 px-2.5 border border-black/15 rounded hover:bg-bg flex items-center gap-1"
      >
        <RefreshCw className="w-3 h-3" /> 更新
      </button>
    </div>
  );
}
