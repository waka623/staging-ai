import { requireCurrentCompany } from "@/lib/auth/current-company";
import { logout } from "@/app/login/actions";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company } = await requireCurrentCompany();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 sm:flex-row">
      <Sidebar companyName={company.name} logoutAction={logout} />
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
