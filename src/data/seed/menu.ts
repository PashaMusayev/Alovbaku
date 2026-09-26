import type { Category, MenuData, MenuItem, OptionGroup } from "@/lib/types";
import { azn } from "@/lib/money";
import { buildItems, category, type ItemSpec, type L } from "./builders";

/**
 * Seed menu, transcribed from the restaurant's Wolt menu and current website.
 * Wolt prices are used as both "site" and "wolt" unless stated otherwise.
 * Anything that looks like a data error is flagged via `review` so it shows
 * up in the admin validation list.
 */

// ── Shared labels ───────────────────────────────────────────────────────────
const SIZE: L = { az: "Ölçü", ru: "Размер", en: "Size" };
const SERVING: L = { az: "Çörək növü", ru: "Подача", en: "Bread type" };
const VOLUME: L = { az: "Həcm", ru: "Объём", en: "Volume" };
const PIECES: L = { az: "Say", ru: "Количество", en: "Pieces" };

const SMALL: L = { az: "Kiçik", ru: "Маленькая", en: "Small" };
const MEDIUM: L = { az: "Orta", ru: "Средняя", en: "Medium" };
const LARGE: L = { az: "Böyük", ru: "Большая", en: "Large" };

const B = {
  tandir: { az: "Təndir çörəyində", ru: "В тандырном хлебе", en: "In tandoor bread" },
  turk: { az: "Türk çörəyində", ru: "В турецком хлебе", en: "In Turkish bread" },
  lavash: { az: "Lavaşda", ru: "В лаваше", en: "In lavash" },
  limuzin: { az: "Limuzin", ru: "Лимузин", en: "Limousine" },
  basdirma: { az: "Basdırma", ru: "Басдырма", en: "Basdirma" },
  tombik: { az: "Tombik", ru: "Томбик", en: "Tombik" },
  alman: { az: "Alman dönəri", ru: "Немецкий дёнер", en: "German döner" },
  hatay: { az: "Hatay", ru: "Хатай", en: "Hatay" },
  lahmacun: { az: "Lahmacun arası", ru: "В лахмаджуне", en: "In lahmacun" },
  bread: { az: "Çörəkdə", ru: "В хлебе", en: "In bread" },
} satisfies Record<string, L>;

const ML = (n: number): L => ({ az: `${n} ml`, ru: `${n} мл`, en: `${n} ml` });
const LITRE: L = { az: "1 L", ru: "1 л", en: "1 L" };
const PCS = (n: number): L => ({ az: `${n} əd.`, ru: `${n} шт.`, en: `${n} pcs` });

const PIZZA_SIZE_REVIEW =
  "Ölçü adlarını (Kiçik / Orta / Böyük) və diametrləri təsdiqləyin — Wolt-da ölçü adları aydın deyil.";

