"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import {
  AdminPreviewModal,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";
import { HomeContactPreview } from "@/components/home/home-contact-preview";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";

type HomeContactForm = {
  eyebrow: Record<AppLocale, string>;
  title: Record<AppLocale, string>;
  companyName: Record<AppLocale, string>;
  address: Record<AppLocale, string>;
  phone: string;
  email: string;
  image: string;
  buttonLabel: Record<AppLocale, string>;
  buttonHref: string;
  textPanelEnabled: boolean;
  textPanelColor: string;
  textPanelOpacity: number;
  isActive: boolean;
};

function pickText(values: Record<AppLocale, string>) {
  return values.tr || values.en || Object.values(values).find(Boolean) || "";
}

export default function AdminHomeContactPage() {
  const [form, setForm] = useState<HomeContactForm>({
    eyebrow: emptyLocalizedContent(),
    title: emptyLocalizedContent(),
    companyName: emptyLocalizedContent(),
    address: emptyLocalizedContent(),
    phone: "",
    email: "",
    image: "",
    buttonLabel: emptyLocalizedContent(),
    buttonHref: "/iletisim/bilgiler",
    textPanelEnabled: true,
    textPanelColor: "#3d2b1f",
    textPanelOpacity: 75,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewProps = useMemo(
    () => ({
      eyebrow: pickText(form.eyebrow),
      title: pickText(form.title),
      companyName: pickText(form.companyName),
      address: pickText(form.address),
      phone: form.phone,
      email: form.email,
      image: form.image,
      buttonLabel: pickText(form.buttonLabel),
      textPanelEnabled: form.textPanelEnabled,
      textPanelColor: form.textPanelColor,
      textPanelOpacity: form.textPanelOpacity,
    }),
    [form],
  );

  async function load() {
    setLoading(true);
    setLoadError(null);

    const res = await fetch("/api/admin/home-contact");
    if (!res.ok) {
      setLoadError("İçerik yüklenemedi.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setForm({
      eyebrow: parseLocalizedContent(data.eyebrow),
      title: parseLocalizedContent(data.title),
      companyName: parseLocalizedContent(data.companyName),
      address: parseLocalizedContent(data.address),
      phone: data.phone || "",
      email: data.email || "",
      image: data.image || "",
      buttonLabel: parseLocalizedContent(data.buttonLabel),
      buttonHref: data.buttonHref || "/iletisim/bilgiler",
      textPanelEnabled: data.textPanelEnabled !== false,
      textPanelColor: data.textPanelColor || "#3d2b1f",
      textPanelOpacity: data.textPanelOpacity ?? 75,
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

    const res = await fetch("/api/admin/home-contact", {
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Ana Sayfa İletişim</h1>
          <p className="text-sm text-muted">
            Ana sayfadaki iletişim bölümünün arka plan görseli, metinleri ve metin paneli arka planını
            buradan düzenleyin.
          </p>
        </div>
        <PreviewButton onClick={() => setPreviewOpen(true)} />
      </div>

      {loadError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <form onSubmit={handleSave} className="space-y-5">
              <ImageUploadField
                label="Arka Plan Görseli"
                value={form.image}
                onChange={(image) => setForm((prev) => ({ ...prev, image }))}
                uploadFolder="beseka/cms"
                hint="Bölümün tam genişlik arka plan görseli (depo/fabrika vb.)"
              />

              <LocalizedTextFields
                label="Üst Başlık"
                values={form.eyebrow}
                onChange={(lang, value) =>
                  setForm((prev) => ({ ...prev, eyebrow: { ...prev.eyebrow, [lang]: value } }))
                }
                requiredLocale="tr"
                placeholder="Beseka"
              />

              <LocalizedTextFields
                label="Başlık"
                values={form.title}
                onChange={(lang, value) =>
                  setForm((prev) => ({ ...prev, title: { ...prev.title, [lang]: value } }))
                }
                requiredLocale="tr"
                placeholder="İletişim"
              />

              <LocalizedTextFields
                label="Firma Adı"
                values={form.companyName}
                onChange={(lang, value) =>
                  setForm((prev) => ({
                    ...prev,
                    companyName: { ...prev.companyName, [lang]: value },
                  }))
                }
                requiredLocale="tr"
              />

              <LocalizedTextFields
                label="Adres / Konum Metni"
                values={form.address}
                onChange={(lang, value) =>
                  setForm((prev) => ({ ...prev, address: { ...prev.address, [lang]: value } }))
                }
                multiline
                rows={2}
                requiredLocale="tr"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="mt-1.5"
                    placeholder="+90 (224) 482 44 55"
                    required
                  />
                </div>
                <div>
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1.5"
                    placeholder="info@beseka.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <LocalizedTextFields
                  label="Buton Metni"
                  values={form.buttonLabel}
                  onChange={(lang, value) =>
                    setForm((prev) => ({
                      ...prev,
                      buttonLabel: { ...prev.buttonLabel, [lang]: value },
                    }))
                  }
                  requiredLocale="tr"
                />
                <div>
                  <Label>Buton Linki</Label>
                  <Input
                    value={form.buttonHref}
                    onChange={(e) => setForm((prev) => ({ ...prev, buttonHref: e.target.value }))}
                    className="mt-1.5 font-mono text-sm"
                    placeholder="/iletisim/bilgiler"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="mb-3 font-semibold text-brand-brown-dark">Metin Paneli Arka Planı</h3>
                <p className="mb-4 text-sm text-muted">
                  Metinlerin okunabilirliği için sol taraftaki içerik bloğunun arkasına yarı saydam bir
                  panel ekleyebilirsiniz.
                </p>

                <label className="mb-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.textPanelEnabled}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, textPanelEnabled: e.target.checked }))
                    }
                  />
                  Metin paneli arka planını göster
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Panel Rengi</Label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        type="color"
                        value={form.textPanelColor}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, textPanelColor: e.target.value }))
                        }
                        className="h-10 w-14 cursor-pointer rounded border border-zinc-300"
                      />
                      <Input
                        value={form.textPanelColor}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, textPanelColor: e.target.value }))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Panel Opaklığı (%{form.textPanelOpacity})</Label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.textPanelOpacity}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          textPanelOpacity: Number(e.target.value),
                        }))
                      }
                      className="mt-3 w-full"
                    />
                  </div>
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

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-border bg-brand-brown px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Canlı Önizleme</h2>
              <p className="text-xs text-brand-cream/80">Türkçe metinlerle site görünümü</p>
            </div>
            <div className="overflow-hidden rounded-b-xl">
              <HomeContactPreview {...previewProps} compact />
            </div>
          </Card>
        </div>
      </div>

      <AdminPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Ana Sayfa İletişim Önizlemesi"
      >
        <HomeContactPreview {...previewProps} />
      </AdminPreviewModal>
    </div>
  );
}
