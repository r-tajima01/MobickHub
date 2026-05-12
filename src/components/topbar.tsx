import { Bell, HelpCircle, ChevronRight, Home } from "lucide-react";
import { headers } from "next/headers";

function deriveBreadcrumb(pathname: string): { label: string; current: boolean }[] {
  const map: Record<string, string> = {
    daily: "日次集計",
    monthly: "月次集計",
    partners: "取引先別",
    reps: "担当者別",
    offices: "営業所別",
    targets: "目標設定",
    import: "Excel取込",
    settings: "設定",
  };
  const seg = pathname.split("/").filter(Boolean)[0];
  const label = map[seg] ?? "ダッシュボード";
  const section = ["daily", "monthly", "partners", "reps", "offices"].includes(seg)
    ? "レポート"
    : seg === "targets" || seg === "partners" || seg === "reps"
    ? "マスタ"
    : seg === "import"
    ? "取込"
    : "その他";
  return [
    { label: section, current: false },
    { label, current: true },
  ];
}

export default async function Topbar({ userEmail }: { userEmail?: string }) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/daily";
  const crumbs = deriveBreadcrumb(pathname);

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?";

  return (
    <header className="bg-white border-b border-black/10 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Home className="w-3.5 h-3.5" />
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
            <span className={c.current ? "text-ink font-medium" : ""}>{c.label}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button className="h-8 w-8 flex items-center justify-center rounded-md border border-black/10 hover:bg-bg" title="通知">
          <Bell className="w-4 h-4" />
        </button>
        <button className="h-8 w-8 flex items-center justify-center rounded-md border border-black/10 hover:bg-bg" title="ヘルプ">
          <HelpCircle className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 border border-black/10 rounded-full text-xs">
          <div className="w-[22px] h-[22px] rounded-full bg-good text-white flex items-center justify-center text-[10px] font-medium">
            {initials}
          </div>
          <span>{userEmail ?? "未ログイン"}</span>
          <form action="/auth/signout" method="post" className="inline">
            <button
              type="submit"
              className="ml-1 text-[10px] text-muted hover:text-bad underline"
              title="ログアウト"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