// ── Option groups (add-ons) ────────────────────────────────────────────────
// Prices are suggestions — flagged for review until the restaurant confirms.
export const optionGroups: OptionGroup[] = [
  {
    id: "doner-sauces",
    name: { az: "Souslar", ru: "Соусы", en: "Sauces" },
    minSelect: 0,
    maxSelect: 2,
    sortOrder: 0,
    needsReview: true,
    options: [
      { id: "sauce-garlic", name: { az: "Sarımsaqlı sous", ru: "Чесночный соус", en: "Garlic sauce" }, priceDelta: azn(0.5), isAvailable: true, sortOrder: 0 },
      { id: "sauce-hot", name: { az: "Acı sous", ru: "Острый соус", en: "Hot sauce" }, priceDelta: azn(0.5), isAvailable: true, sortOrder: 1 },
      { id: "sauce-bbq", name: { az: "Barbekü sousu", ru: "Соус барбекю", en: "BBQ sauce" }, priceDelta: azn(0.5), isAvailable: true, sortOrder: 2 },
    ],
  },
  {
    id: "doner-extras",
    name: { az: "Əlavələr", ru: "Добавки", en: "Extras" },
    minSelect: 0,
    maxSelect: 3,
    sortOrder: 1,
    needsReview: true,
    options: [
      { id: "extra-cheese", name: { az: "Əlavə pendir", ru: "Доп. сыр", en: "Extra cheese" }, priceDelta: azn(1), isAvailable: true, sortOrder: 0 },
      { id: "extra-pepper", name: { az: "Acı bibər", ru: "Острый перец", en: "Chili pepper" }, priceDelta: azn(0.3), isAvailable: true, sortOrder: 1 },
    ],
  },
  {
    id: "pizza-extras",
    name: { az: "Əlavələr", ru: "Добавки", en: "Extras" },
    minSelect: 0,
    maxSelect: 3,
    sortOrder: 2,
    needsReview: true,
    options: [
      { id: "pizza-mozzarella", name: { az: "Əlavə mozzarella", ru: "Доп. моцарелла", en: "Extra mozzarella" }, priceDelta: azn(1.5), isAvailable: true, sortOrder: 0 },
      { id: "pizza-mushroom", name: { az: "Əlavə göbələk", ru: "Доп. грибы", en: "Extra mushrooms" }, priceDelta: azn(1), isAvailable: true, sortOrder: 1 },
      { id: "pizza-sauce", name: { az: "Əlavə sous", ru: "Доп. соус", en: "Extra sauce" }, priceDelta: azn(0.5), isAvailable: true, sortOrder: 2 },
    ],
  },
  {
    id: "burger-extras",
    name: { az: "Əlavələr", ru: "Добавки", en: "Extras" },
    minSelect: 0,
    maxSelect: 2,
    sortOrder: 3,
    needsReview: true,
    options: [
      { id: "burger-cheese", name: { az: "Əlavə çeddar", ru: "Доп. чеддер", en: "Extra cheddar" }, priceDelta: azn(0.8), isAvailable: true, sortOrder: 0 },
      { id: "burger-sauce", name: { az: "Əlavə sous", ru: "Доп. соус", en: "Extra sauce" }, priceDelta: azn(0.5), isAvailable: true, sortOrder: 1 },
    ],
  },
];

// ── Categories (ordered bestsellers-first; admin can reorder) ──────────────
const C = {
  doner: category("koz-doner", { az: "Köz dönər", ru: "Дёнер на углях", en: "Charcoal döner" }, "main", "doner", 0),
  kabab: category("kabablar", { az: "Kabablar", ru: "Кебабы", en: "Kebabs" }, "main", "kebab", 2),
  shaurma: category("saurmalar", { az: "Şaurmalar", ru: "Шаурма", en: "Shawarma" }, "main", "shawarma", 3),
  kombo: category("kombolar", { az: "Kombolar", ru: "Комбо", en: "Combos" }, "combo", "combo", 4),
  pizza: category("pizzalar", { az: "Pizzalar", ru: "Пицца", en: "Pizza" }, "main", "pizza", 5),
  burger: category("burgerler", { az: "Burgerlər", ru: "Бургеры", en: "Burgers" }, "main", "burger", 6),
  lahmacun: category("lahmacunlar", { az: "Lahmacunlar", ru: "Лахмаджун", en: "Lahmacun" }, "main", "lahmacun", 7),
  pide: category("pideler", { az: "Pidelər", ru: "Пиде", en: "Pide" }, "main", "pide", 8),
  roll: category("hot-rolls", { az: "Hot Rolls", ru: "Хот-роллы", en: "Hot rolls" }, "main", "roll", 9),
  snack: category("qelyanaltilar", { az: "Qəlyanaltılar", ru: "Закуски", en: "Snacks" }, "side", "snack", 10),
  soup: category("sorbalar", { az: "Şorbalar", ru: "Супы", en: "Soups" }, "side", "soup", 11),
  salad: category("salatlar", { az: "Salatlar", ru: "Салаты", en: "Salads" }, "side", "salad", 12),
  drink: category("ickiler", { az: "İçkilər", ru: "Напитки", en: "Drinks" }, "drink", "drink", 13),
};

export const categories: Category[] = Object.values(C);

