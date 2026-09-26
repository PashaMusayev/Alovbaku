import { redirect } from "next/navigation";
import { adminAuthMode, getAdminSession } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/layout/logo";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <Logo size="lg" />
      <LoginForm mode={adminAuthMode()} />
    </main>
  );
}
