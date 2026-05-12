import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalesField - 営業実績管理",
  description: "MobickHub内の営業実績管理モジュール",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
