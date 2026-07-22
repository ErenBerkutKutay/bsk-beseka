"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const emptyForm = {
  id: "",
  make: "",
  model: "",
  motorInfo: "",
  yearFrom: "",
  yearTo: "",
  engineVolumeL: "",
  engineVolumeCcm: "",
  fuelType: "",
  kw: "",
  hp: "",
  engineCodes: "",
};

type VehicleManualFormProps = {
  onSuccess?: () => void;
};

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = parseInt(trimmed, 10);
  return Number.isFinite(num) ? num : null;
}

function parseOptionalDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed.replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

export function VehicleManualForm({ onSuccess }: VehicleManualFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const id = parseInt(form.id.trim(), 10);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Geçerli bir Id girin.");
      return;
    }

    if (!form.make.trim() || !form.model.trim() || !form.motorInfo.trim()) {
      setError("Id, Marka, Model ve Motor Bilgisi zorunludur.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          make: form.make.trim(),
          model: form.model.trim(),
          motorInfo: form.motorInfo.trim(),
          yearFrom: parseOptionalInt(form.yearFrom),
          yearTo: parseOptionalInt(form.yearTo),
          engineVolumeL: parseOptionalDecimal(form.engineVolumeL),
          engineVolumeCcm: parseOptionalInt(form.engineVolumeCcm),
          fuelType: form.fuelType.trim() || null,
          kw: parseOptionalInt(form.kw),
          hp: parseOptionalInt(form.hp),
          engineCodes: form.engineCodes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.");
        return;
      }

      setSuccess(`Araç eklendi (Id: ${data.tipNo}).`);
      setForm(emptyForm);
      onSuccess?.();
    } catch {
      setError("Kayıt sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "mt-1.5 h-10 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Id *</Label>
          <Input
            value={form.id}
            onChange={(e) => updateField("id", e.target.value)}
            placeholder="145170"
            className={`${fieldClass} font-mono`}
            required
          />
        </div>
        <div>
          <Label>Marka *</Label>
          <Input
            value={form.make}
            onChange={(e) => updateField("make", e.target.value)}
            placeholder="ABARTH"
            className={fieldClass}
            required
          />
        </div>
        <div>
          <Label>Model *</Label>
          <Input
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
            placeholder="124 Spider"
            className={fieldClass}
            required
          />
        </div>
        <div>
          <Label>Motor Bilgisi *</Label>
          <Input
            value={form.motorInfo}
            onChange={(e) => updateField("motorInfo", e.target.value)}
            placeholder="1.4 (348)"
            className={fieldClass}
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Başlangıç Yılı</Label>
          <Input
            value={form.yearFrom}
            onChange={(e) => updateField("yearFrom", e.target.value)}
            placeholder="2016"
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <Label>Bitiş Yılı</Label>
          <Input
            value={form.yearTo}
            onChange={(e) => updateField("yearTo", e.target.value)}
            placeholder="2020"
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <Label>Motor Hacmi (l)</Label>
          <Input
            value={form.engineVolumeL}
            onChange={(e) => updateField("engineVolumeL", e.target.value)}
            placeholder="1.4"
            className={fieldClass}
            inputMode="decimal"
          />
        </div>
        <div>
          <Label>Motor Hacmi (ccm)</Label>
          <Input
            value={form.engineVolumeCcm}
            onChange={(e) => updateField("engineVolumeCcm", e.target.value)}
            placeholder="1368"
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Yakıt Tipi</Label>
          <Input
            value={form.fuelType}
            onChange={(e) => updateField("fuelType", e.target.value)}
            placeholder="Benzin"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>kW</Label>
          <Input
            value={form.kw}
            onChange={(e) => updateField("kw", e.target.value)}
            placeholder="125"
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <Label>HP</Label>
          <Input
            value={form.hp}
            onChange={(e) => updateField("hp", e.target.value)}
            placeholder="170"
            className={fieldClass}
            inputMode="numeric"
          />
        </div>
        <div>
          <Label>Motor Kodları</Label>
          <Input
            value={form.engineCodes}
            onChange={(e) => updateField("engineCodes", e.target.value)}
            placeholder="552 53 268"
            className={fieldClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
      )}

      <Button type="submit" disabled={saving} className="bg-brand-brown hover:bg-brand-brown-dark">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Araç Ekle
          </>
        )}
      </Button>
    </form>
  );
}