// ── Items ──────────────────────────────────────────────────────────────────
const doner: ItemSpec[] = [
  {
    slug: "et-doner-koz",
    name: { az: "Ət dönər köz", ru: "Дёнер из мяса на углях", en: "Charcoal beef döner" },
    description: {
      az: "Köz üzərində bişən şirəli ət dönər — istədiyiniz çörəkdə.",
      ru: "Сочный мясной дёнер, приготовленный на углях, — в хлебе на ваш выбор.",
      en: "Juicy charcoal-grilled beef döner, served in the bread of your choice.",
    },
    variantLabel: SERVING,
    variants: [
      [B.tandir, 4.1],
      [B.turk, 4.1],
      [B.lavash, 5.3],
      [B.limuzin, 4.6],
      [B.basdirma, 6.1],
      [B.tombik, 5.6],
      [B.alman, 6.1],
      [B.hatay, 6.9],
      [B.lahmacun, 7.6],
    ],
    options: ["doner-sauces", "doner-extras"],
    diet: ["meat"],
    popular: true,
    bestsellerRank: 1,
  },
  {
    slug: "toyuq-doner-koz",
    name: { az: "Toyuq dönər köz", ru: "Дёнер из курицы на углях", en: "Charcoal chicken döner" },
    description: {
      az: "Köz üzərində bişən toyuq dönər. Lahmacun arası: soğan, xiyar, pomidor, göyərti.",
      ru: "Куриный дёнер на углях. В лахмаджуне: лук, огурец, помидор, зелень.",
      en: "Charcoal-grilled chicken döner. In lahmacun: onion, cucumber, tomato, herbs.",
    },
    variantLabel: SERVING,
    variants: [
      [B.tandir, 3.7],
      [B.turk, 3.7],
      [B.lavash, 4.6],
      [B.limuzin, 3.8],
      [B.basdirma, 5.3],
      [B.tombik, 5.3],
      [B.alman, 4.6],
      [B.hatay, 6.1],
      [B.lahmacun, 6.1],
    ],
    variantOverrides: {
      6: {
        needsReview: true,
        reviewNote:
          "Alman dönəri 4,60 ₼ — Lavaşda ilə eyni, ət versiyasından 1,50 ₼ ucuz. Qiyməti təsdiqləyin.",
      },
    },
    options: ["doner-sauces", "doner-extras"],
    diet: ["chicken"],
    popular: true,
    bestsellerRank: 2,
  },
];

const kabab: ItemSpec[] = [
  { slug: "quzu-lulesi", name: { az: "Quzu lüləsi", ru: "Люля из баранины", en: "Lamb lula kebab" }, description: { az: "Köz üzərində bişirilmiş quzu əti lüləsi.", ru: "Люля-кебаб из баранины на углях.", en: "Minced lamb kebab grilled over charcoal." }, price: 10.6, diet: ["meat"], popular: true, bestsellerRank: 3 },
  { slug: "quzu-tikesi", name: { az: "Quzu tikəsi", ru: "Шашлык из баранины", en: "Lamb shish kebab" }, description: { az: "Köz üzərində bişirilmiş quzu əti tikələri.", ru: "Кусочки баранины на углях.", en: "Chunks of lamb grilled over charcoal." }, price: 12.2, diet: ["meat"], bestsellerRank: 5 },
  { slug: "quyruq", name: { az: "Quyruq", ru: "Курдюк", en: "Lamb tail fat kebab" }, price: 8.4, diet: ["meat"] },
  { slug: "quzu-ciyeri", name: { az: "Quzu ciyəri", ru: "Печень ягнёнка", en: "Lamb liver kebab" }, price: 7.6, diet: ["meat"], popular: true, bestsellerRank: 7 },
  { slug: "toyuq-qanadi", name: { az: "Toyuq qanadı", ru: "Куриные крылышки", en: "Chicken wings" }, price: 6.9, diet: ["chicken"] },
  { slug: "toyuq-filesi", name: { az: "Toyuq filesi", ru: "Куриное филе", en: "Chicken fillet kebab" }, price: 7.6, diet: ["chicken"] },
  { slug: "toyuq-lulesi", name: { az: "Toyuq lüləsi", ru: "Люля из курицы", en: "Chicken lula kebab" }, price: 6.9, diet: ["chicken"] },
];

const shaurma: ItemSpec[] = [
  { slug: "toyuq-saurma", name: { az: "Toyuq şaurma", ru: "Шаурма с курицей", en: "Chicken shawarma" }, variantLabel: SERVING, variants: [[B.lavash, 5.6]], diet: ["chicken"], options: ["doner-sauces"], bestsellerRank: 6 },
  { slug: "et-saurma", name: { az: "Ət şaurma", ru: "Шаурма с мясом", en: "Beef shawarma" }, variantLabel: SERVING, variants: [[B.bread, 6.1], [B.lavash, 6.9]], diet: ["meat"], options: ["doner-sauces"], popular: true, bestsellerRank: 4 },
];

