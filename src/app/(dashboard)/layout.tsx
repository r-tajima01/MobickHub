import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userEmail={user.email} />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
