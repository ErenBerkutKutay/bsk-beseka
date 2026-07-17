"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type VehicleOption = { id: string; name: string };

export function VehicleSearchWidget({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("home");
  const tc = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [subModels, setSubModels] = useState<VehicleOption[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [subModel, setSubModel] = useState("");
  const [oem, setOem] = useState("");

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
            {makes.map((v) => (
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
            {models.map((m) => (
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
            {subModels.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="mt-4">
        Ara
      </Button>
    </form>
  );
}