const pizza = (
  slug: string,
  name: L,
  description: L,
  prices: [number, number, number],
  diet: ItemSpec["diet"],
  extra: Partial<ItemSpec> = {},
): ItemSpec => ({
  slug,
  name,
  description,
  variantLabel: SIZE,
  variants: [
    [SMALL, prices[0]],
    [MEDIUM, prices[1]],
    [LARGE, prices[2]],
  ],
  options: ["pizza-extras"],
  diet,
  review: PIZZA_SIZE_REVIEW,
  ...extra,
});

const pizzas: ItemSpec[] = [
  pizza("pizza-meksikano", { az: "Meksikano", ru: "Мексикано", en: "Mexicano" }, { az: "Pomidor sousu, mozzarella, mal əti, pepperoni, bibər", ru: "Томатный соус, моцарелла, говядина, пепперони, перец", en: "Tomato sauce, mozzarella, beef, pepperoni, peppers" }, [8.7, 12.7, 15.0], ["meat"], { spicy: true }),
  pizza("pizza-sezar", { az: "Sezar", ru: "Цезарь", en: "Caesar" }, { az: "Ağ sous, mozzarella, toyuq, kahı, pomidor, parmesan", ru: "Белый соус, моцарелла, курица, салат, помидор, пармезан", en: "White sauce, mozzarella, chicken, lettuce, tomato, parmesan" }, [8.7, 11.5, 13.8], ["chicken"]),
  pizza("pizza-marqarita", { az: "Marqarita", ru: "Маргарита", en: "Margherita" }, { az: "Pomidor sousu, mozzarella, reyhan", ru: "Томатный соус, моцарелла, базилик", en: "Tomato sauce, mozzarella, basil" }, [6.9, 9.8, 13.8], ["vegetarian"]),
  pizza("pizza-vegetarian", { az: "Vegetarian", ru: "Вегетарианская", en: "Vegetarian" }, { az: "Pomidor sousu, mozzarella, göbələk, qarğıdalı, zeytun, bolqar bibəri, pomidor", ru: "Томатный соус, моцарелла, грибы, кукуруза, оливки, болгарский перец, помидор", en: "Tomato sauce, mozzarella, mushrooms, corn, olives, bell pepper, tomato" }, [7.5, 10.4, 12.7], ["vegetarian"]),
  {
    slug: "pizza-toyuqlu",
    name: { az: "Toyuqlu", ru: "С курицей", en: "Chicken" },
    description: { az: "Pomidor sousu, mozzarella, toyuq, göbələk", ru: "Томатный соус, моцарелла, курица, грибы", en: "Tomato sauce, mozzarella, chicken, mushrooms" },
    variantLabel: SIZE,
    variants: [[SMALL, 8.1]],
    options: ["pizza-extras"],
    diet: ["chicken"],
    review: "Wolt-da yalnız bir qiymət var (8,10 ₼). Orta və Böyük ölçülər satılırmı? Ölçü adını təsdiqləyin.",
  },
  pizza("pizza-sosisli", { az: "Sosisli", ru: "С сосисками", en: "Sausage" }, { az: "Pomidor sousu, mozzarella, sosis, zeytun", ru: "Томатный соус, моцарелла, сосиски, оливки", en: "Tomato sauce, mozzarella, sausage, olives" }, [7.5, 12.7, 13.8], ["meat"]),
  pizza("pizza-pepperoni", { az: "Pepperoni", ru: "Пепперони", en: "Pepperoni" }, { az: "Pomidor sousu, mozzarella, pepperoni", ru: "Томатный соус, моцарелла, пепперони", en: "Tomato sauce, mozzarella, pepperoni" }, [8.1, 13.3, 13.8], ["meat"], { popular: true }),
  pizza("pizza-qarisiq", { az: "Qarışıq", ru: "Ассорти", en: "Mixed" }, { az: "Pomidor sousu, mozzarella, salam, sosis, toyuq, göbələk, zeytun, bolqar bibəri", ru: "Томатный соус, моцарелла, салями, сосиски, курица, грибы, оливки, болгарский перец", en: "Tomato sauce, mozzarella, salami, sausage, chicken, mushrooms, olives, bell pepper" }, [8.7, 13.3, 16.1], ["meat", "chicken"]),
];

