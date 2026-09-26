import { requireAdmin } from "@/lib/admin/auth";
import { listCustomers } from "@/lib/orders/store";
import { CustomersTable } from "@/components/admin/customers-table";

export default async function AdminCustomersPage() {
  await requireAdmin();
  return <CustomersTable customers={await listCustomers()} />;
}
