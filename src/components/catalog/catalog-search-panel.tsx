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
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeOEM } from "@/lib/oem/normalize";

type Category = {
  id: string;
  slug: string;
  name: Record<string, string>;
  image?: string | null;
  displayImage?: string;
};

type VehicleOption = { id: string; name: string };

type SearchMode = "oem" | "sku" | "vehicle" | "text";

const EXAMPLE_SEARCHES = [
  { label: "motor takozu", type: "text" as const },
  { label: "amortisör körüğü", type: "text" as const },
  { label: "B8376", type: "sku" as const },
  { label: "12 34-56.78", type: "oem" as const },
];

export function CatalogSearchPanel({ categories }: { categories: Category[] }) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [subModels, setSubModels] = useState<VehicleOption[]>([]);
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
      : "text";
  const [mode, setMode] = useState<SearchMode>(initialMode);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then(setMakes)
      .catch(() => setMakes([]));
  }, []);

  useEffect(() => {
    if (!make) {
      setModels([]);
      return;
    }
    fetch(`/api/vehicles?make=${encodeURIComponent(make)}`)
      .then((res) => res.json())
      .then(setModels)
      .catch(() => setModels([]));
  }, [make]);

  useEffect(() => {
    if (!make || !model) {
      setSubModels([]);
      return;
    }
    fetch(
      `/api/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    )
      .then((res) => res.json())
      .then(setSubModels)
      .catch(() => setSubModels([]));
  }, [make, model]);

  useEffect(() => {
    if (make || model || subModel) setShowVehicleFilters(true);
  }, [make, model, subModel]);

  const normalizedPreview = useMemo(() => (q.trim() ? normalizeOEM(q) : ""), [q]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (sku) chips.push({ key: "sku", label: `Ref: ${sku}`, clear: () => setSku("") });
    if (q) chips.push({ key: "q", label: `Arama: ${q}`, clear: () => setQ("") });
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
    } else if (example.type === "text") {
      setQ(example.label);
      setSku("");
      setMode("text");
      pushFilters({ q: example.label, sku: "", make: "", model: "", subModel: "" });
    } else {
      setQ(example.label);
      setSku("");
      setMode("oem");
      pushFilters({ q: example.label, sku: "", make: "", model: "", subModel: "" });
    }
  }

  const inputClass =
    "h-14 border-2 border-white/30 bg-white pl-12 text-base text-brand-brown-dark shadow-sm placeholder:text-muted/55 focus-visible:border-brand-cream focus-visible:ring-2 focus-visible:ring-brand-cream/50";

  const selectClass =
    "h-11 w-full rounded-lg border-2 border-white/30 bg-white px-3 text-sm text-brand-brown-dark shadow-sm focus:border-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-cream/40 disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-muted/60";

  const tabs: { id: SearchMode; label: string; icon: typeof Hash }[] = [
    { id: "text", label: "Genel Arama", icon: AlignLeft },
    { id: "oem", label: "OEM / Cross", icon: Wrench },
    { id: "sku", label: "Beseka Ref", icon: Hash },
    { id: "vehicle", label: "Araç ile", icon: Car },
  ];

  return (
    <div className="relative overflow-hidden catalog-search-hero text-white">
      <div className="catalog-search-hero-inner">
      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-cream">
            Beseka Katalog
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">
            Tek kutuda ürün adı, açıklama, Beseka kodu ve OEM/cross kodu arayın. Tire, boşluk
            veya nokta fark etmez.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="rounded-2xl border-2 border-white/20 bg-black/25 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm md:p-7"
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
                      ? "bg-brand-cream text-brand-brown-dark shadow-lg shadow-black/25"
                      : "border border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Ana arama alanı */}
          {mode === "text" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/90">
                Genel arama
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-brown-dark/45" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Örn: motor takozu, B8376, 1311 826 080"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <p className="text-xs text-white/75">
                Ürün adı, açıklama, Beseka referans kodu ve kayıtlı OEM/cross kodlarında arar.
                Kısmi eşleşmeler de listelenir.
              </p>
            </div>
          )}

          {mode === "oem" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/90">
                {t("oemSearch")}
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-brown-dark/45" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Örn: 12 34-56.78 veya 1234567890"
                  className={inputClass}
                  autoFocus
                />
              </div>
              {normalizedPreview && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  <Sparkles className="h-4 w-4 shrink-0 text-brand-cream" />
                  <span className="text-white/80">Normalize edilmiş arama:</span>
                  <code className="rounded-md bg-brand-brown-dark px-2 py-0.5 font-mono text-white">
                    {normalizedPreview}
                  </code>
                  <span className="text-xs text-white/60">
                    (tire, boşluk, nokta otomatik temizlenir)
                  </span>
                </div>
              )}
            </div>
          )}

          {mode === "sku" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/90">
                {t("skuSearch")}
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-brown-dark/45" />
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="B8376, B6850, B2306..."
                  className={`${inputClass} font-mono uppercase`}
                  autoFocus
                />
              </div>
            </div>
          )}

          {mode === "vehicle" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/90">
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
                  {makes.map((v) => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/90">
                  {t("model")}
                </label>
                <select
                  className={selectClass}
                  value={model}
                  onChange={(e) => { setModel(e.target.value); setSubModel(""); }}
                  disabled={!make}
                >
                  <option value="">{make ? t("model") : t("selectManufacturer")}</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/90">
                  {t("subModel")}
                </label>
                <select
                  className={selectClass}
                  value={subModel}
                  onChange={(e) => setSubModel(e.target.value)}
                  disabled={!model}
                >
                  <option value="">{model ? t("subModel") : t("selectModel")}</option>
                  {subModels.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Gelişmiş filtreler */}
          <div className="mt-5 border-t border-white/20 pt-5">
            <button
              type="button"
              onClick={() => setShowVehicleFilters(!showVehicleFilters)}
              className="flex w-full items-center justify-between text-sm font-medium text-white/90 transition hover:text-white"
            >
              <span>Gelişmiş filtreler (araç & ürün grubu)</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showVehicleFilters ? "rotate-180" : ""}`} />
            </button>

            {showVehicleFilters && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mode !== "vehicle" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/80">
                        {t("manufacturer")}
                      </label>
                      <select
                        className={selectClass}
                        value={make}
                        onChange={(e) => { setMake(e.target.value); setModel(""); setSubModel(""); }}
                      >
                        <option value="">{t("selectManufacturer")}</option>
                        {makes.map((v) => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/80">
                        {t("model")}
                      </label>
                      <select
                        className={selectClass}
                        value={model}
                        onChange={(e) => { setModel(e.target.value); setSubModel(""); }}
                        disabled={!make}
                      >
                        <option value="">{make ? t("model") : "—"}</option>
                        {models.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/80">
                        {t("subModel")}
                      </label>
                      <select
                        className={selectClass}
                        value={subModel}
                        onChange={(e) => setSubModel(e.target.value)}
                        disabled={!model}
                      >
                        <option value="">{model ? t("subModel") : "—"}</option>
                        {subModels.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/80">
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
            <span className="text-xs font-medium text-white/70">Örnek:</span>
            {EXAMPLE_SEARCHES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => applyExample(ex)}
                className="rounded-full border border-white/35 bg-white/10 px-3 py-1 font-mono text-xs text-white transition hover:border-brand-cream hover:bg-brand-cream/20 hover:text-brand-cream"
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
                className="gap-2 border-white/40 bg-transparent text-white hover:bg-white/15"
              >
                <X className="h-4 w-4" />
                {t("clearFilters")}
              </Button>
            )}
          </div>

          {/* Aktif filtreler */}
          {activeFilters.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/20 pt-5">
              <span className="self-center text-xs font-medium text-white/70">Aktif:</span>
              {activeFilters.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeFilter(chip.key)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-brown-dark transition hover:bg-white"
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const imageSrc = cat.displayImage || cat.image;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={`category-hover-card group flex flex-col overflow-hidden rounded-xl border text-center transition-colors ${
                  isActive
                    ? "border-brand-brown bg-brand-brown text-white shadow-lg shadow-brand-brown/30 scale-[1.02]"
                    : "border-brand-cream-dark/50 bg-white text-brand-brown-dark hover:border-brand-brown hover:bg-brand-brown hover:text-white hover:shadow-lg hover:shadow-brand-brown/25"
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={cat.name.tr || cat.slug}
                      fill
                      className="category-image object-contain p-2 transition duration-500 group-hover:scale-105"
                      sizes="(max-width:640px) 50vw, 160px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-3xl">📦</span>
                  )}
                </div>
                <div className="category-label border-t border-border px-2 py-2.5">
                  <span className="text-[11px] font-semibold leading-tight md:text-xs">
                    {cat.name.tr || cat.slug}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
