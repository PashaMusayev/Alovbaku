import { requireAdmin } from "@/lib/admin/auth";
import { computeAnalytics } from "@/lib/admin/analytics";
import { getSettings } from "@/lib/menu/repository";
import { listOrders } from "@/lib/orders/store";
import { AnalyticsView } from "@/components/admin/analytics-view";

const DAYS = 30;
/** Older orders are only used to tell new customers from returning ones. */
const LOOKBACK_DAYS = 365;

async function load() {
  const now = new Date();
  const [orders, settings] = await Promise.all([listOrders(new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000), 20_000), getSettings()]);
  return computeAnalytics(orders, now, DAYS, settings.timezone);
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  return <AnalyticsView data={await load()} days={DAYS} />;
}
