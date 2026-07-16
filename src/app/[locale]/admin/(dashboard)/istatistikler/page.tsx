"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Card, CardContent } from "@/components/ui/input";

type HomeStat = {
  id: string;
  value: string;
  label: string;
  sub: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  value: "",
  label: "",
  sub: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminHomeStatsPage() {
  const [stats, setStats] = useState<HomeStat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    const res = await fetch("/api/admin/home-stats");
    if (!res.ok) {
      setLoadError("İstatistik listesi yüklenemedi. Oturum açık olduğundan emin olun.");
      setStats([]);
      return;
    }
    const data = await res.json();
    setStats(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(stat: HomeStat) {
    setEditingId(stat.id);
    setForm({
      value: stat.value,
      label: stat.label,
      sub: stat.sub,
      sortOrder: stat.sortOrder,
      isActive: stat.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value.trim() || !form.label.trim() || !form.sub.trim()) return;

    setSaving(true);

    const payload = {
      value: form.value.trim(),
      label: form.label.trim(),
      sub: form.sub.trim(),
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };

    if (editingId) {
      await fetch(`/api/admin/home-stats/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/home-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    cancelEdit();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu istatistik silinsin mi?")) return;
    await fetch(`/api/admin/home-stats/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-brown-dark">Ana Sayfa İstatistikleri</h1>
      <p className="mb-6 text-sm text-muted">
        Ana sayfadaki kırmızı istatistik şeridini (40+ Ülke, 5.000+ Ref vb.) buradan düzenleyin.
      </p>

      {loadError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <Card className="mb-8">
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-semibold text-brand-brown-dark">
              {editingId ? "İstatistik Düzenle" : "Yeni İstatistik Ekle"}
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Değer</Label>
                <Input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="mt-1.5"
                  placeholder="40+"
                  required
                />
              </div>
              <div>
                <Label>Başlık</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="mt-1.5"
                  placeholder="Ülke"
                  required
                />
              </div>
              <div>
                <Label>Alt açıklama</Label>
                <Input
                  value={form.sub}
                  onChange={(e) => setForm({ ...form, sub: e.target.value })}
                  className="mt-1.5"
                  placeholder="5 Kıtada Hizmet"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="mt-1.5"
                  min={0}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-brand-brown"
                  />
                  Yayında
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={saving || !form.value.trim() || !form.label.trim() || !form.sub.trim()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Güncelle" : "İstatistik Ekle"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-brand-brown text-white">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {(stats.length ? stats.filter((s) => s.isActive) : []).map((stat) => (
            <div key={stat.id} className="px-6 py-8 text-center">
              <div className="text-2xl font-black text-brand-cream md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm font-semibold uppercase tracking-wider">{stat.label}</div>
              <div className="mt-1 text-xs text-brand-cream/70">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {stats.map((stat) => (
          <li
            key={stat.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-white p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-brown-dark">
                <span className="text-lg font-black text-brand-brown">{stat.value}</span>{" "}
                {stat.label}
              </p>
              <p className="text-sm text-muted">
                {stat.sub} · Sıra: {stat.sortOrder}
                {!stat.isActive && " · Pasif"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(stat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(stat.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </li>
        ))}
        {!stats.length && !loadError && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted">
            Henüz istatistik yok. Yukarıdan ekleyin veya{" "}
            <code className="rounded bg-brand-cream-light px-1.5 py-0.5">npm run db:seed</code> ile
            varsayılanları yükleyin.
          </p>
        )}
      </ul>
    </div>
  );
}
