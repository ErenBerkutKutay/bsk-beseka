"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Car,
  ChevronDown,
  Hash,
  Loader2,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeOEM } from "@/lib/oem/normalize";

type Category = {
  id: string;
  slug: string;
  name: Record<string, string>;
  image?: string | null;
};

type VehicleMake = {
  id: string;
  name: string;
  models: { id: string; name: string; subModels: { id: string; name: string }[] }[];
};

type SearchMode = "oem" | "sku" | "vehicle";

const EXAMPLE_SEARCHES = [
  { label: "B8376", type: "sku" as const },
  { label: "B6850", type: "sku" as const },
  { label: "12 34-56.78", type: "oem" as const },
  { label: "1234567890", type: "oem" as const },
];

export function CatalogSearchPanel({ categories }: { categories: Category[] }) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [vehicles, setVehicles] = useState<VehicleMake[]>([]);
  const [showVehicleFilters, setShowVehicleFilters] = useState(false);

  const [sku, setSku] = useState(searchParams.get("sku") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [make, setMake] = useState(searchParams.get("make") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [subModel, setSubModel] = useState(searchParams.get("subModel") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  const initialMode: SearchMode = searchParams.get("sku")
    ? "sku"
    : searchParams.get("make") || searchParams.get("model")
      ? "vehicle"
      : "oem";
  const [mode, setMode] = useState<SearchMode>(initialMode);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, []);

  useEffect(() => {
    if (make || model || subModel) setShowVehicleFilters(true);
  }, [make, model, subModel]);

  const selectedMake = vehicles.find((v) => v.name === make);
  const selectedModel = selectedMake?.models.find((m) => m.name === model);
  const normalizedPreview = useMemo(() => (q.trim() ? normalizeOEM(q) : ""), [q]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (sku) chips.push({ key: "sku", label: `SKU: ${sku}`, clear: () => setSku("") });
    if (q) chips.push({ key: "q", label: `OEM: ${q}`, clear: () => setQ("") });
    if (make) chips.push({ key: "make", label: make, clear: () => { setMake(""); setModel(""); setSubModel(""); } });
    if (model) chips.push({ key: "model", label: model, clear: () => { setModel(""); setSubModel(""); } });
    if (subModel) chips.push({ key: "subModel", label: subModel, clear: () => setSubModel("") });
    if (category) {
      const cat = categories.find((c) => c.slug === category);
      chips.push({
        key: "category",
        label: cat?.name.tr || category,
        clear: () => setCategory(""),
      });
    }
    return chips;
  }, [sku, q, make, model, subModel, category, categories]);

  function pushFilters(overrides?: Partial<{
    sku: string; q: string; make: string; model: string; subModel: string; category: string;
  }>) {
    const params = new URLSearchParams();
    const nextSku = overrides?.sku ?? sku;
    const nextQ = overrides?.q ?? q;
    const nextMake = overrides?.make ?? make;
    const nextModel = overrides?.model ?? model;
    const nextSubModel = overrides?.subModel ?? subModel;
    const nextCategory = overrides?.category ?? category;

    if (nextQ) params.set("q", nextQ);
    if (nextSku) params.set("sku", nextSku);
    if (nextMake) params.set("make", nextMake);
    if (nextModel) params.set("model", nextModel);
    if (nextSubModel) params.set("subModel", nextSubModel);
    if (nextCategory) params.set("category", nextCategory);

    startTransition(() => {
      router.push(`/${locale}/urunler?${params.toString()}`);
    });
  }

  function applyFilters() {
    pushFilters();
  }

  function clearFilters() {
    setQ("");
    setSku("");
    setMake("");
    setModel("");
    setSubModel("");
    setCategory("");
    startTransition(() => router.push(`/${locale}/urunler`));
  }

  function removeFilter(key: string) {
    const next = { sku, q, make, model, subModel, category };
    if (key === "sku") next.sku = "";
    if (key === "q") next.q = "";
    if (key === "make") {
      next.make = "";
      next.model = "";
      next.subModel = "";
    }
    if (key === "model") {
      next.model = "";
      next.subModel = "";
    }
    if (key === "subModel") next.subModel = "";
    if (key === "category") next.category = "";

    setSku(next.sku);
    setQ(next.q);
    setMake(next.make);
    setModel(next.model);
    setSubModel(next.subModel);
    setCategory(next.category);
    pushFilters(next);
  }

  function applyExample(example: (typeof EXAMPLE_SEARCHES)[number]) {
    if (example.type === "sku") {
      setSku(example.label);
      setQ("");
      setMode("sku");
      pushFilters({ sku: example.label, q: "", make: "", model: "", subModel: "" });
    } else {
      setQ(example.label);
      setSku("");
      setMode("oem");
      pushFilters({ q: example.label, sku: "", make: "", model: "", subModel: "" });
    }
  }

  const selectClass =
    "h-11 w-full rounded-lg border border-brand-brown-mid bg-brand-brown-dark/80 px-3 text-sm text-white focus:border-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-cream/30 disabled:cursor-not-allowed disabled:opacity-40";

  const tabs: { id: SearchMode; label: string; icon: typeof Hash }[] = [
    { id: "oem", label: "OEM / Cross", icon: Wrench },
    { id: "sku", label: "Beseka SKU", icon: Hash },
    { id: "vehicle", label: "Araç ile", icon: Car },
  ];

  return (
    <div className="relative overflow-hidden catalog-search-hero text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,171,122,0.28)_0%,transparent_55%)]" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-cream/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-cream/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-cream/70">
            Beseka Katalog
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-cream/80 md:text-base">
            OEM kodunu tire, boşluk veya nokta fark etmeksizin arayın. Beseka referans kodu veya
            araç bilgisiyle de filtreleyebilirsiniz.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="rounded-2xl border border-brand-cream/30 bg-brand-brown-dark/50 p-5 shadow-xl shadow-brand-cream/10 backdrop-blur-sm md:p-7"
        >
          {/* Sekmeler */}
          <div className="mb-6 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-brand-cream text-brand-brown-dark shadow-lg shadow-brand-cream/40"
                      : "bg-white/10 text-brand-cream hover:bg-brand-cream/25 hover:text-brand-brown-dark"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Ana arama alanı */}
          {mode === "oem" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-cream/80">
                {t("oemSearch")}
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-cream/50" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Örn: 12 34-56.78 veya 1234567890"
                  className="h-14 border-brand-brown-mid bg-brand-brown-dark/60 pl-12 text-base text-white placeholder:text-brand-cream/35 focus-visible:ring-brand-cream"
                  autoFocus
                />
              </div>
              {normalizedPreview && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-brand-cream/10 px-4 py-2.5 text-sm">
                  <Sparkles className="h-4 w-4 shrink-0 text-brand-cream" />
                  <span className="text-brand-cream/70">Normalize edilmiş arama:</span>
                  <code className="rounded-md bg-brand-brown px-2 py-0.5 font-mono text-brand-cream">
                    {normalizedPreview}
                  </code>
                  <span className="text-xs text-brand-cream/50">
                    (tire, boşluk, nokta otomatik temizlenir)
                  </span>
                </div>
              )}
            </div>
          )}

          {mode === "sku" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-cream/80">
                {t("skuSearch")}
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-cream/50" />
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="B8376, B6850, B2306..."
                  className="h-14 border-brand-brown-mid bg-brand-brown-dark/60 pl-12 font-mono text-base uppercase text-white placeholder:text-brand-cream/35 focus-visible:ring-brand-cream"
                  autoFocus
                />
              </div>
            </div>
          )}

          {mode === "vehicle" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/80">
                  {t("manufacturer")}
                </label>
                <select
                  className={selectClass}
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    setModel("");
                    setSubModel("");
                  }}
                >
                  <option value="">{t("selectManufacturer")}</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/80">
                  {t("model")}
                </label>
                <select
                  className={selectClass}
                  value={model}
                  onChange={(e) => { setModel(e.target.value); setSubModel(""); }}
                  disabled={!make}
                >
                  <option value="">{make ? t("model") : t("selectManufacturer")}</option>
                  {selectedMake?.models.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/80">
                  {t("subModel")}
                </label>
                <select
                  className={selectClass}
                  value={subModel}
                  onChange={(e) => setSubModel(e.target.value)}
                  disabled={!model}
                >
                  <option value="">{model ? t("subModel") : t("selectModel")}</option>
                  {selectedModel?.subModels.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Gelişmiş filtreler */}
          <div className="mt-5 border-t border-brand-cream/10 pt-5">
            <button
              type="button"
              onClick={() => setShowVehicleFilters(!showVehicleFilters)}
              className="flex w-full items-center justify-between text-sm font-medium text-brand-cream/80 transition hover:text-brand-cream"
            >
              <span>Gelişmiş filtreler (araç & ürün grubu)</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showVehicleFilters ? "rotate-180" : ""}`} />
            </button>

            {showVehicleFilters && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mode !== "vehicle" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/70">
                        {t("manufacturer")}
                      </label>
                      <select
                        className={selectClass}
                        value={make}
                        onChange={(e) => { setMake(e.target.value); setModel(""); setSubModel(""); }}
                      >
                        <option value="">{t("selectManufacturer")}</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/70">
                        {t("model")}
                      </label>
                      <select
                        className={selectClass}
                        value={model}
                        onChange={(e) => { setModel(e.target.value); setSubModel(""); }}
                        disabled={!make}
                      >
                        <option value="">{make ? t("model") : "—"}</option>
                        {selectedMake?.models.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/70">
                        {t("subModel")}
                      </label>
                      <select
                        className={selectClass}
                        value={subModel}
                        onChange={(e) => setSubModel(e.target.value)}
                        disabled={!model}
                      >
                        <option value="">{model ? t("subModel") : "—"}</option>
                        {selectedModel?.subModels.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/70">
                    {t("productGroup")}
                  </label>
                  <select
                    className={selectClass}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Tüm Gruplar</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name.tr || cat.slug}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Örnek aramalar */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-brand-cream/50">Örnek:</span>
            {EXAMPLE_SEARCHES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => applyExample(ex)}
                className="rounded-full border border-brand-cream/20 bg-white/5 px-3 py-1 font-mono text-xs text-brand-cream/90 transition hover:border-brand-cream/50 hover:bg-white/10"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Butonlar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending} size="lg" className="min-w-[160px] gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isPending ? "Aranıyor..." : "Arama Yap"}
            </Button>
            {activeFilters.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={clearFilters}
                className="gap-2 border-brand-cream/30 bg-transparent text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                {t("clearFilters")}
              </Button>
            )}
          </div>

          {/* Aktif filtreler */}
          {activeFilters.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-cream/10 pt-5">
              <span className="self-center text-xs font-medium text-brand-cream/50">Aktif:</span>
              {activeFilters.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeFilter(chip.key)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream/15 px-3 py-1 text-xs font-medium text-brand-cream transition hover:bg-brand-cream/25"
                >
                  {chip.label}
                  <X className="h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export function CatalogCategoryTiles({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const iconMap: Record<string, string> = {
    "amortisor-korukleri": "🔧",
    "motor-takozlari": "⚙️",
    "salincak-burclari": "🔩",
    "turbo-hortumlari": "💨",
    "direksiyon-korukleri": "🎯",
  };

  function selectCategory(slug: string) {
    startTransition(() => {
      router.push(`/${locale}/urunler?category=${slug}`);
    });
  }

  return (
    <div className="catalog-category-strip border-b py-8">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-brand-brown">
          Ürün Grupları
        </p>
        <p className="mb-5 text-sm text-brand-brown-dark/80">Kategoriye göre hızlıca göz atın</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={`card-hover flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                  isActive
                    ? "border-brand-brown bg-brand-brown text-white shadow-lg shadow-brand-brown/30 scale-[1.02]"
                    : "border-brand-cream-dark/50 bg-white text-brand-brown-dark hover:border-brand-brown hover:bg-brand-brown hover:text-white hover:shadow-lg hover:shadow-brand-brown/25"
                }`}
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-brand-cream/40 ring-1 ring-brand-cream-dark/30">
                  {cat.image ? (
                    <Image src={cat.image} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-2xl">
                      {iconMap[cat.slug] || "📦"}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold leading-tight">
                  {cat.name.tr || cat.slug}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
