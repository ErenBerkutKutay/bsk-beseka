"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import { getLocalizedText } from "@/lib/utils";
import {
  ImageGalleryField,
  ImageUploadField,
} from "@/components/admin/image-upload";
import {
  LocalizedRichContentFields,
  LocalizedTextFields,
} from "@/components/admin/localized-text-fields";
import {
  AdminPreviewModal,
  PagePreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";
import {
  DEFAULT_MAP_EMBED_URL,
  DEFAULT_MAP_LINK,
  contactRouteSlug,
  type ContactPageMetadata,
  type ContactPageTemplate,
} from "@/lib/contact/page-metadata";

type Page = {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  metadata?: ContactPageMetadata | null;
  heroImage?: string | null;
  images: string[];
  sortOrder?: number;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  role?: Record<string, string> | null;
  sortOrder: number;
  isActive: boolean;
};

const templateLabels: Record<ContactPageTemplate, string> = {
  info: "İletişim Bilgileri",
  message: "Mesaj Gönder",
  directions: "Nasıl Gidilir",
};

function emptyMetadata(template: ContactPageTemplate = "info"): ContactPageMetadata {
  return {
    template,
    subtitle: { tr: "" },
    teamSectionTitle: { tr: "Satış Ekibi" },
    companyName: "Beseka Otomotiv San. ve Tic. Ltd. Şti.",
    address: "",
    postalCode: "",
    gps: "",
    phone: "+90 (224) 482 44 55",
    fax: "",
    email: "info@beseka.com",
    mapLink: DEFAULT_MAP_LINK,
    mapEmbedUrl: DEFAULT_MAP_EMBED_URL,
    formIntroTitle: { tr: "Sizi Dinliyoruz!" },
    kvkkHref: "/tr/kurumsal/kvkk",
  };
}

export default function AdminContactPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Page | null>(null);
  const [title, setTitle] = useState(emptyLocalizedContent());
  const [content, setContent] = useState(emptyLocalizedContent());
  const [metadata, setMetadata] = useState<ContactPageMetadata>(emptyMetadata());
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [routeSlug, setRouteSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");

  async function loadTeam() {
    const res = await fetch("/api/admin/contact-team");
    if (res.ok) setTeamMembers(await res.json());
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      let res = await fetch("/api/admin/pages?type=CONTACT");
      if (!res.ok) throw new Error("Sayfalar yüklenemedi");
      let data: Page[] = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        await fetch("/api/admin/pages/ensure-defaults", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "contact" }),
        });
        res = await fetch("/api/admin/pages?type=CONTACT");
        data = await res.json();
      }

      setPages(Array.isArray(data) ? data : []);
      await loadTeam();
    } catch {
      setError("İletişim sayfaları yüklenemedi. Veritabanı şemasının güncel olduğundan emin olun.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectPage(page: Page) {
    setSelected(page);
    setTitle(parseLocalizedContent(page.title));
    setContent(parseLocalizedContent(page.content));
    setMetadata({ ...emptyMetadata("info"), ...(page.metadata || {}) });
    setHeroImage(page.heroImage || "");
    setImages(page.images || []);
    setRouteSlug(contactRouteSlug(page.slug));
    setSaved(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaved(false);

    await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        title,
        content,
        metadata,
        heroImage,
        images,
        isActive: true,
        sortOrder: selected.sortOrder ?? 0,
      }),
    });

    setSaving(false);
    setSaved(true);
    load();
  }

  async function handleCreate() {
    const nextRoute = routeSlug.trim() || `sayfa-${Date.now()}`;
    const nextTemplate = metadata.template || "info";
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: `iletisim-${nextRoute}`,
        type: "CONTACT",
        title: { tr: "Yeni İletişim Sayfası" },
        content: { tr: "" },
        metadata: emptyMetadata(nextTemplate),
        sortOrder: pages.length,
        isActive: true,
        images: [],
      }),
    });

    if (res.ok) {
      const page = await res.json();
      await load();
      selectPage(page);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`"${getLocalizedText(selected.title, "tr")}" sayfasını silmek istediğinize emin misiniz?`)) {
      return;
    }

    await fetch(`/api/admin/pages?id=${selected.id}`, { method: "DELETE" });
    setSelected(null);
    load();
  }

  async function saveTeamMember(member: TeamMember) {
    const isNew = member.id.startsWith("new-");
    const payload = {
      ...(isNew ? {} : { id: member.id }),
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      photo: member.photo || "",
      role: member.role || { tr: "" },
      sortOrder: member.sortOrder,
      isActive: member.isActive,
    };

    await fetch("/api/admin/contact-team", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    loadTeam();
  }

  async function deleteTeamMember(id: string) {
    if (!confirm("Bu kişiyi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/contact-team?id=${id}`, { method: "DELETE" });
    loadTeam();
  }

  function addTeamMember() {
    setTeamMembers((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: "",
        email: "",
        phone: "",
        photo: "",
        role: { tr: "" },
        sortOrder: prev.length,
        isActive: true,
      },
    ]);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown-dark">İletişim Sayfaları</h1>
          <p className="mt-2 text-sm text-muted">
            Menüdeki iletişim alt sayfalarını, ekip kişilerini ve harita ayarlarını buradan yönetin.
          </p>
        </div>
        <Button type="button" onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Sayfa
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p>{error}</p>
          <Button type="button" className="mt-4" onClick={load}>
            Tekrar Dene
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <ul className="space-y-2">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => selectPage(page)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selected?.id === page.id
                      ? "border-brand-brown bg-brand-cream-light font-medium text-brand-brown-dark"
                      : "border-border bg-white hover:border-brand-cream"
                  }`}
                >
                  {getLocalizedText(page.title, "tr")}
                  <span className="mt-1 block text-xs text-muted">
                    /iletisim/{contactRouteSlug(page.slug)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-brand-brown-dark">{selected.slug}</h2>
                  <Button type="button" variant="outline" onClick={handleDelete} className="gap-2 text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Sayfayı Sil
                  </Button>
                </div>

                <div>
                  <Label>Sayfa Türü</Label>
                  <select
                    className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                    value={metadata.template}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        template: e.target.value as ContactPageTemplate,
                      }))
                    }
                  >
                    {Object.entries(templateLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <LocalizedTextFields
                  label="Sayfa Başlığı"
                  values={title}
                  onChange={(lang: AppLocale, value) => setTitle((prev) => ({ ...prev, [lang]: value }))}
                  requiredLocale="tr"
                />

                <ImageUploadField
                  label="Kapak / Hero Görseli"
                  value={heroImage}
                  onChange={setHeroImage}
                  hint="Sayfa üstündeki büyük arka plan görseli"
                />

                <ImageGalleryField label="Galeri Görselleri" values={images} onChange={setImages} />

                <LocalizedRichContentFields
                  label={metadata.template === "directions" ? "Yol Tarifi Bölümleri (HTML)" : "Sayfa İçeriği"}
                  values={content}
                  onChange={(lang: AppLocale, value) => setContent((prev) => ({ ...prev, [lang]: value }))}
                  rows={12}
                  requiredLocale="tr"
                />

                {(metadata.template === "info" || metadata.template === "message") && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        value={metadata.phone || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>E-posta</Label>
                      <Input
                        value={metadata.email || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Adres</Label>
                      <Input
                        value={metadata.address || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Şirket Adı</Label>
                      <Input
                        value={metadata.companyName || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, companyName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Posta Kodu</Label>
                      <Input
                        value={metadata.postalCode || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, postalCode: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {metadata.template === "directions" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Google Maps Linki</Label>
                      <Input
                        value={metadata.mapLink || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, mapLink: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Harita Embed URL</Label>
                      <Input
                        value={metadata.mapEmbedUrl || ""}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, mapEmbedUrl: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-muted">
                        Sayfada açık harita olarak gösterilir. Varsayılan: Beseka konumu.
                      </p>
                    </div>
                  </div>
                )}

                {metadata.template === "info" && (
                  <div className="space-y-4 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-brand-brown-dark">Ulaşılabilir Kişiler</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addTeamMember} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Kişi Ekle
                      </Button>
                    </div>
                    {teamMembers.map((member, index) => (
                      <div key={member.id} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
                        <div>
                          <Label>Ad Soyad</Label>
                          <Input
                            value={member.name}
                            onChange={(e) =>
                              setTeamMembers((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)),
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>E-posta</Label>
                          <Input
                            value={member.email}
                            onChange={(e) =>
                              setTeamMembers((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, email: e.target.value } : item)),
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Telefon</Label>
                          <Input
                            value={member.phone || ""}
                            onChange={(e) =>
                              setTeamMembers((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, phone: e.target.value } : item)),
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Fotoğraf URL</Label>
                          <Input
                            value={member.photo || ""}
                            onChange={(e) =>
                              setTeamMembers((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, photo: e.target.value } : item)),
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap gap-2">
                          <Button type="button" size="sm" onClick={() => saveTeamMember(member)}>
                            Kişiyi Kaydet
                          </Button>
                          {!member.id.startsWith("new-") && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTeamMember(member.id)}
                              className="text-red-700"
                            >
                              Sil
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {saved && <p className="text-sm text-green-700">Kaydedildi.</p>}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                  <PreviewButton onClick={() => setPreviewOpen(true)} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-white p-12 text-muted">
              Düzenlemek için soldan bir sayfa seçin
            </div>
          )}
        </div>
      )}

      <AdminPreviewModal
        open={previewOpen && !!selected}
        onClose={() => setPreviewOpen(false)}
        title={selected ? `${title.tr} — Önizleme` : "Önizleme"}
      >
        {selected && (
          <PagePreview title={title.tr} content={content.tr} heroImage={heroImage} images={images} />
        )}
      </AdminPreviewModal>
    </div>
  );
}
