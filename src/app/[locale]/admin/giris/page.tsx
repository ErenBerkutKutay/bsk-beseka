"use client";

import Image from "next/image";
import { signIn, getSession, signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { besekaAssets } from "@/lib/beseka/assets";

export default function AdminLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user?.role === "ADMIN") {
        router.replace(`/${locale}/admin`);
      } else {
        setChecking(false);
      }
    });
  }, [locale, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    if (session?.user?.role !== "ADMIN") {
      await signOut({ redirect: false });
      setError("Bu hesabın admin yetkisi yok.");
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin`);
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream-light">
        <Loader2 className="h-8 w-8 animate-spin text-brand-brown" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-cream-light via-white to-brand-cream-light/60 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src={besekaAssets.logo}
            alt="Beseka"
            width={160}
            height={36}
            className="mx-auto h-9 w-[148px] object-contain"
          />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-brown-mid">
            Yönetim Paneli
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-white p-8 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-brown text-brand-cream">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-brown-dark">Admin Girişi</h1>
              <p className="text-xs text-muted">Ürün ve içerik yönetimi</p>
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="admin@beseka.com"
              required
              autoComplete="username"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <a href={`/${locale}`} className="text-brand-brown hover:underline">
            ← Siteye dön
          </a>
        </p>
      </div>
    </div>
  );
}
