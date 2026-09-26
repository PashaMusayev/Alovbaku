import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrderById } from "@/lib/orders/store";
import { KitchenTicket } from "@/components/admin/kitchen-ticket";

export const dynamic = "force-dynamic";

/** Print-friendly kitchen ticket (80 mm thermal printers or A4). */
export default async function PrintTicketPage({ params }: PageProps<"/admin/print/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();
  return <KitchenTicket order={order} />;
}
