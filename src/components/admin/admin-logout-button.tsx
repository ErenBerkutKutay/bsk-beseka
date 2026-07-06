"use client";

import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const locale = useLocale();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-brand-cream/30 bg-transparent text-white hover:bg-white/10"
      onClick={() => signOut({ callbackUrl: `/${locale}/admin/giris` })}
    >
      <LogOut className="h-4 w-4" />
      Çıkış
    </Button>
  );
}
