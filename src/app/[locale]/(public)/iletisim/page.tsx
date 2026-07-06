import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">İletişim</h1>
      <div className="mb-8 rounded-xl bg-zinc-50 p-6">
        <p className="font-medium">+90 (224) 482 44 55</p>
        <p className="mt-2">info@beseka.com</p>
        <p className="mt-2 text-sm text-zinc-500">
          Bursa, Türkiye — Otomotiv yedek parça üretim tesisleri
        </p>
      </div>
      <form className="space-y-4 rounded-xl border border-zinc-200 p-6">
        <div>
          <Label>Ad Soyad</Label>
          <Input name="name" required />
        </div>
        <div>
          <Label>E-posta</Label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <Label>Konu</Label>
          <Input name="subject" />
        </div>
        <div>
          <Label>Mesaj</Label>
          <Textarea name="message" rows={5} required />
        </div>
        <Button type="submit">Mesaj Gönder</Button>
      </form>
    </div>
  );
}
