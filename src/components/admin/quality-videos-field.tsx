"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LocalizedTextFields } from "@/components/admin/localized-text-fields";
import type { AppLocale } from "@/i18n/routing";
import { emptyLocalizedContent } from "@/lib/i18n/localized-content";
import type { QualityPageVideo } from "@/lib/quality/page-metadata";
import { getLocalizedText } from "@/lib/utils";
import { isValidYouTubeUrl, parseYouTubeVideoId } from "@/lib/youtube/parse-url";

type QualityVideosFieldProps = {
  videos: QualityPageVideo[];
  onChange: (videos: QualityPageVideo[]) => void;
};

export function QualityVideosField({ videos, onChange }: QualityVideosFieldProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = videos.find((video) => video.id === editingId);
  const draft = editing ?? {
    id: "",
    title: emptyLocalizedContent(),
    youtubeUrl: "",
    sortOrder: videos.length,
  };

  function updateDraft(partial: Partial<QualityPageVideo>) {
    if (!editingId) return;
    onChange(videos.map((video) => (video.id === editingId ? { ...video, ...partial } : video)));
  }

  function startNew() {
    const id = crypto.randomUUID();
    onChange([
      ...videos,
      {
        id,
        title: emptyLocalizedContent(),
        youtubeUrl: "",
        sortOrder: videos.length,
      },
    ]);
    setEditingId(id);
  }

  function removeVideo(id: string) {
    onChange(videos.filter((video) => video.id !== id));
    if (editingId === id) setEditingId(null);
  }

  const draftVideoId = parseYouTubeVideoId(draft.youtubeUrl);
  const draftUrlValid = !draft.youtubeUrl.trim() || isValidYouTubeUrl(draft.youtubeUrl);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>YouTube Videoları</Label>
          <p className="mt-1 text-xs text-muted">
            YouTube video linki ekleyin. Videolar sayfada doğrudan oynatılır.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={startNew} className="gap-1">
          <Plus className="h-4 w-4" />
          Video Ekle
        </Button>
      </div>

      {(editingId || videos.length === 0) && (
        <div className="space-y-4 rounded-xl border border-border bg-brand-cream-light/40 p-4">
          <LocalizedTextFields
            label="Video Başlığı"
            values={draft.title}
            onChange={(lang: AppLocale, value) => {
              if (editingId) {
                updateDraft({ title: { ...draft.title, [lang]: value } });
              }
            }}
            requiredLocale="tr"
          />

          <div>
            <Label>YouTube Linki</Label>
            <Input
              value={draft.youtubeUrl}
              onChange={(e) => editingId && updateDraft({ youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-2"
            />
            {!draftUrlValid && (
              <p className="mt-1 text-xs text-red-600">Geçerli bir YouTube linki girin.</p>
            )}
            {draftVideoId && (
              <p className="mt-1 text-xs text-green-700">Video tanındı: {draftVideoId}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              youtube.com/watch, youtu.be ve shorts linkleri desteklenir.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Sıra</Label>
              <Input
                type="number"
                value={draft.sortOrder}
                onChange={(e) =>
                  editingId && updateDraft({ sortOrder: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
              Düzenlemeyi Kapat
            </Button>
          )}
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid gap-3">
          {videos.map((video) => {
            const videoId = parseYouTubeVideoId(video.youtubeUrl);
            return (
              <div
                key={video.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-brown-dark">
                    {getLocalizedText(video.title, "tr") || "Başlıksız video"}
                  </p>
                  <p className="truncate text-xs text-muted">{video.youtubeUrl || "Link yok"}</p>
                  {videoId ? (
                    <p className="mt-1 text-xs text-green-700">ID: {videoId}</p>
                  ) : (
                    <p className="mt-1 text-xs text-red-600">Geçersiz YouTube linki</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(video.id)}>
                    Düzenle
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeVideo(video.id)}
                    className="text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