const burgers: ItemSpec[] = [
  { slug: "double-toyuq-burger", name: { az: "Double toyuq burger", ru: "Дабл чикен бургер", en: "Double chicken burger" }, price: 9.9, diet: ["chicken"], options: ["burger-extras"] },
  { slug: "double-et-burger", name: { az: "Double ət burger", ru: "Дабл бургер с говядиной", en: "Double beef burger" }, price: 10.6, diet: ["meat"], options: ["burger-extras"] },
  { slug: "double-toyuq-cizburger", name: { az: "Double toyuq çizburger", ru: "Дабл чикен чизбургер", en: "Double chicken cheeseburger" }, price: 10.6, diet: ["chicken"], options: ["burger-extras"] },
  { slug: "double-et-cizburger", name: { az: "Double ət çizburger", ru: "Дабл чизбургер с говядиной", en: "Double beef cheeseburger" }, price: 10.6, diet: ["meat"], options: ["burger-extras"] },
];

const lahmacuns: ItemSpec[] = [
  { slug: "lahmacun-sade", name: { az: "Lahmacun sadə", ru: "Лахмаджун классический", en: "Classic lahmacun" }, price: 3.8, diet: ["meat"] },
  { slug: "lahmacun-acili", name: { az: "Lahmacun acılı", ru: "Лахмаджун острый", en: "Spicy lahmacun" }, price: 3.8, diet: ["meat"], spicy: true },
  { slug: "lahmacun-pendirli", name: { az: "Lahmacun pendirli", ru: "Лахмаджун с сыром", en: "Cheese lahmacun" }, price: 4.6, diet: ["meat"] },
  { slug: "lahmacun-qozlu", name: { az: "Lahmacun qozlu", ru: "Лахмаджун с грецким орехом", en: "Walnut lahmacun" }, price: 4.6, diet: ["meat"] },
];

const PIDE_REVIEW = "Wolt-dakı təsvirlər səhvdir və ya boşdur — tərkibi yazın.";
const pides: ItemSpec[] = [
  { slug: "pide-qiymeli", name: { az: "Qiyməli pide", ru: "Пиде с фаршем", en: "Minced meat pide" }, price: 10.6, diet: ["meat"], review: PIDE_REVIEW },
  { slug: "pide-pendirli", name: { az: "Pendirli pide", ru: "Пиде с сыром", en: "Cheese pide" }, price: 9.1, diet: ["vegetarian"], review: PIDE_REVIEW },
  { slug: "pide-sucuqlu", name: { az: "Sucuqlu pide", ru: "Пиде с суджуком", en: "Sucuk pide" }, price: 10.6, diet: ["meat"], review: PIDE_REVIEW },
  { slug: "pide-toyuqlu", name: { az: "Toyuqlu pide", ru: "Пиде с курицей", en: "Chicken pide" }, price: 10.6, diet: ["chicken"], review: PIDE_REVIEW },
  { slug: "pide-sosisli", name: { az: "Sosisli pide", ru: "Пиде с сосисками", en: "Sausage pide" }, price: 10.6, diet: ["meat"], review: PIDE_REVIEW },
];

const rolls: ItemSpec[] = [
  { slug: "isti-chicken-roll", name: { az: "İsti Chicken Roll", ru: "Хот-ролл с курицей", en: "Hot chicken roll" }, price: 9.1, diet: ["chicken"] },
  { slug: "isti-ebi-roll", name: { az: "İsti Ebi Roll", ru: "Хот-ролл Эби", en: "Hot ebi roll" }, price: 12.2, diet: ["fish"] },
  { slug: "isti-california-roll", name: { az: "İsti California Roll", ru: "Хот-ролл Калифорния", en: "Hot California roll" }, price: 12.2, diet: ["fish"] },
];

