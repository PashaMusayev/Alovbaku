import { requireAdmin } from "@/lib/admin/auth";
import { listBoardOrders } from "@/lib/orders/store";
import { OrdersBoard } from "@/components/admin/orders-board";

export default async function AdminOrdersPage() {
  await requireAdmin();
  return <OrdersBoard initial={await listBoardOrders()} />;
}
