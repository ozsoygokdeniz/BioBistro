export const ALLERGY_CATEGORIES = [
  {
    id: "dairy",
    title: "Süt ve Süt Ürünleri",
    icon: "Milk",
    description: "Laktoz veya kazein içeren tüm ürünler",
    options: [
      { id: "all_dairy", label: "Süt ve Tüm Süt Ürünleri (Kazein)" },
      { id: "lactose", label: "Laktoz İntoleransı" },
      { id: "goat_sheep", label: "Keçi / Koyun Sütü Ürünleri" }
    ]
  },
  {
    id: "gluten",
    title: "Gluten ve Tahıllar",
    icon: "Wheat",
    description: "Çölyak veya çapraz bulaşma riskli tahıllar",
    options: [
      { id: "celiac", label: "Gluten Alerjisi / Çölyak" },
      { id: "oats", label: "Yulaf (Çapraz Bulaşma)" },
      { id: "corn", label: "Mısır ve Mısır Ürünleri" }
    ]
  },
  {
    id: "nuts",
    title: "Kuruyemişler ve Tohumlar",
    icon: "Nut",
    description: "Ağaç yemişleri, yer fıstığı ve tohumlar",
    options: [
      { id: "all_nuts", label: "Tüm Kuruyemişler (Genel Alerji)" },
      { id: "peanut", label: "Yer Fıstığı" },
      { id: "almond", label: "Badem" },
      { id: "walnut", label: "Ceviz ve Pikan Cevizi" },
      { id: "cashew_pistachio", label: "Kaju ve Antep Fıstığı" },
      { id: "hazelnut", label: "Fındık" },
      { id: "sesame", label: "Susam (Tahin dahil)" }
    ]
  },
  {
    id: "seafood",
    title: "Balık ve Deniz Ürünleri",
    icon: "Fish",
    description: "Tüm yüzgeçli balıklar ve kabuklular",
    options: [
      { id: "all_seafood", label: "Tüm Deniz Ürünleri" },
      { id: "fish", label: "Yüzgeçli Balıklar (Somon vb.)" },
      { id: "shellfish", label: "Kabuklu Deniz Ürünleri (Karides vb.)" },
      { id: "mollusks", label: "Yumuşakçalar (Kalamar, Midye)" }
    ]
  },
  {
    id: "egg_legumes",
    title: "Yumurta ve Baklagiller",
    icon: "Egg",
    description: "Yumurta, soya ve diğer bakliyatlar",
    options: [
      { id: "all_egg", label: "Yumurta (Tamamı)" },
      { id: "soy", label: "Soya ve Soya Ürünleri" },
      { id: "legumes", label: "Diğer Baklagiller (Nohut, Mercimek)" }
    ]
  },
  {
    id: "veg_fruits",
    title: "Sebze, Meyve ve Çapraz Alerjiler",
    icon: "Apple",
    description: "Patlıcangiller, histamin salgılayan meyveler",
    options: [
      { id: "nightshades", label: "Patlıcangiller (Domates, Patates, Biber)" },
      { id: "celery", label: "Kereviz" },
      { id: "citrus", label: "Turunçgiller (Limon, Portakal)" },
      { id: "latex_fruit", label: "Geç Çiçek Açanlar (Muz, Avokado, Kivi)" },
      { id: "histamine_fruit", label: "Histamin Meyveleri (Çilek, Ananas)" }
    ]
  },
  {
    id: "spices",
    title: "Baharatlar ve Katkı Maddeleri",
    icon: "Flame",
    description: "Acı baharatlar, sülfit ve soğan/sarmısak",
    options: [
      { id: "mustard", label: "Hardal" },
      { id: "onion_garlic", label: "Sarmısak ve Soğan" },
      { id: "spicy", label: "Acı Baharatlar" },
      { id: "sulfites", label: "Sülfitler (Şarap, Kuru meyve)" }
    ]
  },
  {
    id: "special_diets",
    title: "Özel Diyetler ve Tıbbi Tercihler",
    icon: "Leaf",
    description: "FODMAP, Keto, Vegan vb.",
    options: [
      { id: "fodmap", label: "FODMAP Diyeti" },
      { id: "histamine", label: "Histamin İntoleransı Diyeti" },
      { id: "keto", label: "Ketojenik (Keto) Diyet" },
      { id: "vegan", label: "Vegan / Vejetaryen" }
    ]
  }
];