const snacks: ItemSpec[] = [
  {
    slug: "kartof-fri",
    name: { az: "Kartof fri", ru: "Картофель фри", en: "French fries" },
    price: 12.1,
    art: "fries",
    diet: ["vegetarian"],
    review: "12,10 ₼ kartof fri üçün qeyri-adi yüksəkdir (digər qəlyanaltılar 3,80–7,60 ₼). Ehtimal ki, 2,10 ₼ olmalıdır.",
  },
  {
    slug: "toyuq-naggets",
    name: { az: "Toyuq naggets", ru: "Куриные наггетсы", en: "Chicken nuggets" },
    variantLabel: PIECES,
    variants: [[PCS(3), 3.8], [PCS(6), 4.6]],
    variantOverrides: {
      1: { needsReview: true, reviewNote: "6 ədəd cəmi 0,80 ₼ bahadır (3 əd. — 3,80 ₼). Say və ya qiyməti təsdiqləyin." },
    },
    diet: ["chicken"],
  },
  { slug: "ciy-kufte", name: { az: "Çiy küftə", ru: "Чий кёфте", en: "Çiğ köfte" }, price: 7.6, spicy: true },
  { slug: "ciy-kufte-durum", name: { az: "Çiy küftə dürüm", ru: "Чий кёфте дюрюм", en: "Çiğ köfte wrap" }, price: 7.6, spicy: true },
  {
    slug: "pendir-cubuqlari",
    name: { az: "Pendir çubuqları", ru: "Сырные палочки", en: "Cheese sticks" },
    variantLabel: PIECES,
    variants: [[PCS(4), 4.6], ["", 7.6]],
    variantOverrides: {
      1: {
        needsReview: true,
        availableSite: false,
        reviewNote: "Wolt-da eyni məhsul ikinci dəfə 7,60 ₼-a, etiketsiz göstərilir. Dublikatdır, yoxsa 8 ədəddir?",
      },
    },
    diet: ["vegetarian"],
  },
];

const salads: ItemSpec[] = [
  {
    slug: "coban-salati",
    name: { az: "Çoban salatı", ru: "Салат Чобан", en: "Shepherd's salad" },
    description: { az: "Təzə pomidor və xiyar", ru: "Свежие помидоры и огурцы", en: "Fresh tomatoes and cucumbers" },
    price: { site: 3.0, wolt: 4.6 },
    diet: ["vegetarian"],
    review: "Saytda 3,00 ₼, Wolt-da 4,60 ₼. Hansı qiymət düzgündür?",
  },
  { slug: "sezar-salati", name: { az: "Sezar salatı", ru: "Салат Цезарь", en: "Caesar salad" }, description: { az: "Klassik Sezar, təzə yaşıllıqlarla", ru: "Классический Цезарь со свежей зеленью", en: "Classic Caesar with fresh greens" }, price: 7.0, channels: "site", diet: ["chicken"] },
  { slug: "mimoza-salati", name: { az: "Mimoza salatı", ru: "Салат Мимоза", en: "Mimosa salad" }, description: { az: "Qatlı, çuğundur ilə", ru: "Слоёный, со свёклой", en: "Layered, with beetroot" }, price: 4.5, channels: "site" },
  { slug: "toyuq-salati", name: { az: "Toyuq salatı", ru: "Салат с курицей", en: "Chicken salad" }, description: { az: "Qızardılmış toyuq əti ilə", ru: "С жареной курицей", en: "With fried chicken" }, price: 4.0, channels: "site", diet: ["chicken"] },
  { slug: "paytaxt-salati", name: { az: "Paytaxt salatı", ru: "Салат Столичный", en: "Capital salad" }, description: { az: "Ənənəvi", ru: "Традиционный", en: "Traditional" }, price: 3.5, channels: "site" },
];

const soups: ItemSpec[] = [
  { slug: "merci-sorbasi", name: { az: "Mərci şorbası", ru: "Чечевичный суп", en: "Lentil soup" }, price: 3.8, diet: ["vegetarian"], popular: true, bestsellerRank: 8 },
  {
    slug: "toyuq-sorbasi",
    name: { az: "Toyuq şorbası", ru: "Куриный суп", en: "Chicken soup" },
    description: { az: "Təzə toyuq əti ilə", ru: "Со свежей курицей", en: "With fresh chicken" },
    price: { site: 3.0, wolt: 4.6 },
    diet: ["chicken"],
    review: "Saytda 3,00 ₼, Wolt-da 4,60 ₼. Hansı qiymət düzgündür?",
  },
  { slug: "dovga", name: { az: "Dovğa", ru: "Довга", en: "Dovgha" }, description: { az: "Qatıq və yaşıllıqla, milli şorba", ru: "Национальный суп на катыке с зеленью", en: "National yogurt soup with herbs" }, price: 3.0, channels: "site", diet: ["vegetarian"] },
];

