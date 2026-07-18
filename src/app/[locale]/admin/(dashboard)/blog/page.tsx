"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload";
import {
  LocalizedRichContentFields,
  LocalizedTextFields,
} from "@/components/admin/localized-text-fields";
import {
  AdminPreviewModal,
  BlogPreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";
import type { AppLocale } from "@/i18n/routing";
import {
  emptyLocalizedContent,
  parseLocalizedContent,
} from "@/lib/i18n/localized-content";

type BlogPost = {
  id: string;
  slug: string;
  title: Record<string, string>;
  excerpt?: Record<string, string> | null;
  content: Record<string, string>;
  coverImage?: string | null;
  isPublished: boolean;
};

const emptyForm = {
  title: emptyLocalizedContent(),
  excerpt: emptyLocalizedContent(),
  content: emptyLocalizedContent(),
  coverImage: "",
  isPublished: true,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/blog");
    setPosts(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: parseLocalizedContent(post.title),
      excerpt: parseLocalizedContent(post.excerpt),
      content: parseLocalizedContent(post.content),
      coverImage: post.coverImage || "",
      isPublished: post.isPublished,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId ? `/api/admin/blog/${editingId}` : "/api/admin/blog";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    cancelEdit();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yazı silinsin mi?")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    load();
  }

  function openPreviewFromPost(post: BlogPost) {
    setForm({
      title: parseLocalizedContent(post.title),
      excerpt: parseLocalizedContent(post.excerpt),
      content: parseLocalizedContent(post.content),
      coverImage: post.coverImage || "",
      isPublished: post.isPublished,
    });
    setPreviewOpen(true);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Blog</h1>
      <p className="mb-6 text-sm text-muted">Kapak görseli ve içerik görselleri ekleyebilirsiniz</p>

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-semibold text-brand-brown-dark">
              {editingId ? "Yazıyı Düzenle" : "Yeni Yazı"}
            </h2>

            <LocalizedTextFields
              label="Başlık"
              values={form.title}
              onChange={(lang: AppLocale, value) =>
                setForm((prev) => ({
                  ...prev,
                  title: { ...prev.title, [lang]: value },
                }))
              }
              requiredLocale="tr"
            />

            <ImageUploadField
              label="Kapak Görseli"
              value={form.coverImage}
              onChange={(coverImage) => setForm({ ...form, coverImage })}
              hint="Blog listesinde ve yazı detayında gösterilir"
            />

            <LocalizedTextFields
              label="Özet"
              values={form.excerpt}
              onChange={(lang: AppLocale, value) =>
                setForm((prev) => ({
                  ...prev,
                  excerpt: { ...prev.excerpt, [lang]: value },
                }))
              }
            />

            <LocalizedRichContentFields
              label="İçerik"
              values={form.content}
              onChange={(lang: AppLocale, value) =>
                setForm((prev) => ({
                  ...prev,
                  content: { ...prev.content, [lang]: value },
                }))
              }
              rows={8}
              requiredLocale="tr"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Yayında
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Güncelle" : "Yayınla"}
              </Button>
              <PreviewButton onClick={() => setPreviewOpen(true)} />
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <AdminPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Blog Yazısı Önizlemesi"
      >
        <BlogPreview
          title={form.title.tr}
          excerpt={form.excerpt.tr}
          content={form.content.tr}
          coverImage={form.coverImage}
        />
      </AdminPreviewModal>

      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-cream-light">
              {post.coverImage ? (
                <Image src={post.coverImage} alt="" fill className="object-cover" sizes="96px" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">Görsel yok</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-brown-dark">{post.title.tr}</p>
              <p className="text-xs text-muted">{post.isPublished ? "Yayında" : "Taslak"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(post)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPreviewFromPost(post)}
                title="Önizle"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
