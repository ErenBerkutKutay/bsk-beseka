"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CATALOG_RESULTS_ID } from "@/lib/catalog/navigation";

const HEADER_OFFSET = 96;

function scrollToCatalogResults() {
  const el = document.getElementById(CATALOG_RESULTS_ID);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  return true;
}

function shouldScrollToResults(searchParams: URLSearchParams) {
  if (searchParams.get("scroll") === "results") return true;
  if (typeof window === "undefined") return false;
  return window.location.hash === `#${CATALOG_RESULTS_ID}`;
}

function cleanScrollMarkers() {
  const url = new URL(window.location.href);
  url.searchParams.delete("scroll");
  url.hash = "";
  const next = `${url.pathname}${url.search}`;
  window.history.replaceState(null, "", next);
}

export function CatalogScrollToResults() {
  const searchParams = useSearchParams();
  const paramKey = searchParams.toString();

  useEffect(() => {
    if (!shouldScrollToResults(searchParams)) return;

    let attempts = 0;
    const maxAttempts = 100;
    let cleaned = false;

    const tryScroll = () => {
      if (!scrollToCatalogResults()) return false;
      if (!cleaned) {
        cleanScrollMarkers();
        cleaned = true;
      }
      return true;
    };

    const timers = [
      window.setTimeout(() => tryScroll(), 0),
      window.setTimeout(() => tryScroll(), 150),
      window.setTimeout(() => tryScroll(), 400),
      window.setTimeout(() => tryScroll(), 800),
    ];

    const interval = window.setInterval(() => {
      attempts += 1;
      if (tryScroll() || attempts >= maxAttempts) {
        window.clearInterval(interval);
      }
    }, 50);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, [paramKey, searchParams]);

  return null;
}