const COLA_330_REVIEW: { needsReview: true; reviewNote: string } = {
  needsReview: true,
  reviewNote: "330 ml 4,60 ₼ — 1 L ilə eyni qiymətdir. Səhv görünür.",
};

const drinks: ItemSpec[] = [
  { slug: "coca-cola", name: { az: "Coca-Cola", ru: "Coca-Cola", en: "Coca-Cola" }, variantLabel: VOLUME, variants: [[ML(300), 1.6], [ML(500), 2.6], [LITRE, 4.6], [ML(330), 4.6]], variantOverrides: { 3: COLA_330_REVIEW } },
  { slug: "fanta", name: { az: "Fanta", ru: "Fanta", en: "Fanta" }, variantLabel: VOLUME, variants: [[ML(300), 1.6], [ML(500), 2.6], [LITRE, 4.6], [ML(330), 4.6]], variantOverrides: { 3: COLA_330_REVIEW } },
  { slug: "sprite", name: { az: "Sprite", ru: "Sprite", en: "Sprite" }, variantLabel: VOLUME, variants: [[ML(300), 1.6], [ML(500), 2.6]] },
  { slug: "ayran", name: { az: "Azərsüd Ayran 200 ml", ru: "Айран Azərsüd 200 мл", en: "Azərsüd Ayran 200 ml" }, price: 1.1, popular: true },
  { slug: "cappy-multimeyve", name: { az: "Cappy multimeyvə 200 ml", ru: "Cappy мультифрукт 200 мл", en: "Cappy multifruit 200 ml" }, price: 2.3 },
  { slug: "fuse-tea-manqo", name: { az: "Fuse Tea Manqo-Ananas 500 ml", ru: "Fuse Tea манго-ананас 500 мл", en: "Fuse Tea mango-pineapple 500 ml" }, price: 3.0 },
  { slug: "fuse-tea-saftali", name: { az: "Fuse Tea Şaftalı 500 ml", ru: "Fuse Tea персик 500 мл", en: "Fuse Tea peach 500 ml" }, price: 3.0 },
];

