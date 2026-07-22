"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatEngineOptionLabel } from "@/lib/catalog/vehicle-options";

type VehicleOption = { id: string; name: string };
type EngineOption = VehicleOption & {
  tipNo: number;
  yearFrom?: number | null;
  yearTo?: number | null;
  kw?: number | null;
  hp?: number | null;
};

export function VehicleSearchWidget({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("home");
  const tc = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [engines, setEngines] = useState<EngineOption[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engineInfo, setEngineInfo] = useState("");
  const [vehicleId, setVehicleId] = useState("");
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
      .catch(() => setMakes([]));
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

  function selectEngine(option: EngineOption | null) {
    if (!option?.tipNo) {
      setVehicleId("");
      setEngineInfo("");
      return;
    }
    setVehicleId(String(option.tipNo));
    setEngineInfo(option.name);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (oem) params.set("q", oem);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (engineInfo) params.set("engineInfo", engineInfo);
    if (vehicleId) params.set("vehicleId", vehicleId);
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
            placeholder={tc("oemWidgetPlaceholder")}
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
              selectEngine(null);
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
              selectEngine(null);
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
          <Label>{tc("engineInfo")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            value={vehicleId || engineInfo}
            onChange={(e) => {
              const selected = engines.find((item) => item.id === e.target.value);
              if (selected) selectEngine(selected);
              else selectEngine(null);
            }}
            disabled={!model}
          >
            <option value="">{model ? tc("engineInfo") : tc("selectModel")}</option>
            {engines.map((engine) => (
              <option key={engine.id} value={engine.id}>
                {formatEngineOptionLabel(engine)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="mt-4">
        {tCommon("search")}
      </Button>
    </form>
  );
}
