import { requireAdmin } from "@/lib/admin/auth";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getOrderById } from "@/lib/orders/store";
import { OrderDetail } from "@/components/admin/order-detail";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();
  const t = await getTranslations("admin.common");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm font-semibold text-cream-300">
        ← {t("back")}
      </Link>
      <OrderDetail order={order} />
    </div>
  );
}