const FRIES: L = { az: "Kartof fri", ru: "Картофель фри", en: "French fries" };
const combos: ItemSpec[] = [
  { slug: "kombo-toyuq-cizburger-fri", name: { az: "Toyuq çizburger + kartof fri", ru: "Чикен чизбургер + фри", en: "Chicken cheeseburger + fries" }, price: 9.9, diet: ["chicken"], combo: [{ item: "double-toyuq-cizburger", label: { az: "Double toyuq çizburger", ru: "Дабл чикен чизбургер", en: "Double chicken cheeseburger" } }, { item: "kartof-fri", label: FRIES }] },
  { slug: "kombo-et-cizburger-fri", name: { az: "Ət çizburger + kartof fri", ru: "Чизбургер с говядиной + фри", en: "Beef cheeseburger + fries" }, price: 11.4, diet: ["meat"], combo: [{ item: "double-et-cizburger", label: { az: "Double ət çizburger", ru: "Дабл чизбургер", en: "Double beef cheeseburger" } }, { item: "kartof-fri", label: FRIES }] },
  { slug: "kombo-toyuq-burger-fri-kola", name: { az: "Toyuq burger + kartof fri + Coca-Cola 300 ml", ru: "Чикен бургер + фри + Coca-Cola 300 мл", en: "Chicken burger + fries + Coca-Cola 300 ml" }, price: 10.6, diet: ["chicken"], popular: true, combo: [{ item: "double-toyuq-burger", label: { az: "Double toyuq burger", ru: "Дабл чикен бургер", en: "Double chicken burger" } }, { item: "kartof-fri", label: FRIES }, { item: "coca-cola", variant: 1, label: { az: "Coca-Cola 300 ml", ru: "Coca-Cola 300 мл", en: "Coca-Cola 300 ml" } }] },
  { slug: "kombo-naggets-fri", name: { az: "Toyuq naggets + kartof fri", ru: "Наггетсы + фри", en: "Chicken nuggets + fries" }, price: 8.4, diet: ["chicken"], review: "Kombodakı naggets sayı göstərilməyib (3 və ya 6 ədəd?).", combo: [{ item: "toyuq-naggets", label: { az: "Toyuq naggets", ru: "Наггетсы", en: "Chicken nuggets" } }, { item: "kartof-fri", label: FRIES }] },
  { slug: "kombo-baby-pizza", name: { az: "Baby pizza + kartof fri + meyvə şirəsi", ru: "Бэби пицца + фри + сок", en: "Baby pizza + fries + juice" }, price: 10.6, review: "“Baby pizza” menyuda ayrıca məhsul kimi yoxdur. Hansı pizza və ölçü nəzərdə tutulur?", combo: [{ label: { az: "Baby pizza", ru: "Бэби пицца", en: "Baby pizza" } }, { item: "kartof-fri", label: FRIES }, { item: "cappy-multimeyve", label: { az: "Cappy 200 ml", ru: "Cappy 200 мл", en: "Cappy 200 ml" } }] },
  // Suggested new combos — drafts, hidden until the restaurant approves them.
  { slug: "kombo-doner-ayran", name: { az: "Dönər + Ayran", ru: "Дёнер + айран", en: "Döner + Ayran" }, description: { az: "Təndir çörəyində ət dönər və soyuq ayran.", ru: "Мясной дёнер в тандырном хлебе и холодный айран.", en: "Beef döner in tandoor bread with a cold ayran." }, price: 4.9, channels: "site", draft: true, diet: ["meat"], combo: [{ item: "et-doner-koz", variant: 1, label: { az: "Ət dönər (təndir çörəyində)", ru: "Дёнер (в тандырном хлебе)", en: "Beef döner (tandoor bread)" } }, { item: "ayran", label: { az: "Ayran 200 ml", ru: "Айран 200 мл", en: "Ayran 200 ml" } }] },
  { slug: "kombo-aile-paketi", name: { az: "Ailə paketi", ru: "Семейный набор", en: "Family pack" }, description: { az: "Böyük Qarışıq pizza + 4 lahmacun + 1 L Coca-Cola.", ru: "Большая пицца Ассорти + 4 лахмаджуна + Coca-Cola 1 л.", en: "Large Mixed pizza + 4 lahmacun + 1 L Coca-Cola." }, price: 31.9, channels: "site", draft: true, diet: ["meat"], combo: [{ item: "pizza-qarisiq", variant: 3, label: { az: "Qarışıq pizza (böyük)", ru: "Пицца Ассорти (большая)", en: "Mixed pizza (large)" } }, { item: "lahmacun-sade", qty: 4, label: { az: "Lahmacun sadə", ru: "Лахмаджун", en: "Lahmacun" } }, { item: "coca-cola", variant: 3, label: { az: "Coca-Cola 1 L", ru: "Coca-Cola 1 л", en: "Coca-Cola 1 L" } }] },
  { slug: "kombo-kabab-duo", name: { az: "Kabab duo", ru: "Кебаб дуо", en: "Kebab duo" }, description: { az: "Quzu lüləsi + toyuq qanadı + Coca-Cola 500 ml.", ru: "Люля из баранины + куриные крылышки + Coca-Cola 500 мл.", en: "Lamb lula + chicken wings + Coca-Cola 500 ml." }, price: 17.9, channels: "site", draft: true, diet: ["meat", "chicken"], combo: [{ item: "quzu-lulesi", label: { az: "Quzu lüləsi", ru: "Люля из баранины", en: "Lamb lula" } }, { item: "toyuq-qanadi", label: { az: "Toyuq qanadı", ru: "Куриные крылышки", en: "Chicken wings" } }, { item: "coca-cola", variant: 2, label: { az: "Coca-Cola 500 ml", ru: "Coca-Cola 500 мл", en: "Coca-Cola 500 ml" } }] },
];

export const items: MenuItem[] = [
  ...buildItems(C.doner, doner),
  ...buildItems(C.kabab, kabab),
  ...buildItems(C.shaurma, shaurma),
  ...buildItems(C.kombo, combos),
  ...buildItems(C.pizza, pizzas),
  ...buildItems(C.burger, burgers),
  ...buildItems(C.lahmacun, lahmacuns),
  ...buildItems(C.pide, pides),
  ...buildItems(C.roll, rolls),
  ...buildItems(C.snack, snacks),
  ...buildItems(C.soup, soups),
  ...buildItems(C.salad, salads),
  ...buildItems(C.drink, drinks),
];

export const seedMenu: MenuData = { categories, items, optionGroups };
