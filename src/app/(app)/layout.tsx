import { requireCurrentCompany } from "@/lib/auth/current-company";
import { logout } from "@/app/login/actions";
import { Sidebar } from "@/components/sidebar";
import { isDemoMode } from "@/lib/demo/mode";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company } = await requireCurrentCompany();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 sm:flex-row">
      <Sidebar companyName={company.name} logoutAction={logout} />
      <div className="flex-1">
        {isDemoMode() && (
          <div className="no-print bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
            デモモード — Supabase/Claudeへの実通信を行わず、ダミーデータで動作確認しています
          </div>
        )}
        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
