import { requireAdmin } from "@/lib/admin/auth";
import { getPrivateSettings } from "@/lib/admin/settings-admin";
import { getDeliveryZones, getSettings } from "@/lib/menu/repository";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, zones, privateSettings] = await Promise.all([getSettings(), getDeliveryZones(), getPrivateSettings()]);
  return (
    <SettingsForm
      settings={settings}
      zones={zones}
      privateSettings={privateSettings}
      telegramChatFromEnv={Boolean(process.env.TELEGRAM_CHAT_ID?.trim())}
    />
  );
}
