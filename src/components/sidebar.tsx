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
  Car,
  CalendarClock,
  TrendingUp,
  Gavel,
  Award,
  ClipboardList,
  Sparkles,
  PhoneCall,
  ShieldAlert,
  LayoutDashboard,
  Calculator,
  Bot,
  ExternalLink,
  Lock,
} from "lucide-react";

type Phase = "1" | "1B" | "2" | "3" | "4";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 未指定なら実装済 */
  phase?: Phase;
  /** 外部URL扱い (取引先ポータル等)。クリック不可、注記表示 */
  external?: boolean;
};

type NavSection = {
  title: string;
  /** モジュール接頭辞 (任意、補足表示用) */
  prefix?: string;
  /** executive ロール限定セクション */
  executive?: boolean;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "レポート",
    prefix: "sf",
    items: [
      { href: "/daily",    label: "日次集計", icon: CalendarRange },
      { href: "/monthly",  label: "月次集計", icon: BarChart3,    phase: "1" },
      { href: "/partners", label: "取引先別", icon: Building2,    phase: "1" },
      { href: "/reps",     label: "担当者別", icon: Users,        phase: "1" },
      { href: "/offices",  label: "営業所別", icon: MapPin,       phase: "1" },
    ],
  },
  {
    title: "リース・車両",
    prefix: "flt",
    items: [
      { href: "/fleet/vehicles",     label: "車両一覧",           icon: Car,           phase: "2" },
      { href: "/fleet/calendar",     label: "解約・売却カレンダー", icon: CalendarClock, phase: "2" },
      { href: "/fleet/profit",       label: "粗利予測",           icon: TrendingUp,    phase: "2" },
    ],
  },
  {
    title: "中古車オークション",
    prefix: "uc",
    items: [
      { href: "/used-cars/listings", label: "出品計画",         icon: Gavel, phase: "2" },
      { href: "/used-cars/scores",   label: "評価点トラッキング", icon: Award, phase: "2" },
    ],
  },
  {
    title: "現場入力",
    items: [
      { href: "/reports",    label: "営業日報",   icon: ClipboardList, phase: "3" },
      { href: "/quality",    label: "車両品質",   icon: Sparkles,      phase: "3" },
      { href: "/calls",      label: "応対品質",   icon: PhoneCall,     phase: "3" },
      { href: "/e-rental",   label: "eレンタカー", icon: ShieldAlert,   phase: "3" },
    ],
  },
  {
    title: "経営",
    executive: true,
    items: [
      { href: "/exec/bi",            label: "経営サマリ", icon: LayoutDashboard, phase: "2" },
      { href: "/exec/accounting",    label: "経理分析",   icon: Calculator,      phase: "1B" },
    ],
  },
  {
    title: "教育・AI",
    items: [
      { href: "/training/roleplay", label: "AIロープレ", icon: Bot, phase: "4" },
    ],
  },
  {
    title: "外部ポータル",
    items: [
      { href: "/portal/dealer", label: "取引先ディーラー", icon: ExternalLink, phase: "2", external: true },
    ],
  },
  {
    title: "マスタ",
    items: [
      { href: "/targets",              label: "目標設定",     icon: Target,     phase: "1" },
      { href: "/partners?view=master", label: "取引先マスタ", icon: ListChecks, phase: "1" },
      { href: "/reps?view=master",     label: "担当者マスタ", icon: IdCard,     phase: "1" },
    ],
  },
  {
    title: "取込",
    items: [
      { href: "/import",             label: "Excel取込", icon: FileSpreadsheet },
      { href: "/import?tab=history", label: "取込履歴",  icon: History, phase: "1" },
    ],
  },
  {
    title: "その他",
    items: [{ href: "/settings", label: "設定", icon: Settings }],
  },
];

function PhaseBadge({ phase }: { phase: Phase }) {
  const label = `P${phase}`;
  return (
    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#3A3A37] text-[#888780] font-medium tracking-wide">
      {label}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-ink text-[#D3D1C7] py-4 sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      <div className="flex items-center gap-2 px-4 pb-4 border-b border-[#333330] mb-3">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-semibold text-sm">
          MH
        </div>
        <div>
          <div className="text-sm font-medium text-white">MobickHub</div>
          <div className="text-[10px] text-[#888780]">MC 業務基盤</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <div className="flex items-center gap-1 px-4 pt-3 pb-1">
            <span className="text-[10px] text-[#888780] uppercase tracking-wider">
              {section.title}
            </span>
            {section.executive && (
              <span className="flex items-center gap-0.5 text-[9px] text-[#888780]">
                <Lock className="w-2.5 h-2.5" />
                executive
              </span>
            )}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const planned = !!item.phase;
            const active = !planned && pathname === item.href.split("?")[0];

            if (planned) {
              // 未実装: クリック不可、グレー、Phaseバッジ表示
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-2.5 px-4 py-1.5 text-sm text-[#6F6E6A] cursor-default"
                  title={
                    item.external
                      ? `Phase ${item.phase} で別URL (${item.href}) として実装予定`
                      : `Phase ${item.phase} で実装予定`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  <PhaseBadge phase={item.phase!} />
                </div>
              );
            }

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
