import { requireAdmin } from "@/lib/admin/auth";
import { getPrivateSettings } from "@/lib/admin/settings-admin";
import { validateMenu } from "@/lib/admin/validation";
import { getMenuData } from "@/lib/menu/repository";
import { MenuManager } from "@/components/admin/menu-manager";

export default async function AdminMenuPage() {
  await requireAdmin();
  const [menu, privateSettings] = await Promise.all([getMenuData(), getPrivateSettings()]);
  return <MenuManager menu={menu} warnings={validateMenu(menu, privateSettings.priceOutlierFactor)} />;
}
