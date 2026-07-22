"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/input";
import { formatEngineOptionLabel } from "@/lib/catalog/vehicle-options";
import { formatYearRange } from "@/lib/catalog/fitment-display";

type VehicleOption = { id: string; name: string };

type EngineOption = {
  id: string;
  name: string;
  tipNo: number;
  yearFrom?: number | null;
  yearTo?: number | null;
  fuelType?: string | null;
  kw?: number | null;
  hp?: number | null;
};

export type SelectedVehicleLink = {
  tipNo: number;
  make: string;
  modelSeries: string;
  typeName: string;
  yearFrom?: number | null;
  yearTo?: number | null;
  fuelType?: string | null;
};

type VehicleCrossPickerProps = {
  selected: SelectedVehicleLink[];
  onChange: (next: SelectedVehicleLink[]) => void;
};

export function VehicleCrossPicker({ selected, onChange }: VehicleCrossPickerProps) {
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [engines, setEngines] = useState<EngineOption[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [loadingEngines, setLoadingEngines] = useState(false);

  const selectedTipNos = useMemo(() => new Set(selected.map((item) => item.tipNo)), [selected]);

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

    setLoadingEngines(true);
    fetch(`/api/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then((res) => res.json())
      .then(setEngines)
      .catch(() => setEngines([]))
      .finally(() => setLoadingEngines(false));
  }, [make, model]);

  function toggleEngine(engine: EngineOption) {
    if (selectedTipNos.has(engine.tipNo)) {
      onChange(selected.filter((item) => item.tipNo !== engine.tipNo));
      return;
    }

    onChange([
      ...selected,
      {
        tipNo: engine.tipNo,
        make,
        modelSeries: model,
        typeName: engine.name,
        yearFrom: engine.yearFrom,
        yearTo: engine.yearTo,
        fuelType: engine.fuelType,
      },
    ]);
  }

  function removeSelected(tipNo: number) {
    onChange(selected.filter((item) => item.tipNo !== tipNo));
  }

  const allEnginesSelected =
    engines.length > 0 && engines.every((engine) => selectedTipNos.has(engine.tipNo));

  function selectAllEngines() {
    const additions = engines
      .filter((engine) => !selectedTipNos.has(engine.tipNo))
      .map((engine) => ({
        tipNo: engine.tipNo,
        make,
        modelSeries: model,
        typeName: engine.name,
        yearFrom: engine.yearFrom,
        yearTo: engine.yearTo,
        fuelType: engine.fuelType,
      }));

    if (additions.length) {
      onChange([...selected, ...additions]);
    }
  }

  function deselectAllEngines() {
    const engineTipNos = new Set(engines.map((engine) => engine.tipNo));
    onChange(selected.filter((item) => !engineTipNos.has(item.tipNo)));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Marka</Label>
          <select
            className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
          >
            <option value="">Marka seçin</option>
            {makes.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Model</Label>
          <select
            className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown disabled:bg-zinc-100"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make}
          >
            <option value="">{make ? "Model seçin" : "Önce marka seçin"}</option>
            {models.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {model && (
        <div className="rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-brand-cream-light/50 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-brown-dark">
              Motor Bilgisi — tıklayarak seçin
            </span>
            {!loadingEngines && engines.length > 0 && (
              <button
                type="button"
                onClick={allEnginesSelected ? deselectAllEngines : selectAllEngines}
                className="shrink-0 text-xs font-semibold text-brand-brown transition hover:text-brand-brown-dark"
              >
                {allEnginesSelected ? "Tümünü Kaldır" : "Tümünü Seç"}
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loadingEngines ? (
              <div className="flex items-center justify-center py-8 text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : engines.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted">Bu model için motor bilgisi bulunamadı.</p>
            ) : (
              engines.map((engine) => {
                const isSelected = selectedTipNos.has(engine.tipNo);
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => toggleEngine(engine)}
                    className={`flex w-full items-start gap-3 border-b border-border/70 px-3 py-3 text-left text-sm transition last:border-0 hover:bg-brand-cream-light/40 ${
                      isSelected ? "bg-brand-cream-light/70" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-brand-brown bg-brand-brown text-white"
                          : "border-zinc-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-muted">Id: {engine.tipNo}</span>
                      <span className="mt-0.5 block font-medium text-brand-brown-dark">
                        {formatEngineOptionLabel(engine)}
                      </span>
                      {engine.fuelType && (
                        <span className="mt-0.5 block text-xs text-muted">{engine.fuelType}</span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-white">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-brown-dark">
          Seçili Araçlar ({selected.length})
        </div>
        {selected.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted">Henüz araç seçilmedi.</p>
        ) : (
          <ul className="max-h-56 divide-y divide-border overflow-y-auto">
            {selected.map((item) => (
              <li key={item.tipNo} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-brand-brown bg-brand-brown text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-muted">Id: {item.tipNo}</div>
                  <div className="font-medium text-brand-brown-dark">
                    {[item.make, item.modelSeries, item.typeName].filter(Boolean).join(" / ")}
                  </div>
                  <div className="text-xs text-muted">
                    {formatYearRange(item.yearFrom, item.yearTo)}
                    {item.fuelType ? ` · ${item.fuelType}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSelected(item.tipNo)}
                  className="rounded p-1 text-muted transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Seçimi kaldır"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
