"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type VehicleMake = {
  id: string;
  name: string;
  models: {
    id: string;
    name: string;
    subModels: { id: string; name: string }[];
  }[];
};

export function VehicleSearchWidget({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("home");
  const tc = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleMake[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [subModel, setSubModel] = useState("");
  const [oem, setOem] = useState("");

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, []);

  const selectedMake = vehicles.find((v) => v.name === make);
  const selectedModel = selectedMake?.models.find((m) => m.name === model);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (oem) params.set("q", oem);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (subModel) params.set("subModel", subModel);
    router.push(`/${locale}/urunler?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg ${compact ? "" : "mx-auto max-w-4xl"}`}
    >
      <h3 className="mb-4 text-lg font-bold">{t("searchTitle")}</h3>
      <div className={`grid gap-4 ${compact ? "md:grid-cols-2" : "md:grid-cols-5"}`}>
        <div className="md:col-span-2">
          <Label>{tc("oemSearch")}</Label>
          <Input
            value={oem}
            onChange={(e) => setOem(e.target.value)}
            placeholder="12 34-56.78"
          />
        </div>
        <div>
          <Label>{tc("manufacturer")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
              setSubModel("");
            }}
          >
            <option value="">{tc("selectManufacturer")}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{tc("model")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setSubModel("");
            }}
            disabled={!make}
          >
            <option value="">{make ? tc("model") : tc("selectManufacturer")}</option>
            {selectedMake?.models.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{tc("subModel")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            value={subModel}
            onChange={(e) => setSubModel(e.target.value)}
            disabled={!model}
          >
            <option value="">{model ? tc("subModel") : tc("selectModel")}</option>
            {selectedModel?.subModels.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="mt-4">
        {tc("title") ? "Ara" : "Search"}
      </Button>
    </form>
  );
}
