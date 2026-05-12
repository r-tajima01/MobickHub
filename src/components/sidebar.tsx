"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  BarChart3,
  Building2,
  Users,
  MapPin,
  Target,
  ListChecks,
  IdCard,
  FileSpreadsheet,
  History,
  Settings,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "レポート",
    items: [
      { href: "/daily",    label: "日次集計",   icon: CalendarRange },
      { href: "/monthly",  label: "月次集計",   icon: BarChart3 },
      { href: "/partners", label: "取引先別",   icon: Building2 },
      { href: "/reps",     label: "担当者別",   icon: Users },
      { href: "/offices",  label: "営業所別",   icon: MapPin },
    ],
  },
  {
    title: "マスタ",
    items: [
      { href: "/targets",       label: "目標設定",       icon: Target },
      { href: "/partners?view=master", label: "取引先マスタ", icon: ListChecks },
      { href: "/reps?view=master",     label: "担当者マスタ", icon: IdCard },
    ],
  },
  {
    title: "取込",
    items: [
      { href: "/import",         label: "Excel取込",   icon: FileSpreadsheet },
      { href: "/import?tab=history", label: "取込履歴", icon: History },
    ],
  },
  {
    title: "その他",
    items: [{ href: "/settings", label: "設定", icon: Settings }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-ink text-[#D3D1C7] py-4 sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      <div className="flex items-center gap-2 px-4 pb-4 border-b border-[#333330] mb-3">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-semibold text-sm">
          SF
        </div>
        <div>
          <div className="text-sm font-medium text-white">SalesField</div>
          <div className="text-[10px] text-[#888780]">営業実績管理</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <div className="text-[10px] text-[#888780] px-4 pt-3 pb-1 uppercase tracking-wider">
            {section.title}
          </div>
          {section.items.map((item) => {
            const active = pathname === item.href.split("?")[0];
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-1.5 text-sm hover:bg-[#2C2C2A] ${
                  active
                    ? "bg-[#2C2C2A] text-white border-l-2 border-accent pl-[14px]"
                    : "text-[#D3D1C7]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
