"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { resolveCategoryLabel } from "@/lib/categories/product-groups";
import { buildCatalogSearchUrl } from "@/lib/catalog/navigation";
import { formatEngineOptionLabel } from "@/lib/catalog/vehicle-options";

type Category = {
  id: string;
  slug: string;
  name: Record<string, string>;
  image?: string | null;
  displayImage?: string;
};

type VehicleOption = { id: string; name: string };

type EngineOption = VehicleOption & {
  tipNo: number;
  yearFrom?: number | null;
  yearTo?: number | null;
};

function useCatalogSearch(categories: Category[]) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [engines, setEngines] = useState<EngineOption[]>([]);

  const [sku, setSku] = useState(searchParams.get("sku") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [make, setMake] = useState(searchParams.get("make") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [engineInfo, setEngineInfo] = useState(
    searchParams.get("engineInfo") || searchParams.get("subModel") || "",
  );
  const [vehicleId, setVehicleId] = useState(searchParams.get("vehicleId") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

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
      setEngines([]);
      return;
    }
    fetch(
      `/api/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    )
      .then((res) => res.json())
      .then(setEngines)
      .catch(() => setEngines([]));
  }, [make, model]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (sku) chips.push({ key: "sku", label: t("filterRef", { value: sku }), clear: () => setSku("") });
    if (q) chips.push({ key: "q", label: t("filterQuery", { value: q }), clear: () => setQ("") });
    if (make) {
      chips.push({
        key: "make",
        label: make,
        clear: () => {
          setMake("");
          setModel("");
          setEngineInfo("");
          setVehicleId("");
        },
      });
    }
    if (model) {
      chips.push({
        key: "model",
        label: model,
        clear: () => {
          setModel("");
          setEngineInfo("");
          setVehicleId("");
        },
      });
    }
    if (engineInfo) {
      chips.push({
        key: "engineInfo",
        label: engineInfo,
        clear: () => {
          setEngineInfo("");
          setVehicleId("");
        },
      });
    }
    if (category) {
      const cat = categories.find((c) => c.slug === category);
      chips.push({
        key: "category",
        label: resolveCategoryLabel(category, locale, cat?.name),
        clear: () => setCategory(""),
      });
    }
    return chips;
  }, [sku, q, make, model, engineInfo, category, categories, locale, t]);

  function pushFilters(overrides?: Partial<{
    sku: string;
    q: string;
    make: string;
    model: string;
    engineInfo: string;
    vehicleId: string;
    category: string;
  }>) {
    const params = new URLSearchParams();
    const nextSku = overrides?.sku ?? sku;
    const nextQ = overrides?.q ?? q;
    const nextMake = overrides?.make ?? make;
    const nextModel = overrides?.model ?? model;
    const nextEngineInfo = overrides?.engineInfo ?? engineInfo;
    const nextVehicleId = overrides?.vehicleId ?? vehicleId;
    const nextCategory = overrides?.category ?? category;

    if (nextQ) params.set("q", nextQ);
    if (nextSku) params.set("sku", nextSku);
    if (nextMake) params.set("make", nextMake);
    if (nextModel) params.set("model", nextModel);
    if (nextEngineInfo) params.set("engineInfo", nextEngineInfo);
    if (nextVehicleId) params.set("vehicleId", nextVehicleId);
    if (nextCategory) params.set("category", nextCategory);

    startTransition(() => {
      router.push(buildCatalogSearchUrl(locale, params), { scroll: false });
    });
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    pushFilters();
  }

  function clearFilters() {
    setQ("");
    setSku("");
    setMake("");
    setModel("");
    setEngineInfo("");
    setVehicleId("");
    setCategory("");
    startTransition(() => router.push(`/${locale}/urunler`));
  }

  function removeFilter(key: string) {
    const next = { sku, q, make, model, engineInfo, vehicleId, category };
    if (key === "sku") next.sku = "";
    if (key === "q") next.q = "";
    if (key === "make") {
      next.make = "";
      next.model = "";
      next.engineInfo = "";
      next.vehicleId = "";
    }
    if (key === "model") {
      next.model = "";
      next.engineInfo = "";
      next.vehicleId = "";
    }
    if (key === "engineInfo") {
      next.engineInfo = "";
      next.vehicleId = "";
    }
    if (key === "category") next.category = "";

    setSku(next.sku);
    setQ(next.q);
    setMake(next.make);
    setModel(next.model);
    setEngineInfo(next.engineInfo);
    setVehicleId(next.vehicleId);
    setCategory(next.category);
    pushFilters(next);
  }

  function selectEngine(option: EngineOption | null) {
    if (!option?.tipNo) {
      setVehicleId("");
      setEngineInfo("");
      return;
    }
    setVehicleId(String(option.tipNo));
    setEngineInfo(option.name);
  }

  return {
    t,
    locale,
    isPending,
    makes,
    models,
    engines,
    sku,
    setSku,
    q,
    setQ,
    make,
    setMake,
    model,
    setModel,
    engineInfo,
    vehicleId,
    selectEngine,
    category,
    setCategory,
    activeFilters,
    applyFilters,
    clearFilters,
    removeFilter,
  };
}

type SearchFieldsProps = ReturnType<typeof useCatalogSearch> & {
  categories: Category[];
  variant: "hero" | "sidebar";
};

function CatalogSearchFields({
  categories,
  variant,
  t,
  isPending,
  makes,
  models,
  engines,
  sku,
  setSku,
  q,
  setQ,
  make,
  setMake,
  model,
  setModel,
  engineInfo,
  vehicleId,
  selectEngine,
  category,
  setCategory,
  activeFilters,
  applyFilters,
  clearFilters,
  removeFilter,
  locale,
}: SearchFieldsProps) {
  const isSidebar = variant === "sidebar";

  const inputClass = isSidebar
    ? "h-10 border-zinc-300 bg-white text-sm"
    : "h-11 border-brand-cream-dark/80 bg-white text-sm shadow-sm";

  const selectClass = isSidebar
    ? "catalog-sidebar-select h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown disabled:cursor-not-allowed disabled:opacity-50"
    : "h-11 w-full rounded-md border border-brand-cream-dark/80 bg-white px-3 text-sm text-brand-brown-dark shadow-sm focus:border-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-brown/20 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-muted";

  const labelClass = isSidebar
    ? "text-xs font-bold uppercase tracking-wide text-brand-brown-dark"
    : "text-xs font-bold uppercase tracking-wide text-brand-brown";

  const fieldBlock = (label: string, children: ReactNode) => (
    <div>
      <Label className={labelClass}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );

  return (
    <form onSubmit={applyFilters} className={isSidebar ? "space-y-3" : "space-y-4"}>
      {isSidebar ? (
        <>
          {fieldBlock(
            t("manufacturer"),
            <select
              className={selectClass}
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel("");
                selectEngine(null);
              }}
            >
              <option value="">{t("selectManufacturer")}</option>
              {makes.map((v) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>,
          )}
          {fieldBlock(
            t("model"),
            <select
              className={selectClass}
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                selectEngine(null);
              }}
              disabled={!make}
            >
              <option value="">{make ? t("model") : t("selectManufacturer")}</option>
              {models.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>,
          )}
          {fieldBlock(
            t("engineInfo"),
            <select
              className={selectClass}
              value={vehicleId || engineInfo}
              onChange={(e) => {
                const selected = engines.find((item) => item.id === e.target.value);
                if (selected) selectEngine(selected);
                else selectEngine(null);
              }}
              disabled={!model}
            >
              <option value="">{model ? t("engineInfo") : t("selectModel")}</option>
              {engines.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {formatEngineOptionLabel(engine)}
                </option>
              ))}
            </select>,
          )}
          {fieldBlock(
            t("productGroup"),
            <select
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t("allGroups")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {resolveCategoryLabel(cat.slug, locale, cat.name)}
                </option>
              ))}
            </select>,
          )}
          {fieldBlock(
            t("generalSearchLabel"),
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("generalSearchPlaceholder")}
              className={inputClass}
            />,
          )}
          {fieldBlock(
            t("skuSearch"),
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder={t("skuPlaceholder")}
              className={`${inputClass} font-mono uppercase`}
            />,
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full bg-brand-brown py-6 text-sm font-bold uppercase tracking-wide hover:bg-brand-brown-dark"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("startSearch")}
          </Button>
        </>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            {fieldBlock(
              t("skuSearch"),
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder={t("skuPlaceholder")}
                className={`${inputClass} font-mono uppercase`}
              />,
            )}
            {fieldBlock(
              t("oemSearch"),
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("oemPlaceholder")}
                className={inputClass}
              />,
            )}
            {fieldBlock(
              t("manufacturer"),
              <select
                className={selectClass}
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setModel("");
                  selectEngine(null);
                }}
              >
                <option value="">{t("selectManufacturer")}</option>
                {makes.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>,
            )}
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="h-11 w-full bg-brand-brown px-8 text-sm font-bold uppercase tracking-wide hover:bg-brand-brown-dark lg:w-auto"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("searchSubmit")}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            {fieldBlock(
              t("model"),
              <select
                className={selectClass}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  selectEngine(null);
                }}
                disabled={!make}
              >
                <option value="">{make ? t("model") : t("selectManufacturer")}</option>
                {models.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>,
            )}
            {fieldBlock(
              t("engineInfo"),
              <select
                className={selectClass}
                value={vehicleId || engineInfo}
                onChange={(e) => {
                  const selected = engines.find((item) => item.id === e.target.value);
                  if (selected) selectEngine(selected);
                  else selectEngine(null);
                }}
                disabled={!model}
              >
                <option value="">{model ? t("engineInfo") : t("selectModel")}</option>
                {engines.map((engine) => (
                  <option key={engine.id} value={engine.id}>
                    {formatEngineOptionLabel(engine)}
                  </option>
                ))}
              </select>,
            )}
            {fieldBlock(
              t("productGroup"),
              <select
                className={selectClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t("allGroups")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {resolveCategoryLabel(cat.slug, locale, cat.name)}
                  </option>
                ))}
              </select>,
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={clearFilters}
              className="h-11 w-full border-zinc-900 bg-zinc-900 px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-zinc-800 lg:w-auto"
            >
              {t("clearFilters")}
            </Button>
          </div>
        </>
      )}

      {activeFilters.length > 0 && (
        <div className={`pt-2 ${isSidebar ? "border-t border-border" : ""}`}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-brown-dark">
            {t("selectedFilters")}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => removeFilter(chip.key)}
                className="inline-flex items-center gap-1.5 rounded bg-brand-cream px-2.5 py-1 text-xs font-semibold text-brand-brown-dark transition hover:bg-brand-cream-light"
              >
                {chip.label}
                <X className="h-3 w-3 opacity-60" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              {t("clearAll")}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export function CatalogSearchPanel({ categories }: { categories: Category[] }) {
  const t = useTranslations("catalog");
  const search = useCatalogSearch(categories);

  return (
    <section className="catalog-search-ytt border-b border-brand-cream-dark/50 bg-white py-8 md:py-10">
      <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-brown-dark md:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("landingHint")}</p>
        </div>
        <CatalogSearchFields {...search} categories={categories} variant="hero" />
      </div>
    </section>
  );
}

export function CatalogSearchSidebar({ categories }: { categories: Category[] }) {
  const search = useCatalogSearch(categories);

  return (
    <aside className="catalog-search-sidebar rounded-lg border border-border bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
      <CatalogSearchFields {...search} categories={categories} variant="sidebar" />
    </aside>
  );
}

export function CatalogCategoryTiles({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function selectCategory(slug: string) {
    startTransition(() => {
      router.push(`/${locale}/urunler?category=${slug}`);
    });
  }

  return (
    <div className="catalog-category-ytt border-b border-border bg-brand-cream-light/30 py-8">
      <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-brand-brown">
          {t("categoryBrowseTitle")}
        </p>
        <p className="mb-5 text-sm text-brand-brown-dark/80">{t("categoryBrowseHint")}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const imageSrc = cat.displayImage || cat.image;
            const categoryName = resolveCategoryLabel(cat.slug, locale, cat.name);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={`group flex flex-col overflow-hidden rounded-md border border-border bg-white text-left shadow-sm transition hover:shadow-md ${
                  isActive ? "ring-2 ring-brand-brown" : ""
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={categoryName}
                      fill
                      className="object-contain p-3 transition duration-300 group-hover:scale-105"
                      sizes="(max-width:640px) 50vw, 200px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-3xl">📦</span>
                  )}
                </div>
                <div className="flex min-h-[3.25rem] items-center justify-center bg-zinc-700 px-2 py-2 text-center">
                  <span className="line-clamp-2 text-[10px] font-bold uppercase leading-snug text-white sm:text-[11px] md:text-xs">
                    {categoryName}
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
