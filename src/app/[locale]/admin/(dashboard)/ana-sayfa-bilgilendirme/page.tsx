"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";

type HomeIntroForm = {
  eyebrow: Record<AppLocale, string>;
  title: Record<AppLocale, string>;
  body: Record<AppLocale, string>;
  subtitle: Record<AppLocale, string>;
  image: string;
  primaryLabel: Record<AppLocale, string>;
  primaryHref: string;
  secondaryLabel: Record<AppLocale, string>;
  secondaryHref: string;
  isActive: boolean;
};

export default function AdminHomeIntroPage() {
  const [form, setForm] = useState<HomeIntroForm>({
    eyebrow: emptyLocalizedContent(),
    title: emptyLocalizedContent(),
    body: emptyLocalizedContent(),
    subtitle: emptyLocalizedContent(),
    image: "",
    primaryLabel: emptyLocalizedContent(),
    primaryHref: "/kurumsal/hakkimizda",
    secondaryLabel: emptyLocalizedContent(),
    secondaryHref: "/urunler",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);

    const res = await fetch("/api/admin/home-intro");
    if (!res.ok) {
      setLoadError("İçerik yüklenemedi.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setForm({
      eyebrow: parseLocalizedContent(data.eyebrow),
      title: parseLocalizedContent(data.title),
      body: parseLocalizedContent(data.body),
      subtitle: parseLocalizedContent(data.subtitle),
      image: data.image || "",
      primaryLabel: parseLocalizedContent(data.primaryLabel),
      primaryHref: data.primaryHref || "/kurumsal/hakkimizda",
      secondaryLabel: parseLocalizedContent(data.secondaryLabel),
      secondaryHref: data.secondaryHref || "/urunler",
      isActive: data.isActive !== false,
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/admin/home-intro", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      alert("Kaydedilemedi. Türkçe alanların dolu olduğundan emin olun.");
      return;
    }

    setSaved(true);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Ana Sayfa Bilgilendirme</h1>
      <p className="mb-6 text-sm text-muted">
        Ana sayfadaki kurumsal tanıtım bölümünü (metin, görsel ve butonlar) buradan düzenleyin.
      </p>

      {loadError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <Card>
        <CardContent className="space-y-5 pt-6">
          <form onSubmit={handleSave} className="space-y-5">
            <LocalizedTextFields
              label="Üst Başlık"
              values={form.eyebrow}
              onChange={(lang, value) =>
                setForm((prev) => ({ ...prev, eyebrow: { ...prev.eyebrow, [lang]: value } }))
              }
              requiredLocale="tr"
              placeholder="Beseka Otomotiv"
            />

            <LocalizedTextFields
              label="Ana Başlık"
              values={form.title}
              onChange={(lang, value) =>
                setForm((prev) => ({ ...prev, title: { ...prev.title, [lang]: value } }))
              }
              requiredLocale="tr"
            />

            <LocalizedTextFields
              label="Açıklama Paragrafı"
              values={form.body}
              onChange={(lang, value) =>
                setForm((prev) => ({ ...prev, body: { ...prev.body, [lang]: value } }))
              }
              multiline
              rows={4}
              requiredLocale="tr"
            />

            <LocalizedTextFields
              label="Alt Açıklama"
              values={form.subtitle}
              onChange={(lang, value) =>
                setForm((prev) => ({ ...prev, subtitle: { ...prev.subtitle, [lang]: value } }))
              }
              multiline
              rows={3}
              requiredLocale="tr"
            />

            <ImageUploadField
              label="Sağ Görsel"
              value={form.image}
              onChange={(image) => setForm((prev) => ({ ...prev, image }))}
              uploadFolder="beseka/cms"
              hint="Ana sayfada metnin sağında gösterilir"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedTextFields
                label="Birinci Buton Metni"
                values={form.primaryLabel}
                onChange={(lang, value) =>
                  setForm((prev) => ({
                    ...prev,
                    primaryLabel: { ...prev.primaryLabel, [lang]: value },
                  }))
                }
                requiredLocale="tr"
              />
              <div>
                <Label>Birinci Buton Linki</Label>
                <Input
                  value={form.primaryHref}
                  onChange={(e) => setForm((prev) => ({ ...prev, primaryHref: e.target.value }))}
                  className="mt-1.5 font-mono text-sm"
                  placeholder="/kurumsal/hakkimizda"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <LocalizedTextFields
                label="İkinci Buton Metni"
                values={form.secondaryLabel}
                onChange={(lang, value) =>
                  setForm((prev) => ({
                    ...prev,
                    secondaryLabel: { ...prev.secondaryLabel, [lang]: value },
                  }))
                }
                requiredLocale="tr"
              />
              <div>
                <Label>İkinci Buton Linki</Label>
                <Input
                  value={form.secondaryHref}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, secondaryHref: e.target.value }))
                  }
                  className="mt-1.5 font-mono text-sm"
                  placeholder="/urunler"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Ana sayfada göster
            </label>

            {saved && <p className="text-sm text-green-700">Kaydedildi.</p>}

            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
