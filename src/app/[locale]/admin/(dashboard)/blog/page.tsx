"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";
import {
  ImageGalleryField,
  ImageUploadField,
  RichContentEditor,
} from "@/components/admin/image-upload";
import {
  AdminPreviewModal,
  BlogPreview,
  PreviewButton,
} from "@/components/admin/admin-preview-modal";

type BlogPost = {
  id: string;
  slug: string;
  title: { tr: string };
  excerpt?: { tr: string } | null;
  content: { tr: string };
  coverImage?: string | null;
  isPublished: boolean;
};

const emptyForm = {
  titleTr: "",
  excerptTr: "",
  contentTr: "",
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
      titleTr: post.title.tr || "",
      excerptTr: post.excerpt?.tr || "",
      contentTr: post.content.tr || "",
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

          <div>
            <Label>Başlık</Label>
            <Input
              value={form.titleTr}
              onChange={(e) => setForm({ ...form, titleTr: e.target.value })}
              className="mt-1.5"
              required
            />
          </div>

          <ImageUploadField
            label="Kapak Görseli"
            value={form.coverImage}
            onChange={(coverImage) => setForm({ ...form, coverImage })}
            hint="Blog listesinde ve yazı detayında gösterilir"
          />

          <div>
            <Label>Özet</Label>
            <Input
              value={form.excerptTr}
              onChange={(e) => setForm({ ...form, excerptTr: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <RichContentEditor
            label="İçerik"
            value={form.contentTr}
            onChange={(contentTr) => setForm({ ...form, contentTr })}
            rows={8}
            required
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
          title={form.titleTr}
          excerpt={form.excerptTr}
          content={form.contentTr}
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
                onClick={() => {
                  setForm({
                    titleTr: post.title.tr || "",
                    excerptTr: post.excerpt?.tr || "",
                    contentTr: post.content.tr || "",
                    coverImage: post.coverImage || "",
                    isPublished: post.isPublished,
                  });
                  setPreviewOpen(true);
                }}
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
