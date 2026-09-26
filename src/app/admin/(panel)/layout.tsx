import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh pb-24 md:pb-0 md:pl-56">
      <AdminNav email={session.email} />
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
