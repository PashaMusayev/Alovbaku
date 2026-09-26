import { requireAdmin } from "@/lib/admin/auth";
import { notFound } from "next/navigation";
import { getPrivateSettings } from "@/lib/admin/settings-admin";
import { validateMenu } from "@/lib/admin/validation";
import { getMenuData } from "@/lib/menu/repository";
import { ItemEditor } from "@/components/admin/item-editor";

export default async function AdminItemPage({ params, searchParams }: PageProps<"/admin/menu/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { category } = await searchParams;
  const [menu, privateSettings] = await Promise.all([getMenuData(), getPrivateSettings()]);
  const item = id === "new" ? null : (menu.items.find((i) => i.id === id) ?? null);
  if (id !== "new" && !item) notFound();
  const warnings = item ? validateMenu(menu, privateSettings.priceOutlierFactor).filter((w) => w.itemId === item.id) : [];
  return (
    <ItemEditor
      key={item?.id ?? "new"}
      item={item}
      categories={[...menu.categories].sort((a, b) => a.sortOrder - b.sortOrder)}
      addonGroups={menu.addonGroups}
      defaultCategoryId={typeof category === "string" ? category : undefined}
      warnings={warnings}
    />
  );
}
