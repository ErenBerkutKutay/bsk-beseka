"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

const HEADER_OFFSET = 96;

export function CatalogScrollToResults() {
  const searchParams = useSearchParams();
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("scroll") !== "results") return;
    if (scrolledRef.current) return;

    const scrollToResults = () => {
      const el = document.getElementById("catalog-sonuclar");
      if (!el) return false;

      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      scrolledRef.current = true;

      const url = new URL(window.location.href);
      url.searchParams.delete("scroll");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);

      return true;
    };

    if (scrollToResults()) return;

    const interval = window.setInterval(() => {
      if (scrollToResults()) window.clearInterval(interval);
    }, 50);

    const timeout = window.setTimeout(() => window.clearInterval(interval), 4000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [searchParams]);

  return null;
}
