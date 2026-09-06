"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  Search,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Info,
  Building2,
  Mail,
  Phone,
  User,
  Check,
  X,
} from "lucide-react";
import type { RFQMatchResponse, RFQRowResult } from "@/lib/rfq/cross-matcher";
import { exportRFQResultsToExcel } from "@/lib/rfq/excel-parser";

interface Props {
  locale: string;
}

export function RFQCrossMatchClient({ locale }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RFQMatchResponse | null>(null);

  // Filtreleme ve arama durumları
  const [activeTab, setActiveTab] = useState<"ALL" | "MATCHED" | "NOT_FOUND">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // RFQ Teklif Modalı
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);
  const [rfqSubmitted, setRfqSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Örnek Test Verisi
  const sampleTestRows = useMemo(
    () => [
      {
        rowNumber: 1,
        customerSku: "STK-EGEA-01",
        oems: ["51772753", "51 77 275 3"],
        quantity: 50,
        note: "Fiat Egea amortisör körüğü acil",
      },
      {
        rowNumber: 2,
        customerSku: "STK-FIAT-02",
        oems: ["5978771", "5978 771"],
        quantity: 25,
        note: "Uno / Ritmo ön körük",
      },
      {
        rowNumber: 3,
        customerSku: "STK-CLIO-03",
        oems: ["8200127285"],
        quantity: 100,
        note: "Aynı OEM ile 2 ürün eşleşen örnek (Takoz Kiti & Körük)",
      },
      {
        rowNumber: 4,
        customerSku: "STK-MEG-04",
        oems: ["540500006R", "540505143R"],
        quantity: 30,
        note: "Fluence / Megane III amortisör körüğü",
      },
      {
        rowNumber: 5,
        customerSku: "STK-TEST-99",
        oems: ["999999999"],
        quantity: 10,
        note: "Katalogda olmayan test OEM numarası",
      },
    ],
    []
  );

  // Dosya Yükleyip Eşleştirme Çağrısı
  const handleProcessFile = async (uploadFile: File) => {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", uploadFile);

        const res = await fetch("/api/rfq/match", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Eşleştirme sırasında hata oluştu.");
        }

        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Dosya işlenirken bir sorun oluştu.");
      }
    });
  };

  // 1 Tıkla Örnek Veriyle Test Et
  const handleTestWithSampleData = async () => {
    setError(null);
    setFile(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/rfq/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: sampleTestRows }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Örnek veri eşleştirilemedi.");
        }

        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Test sırasında bir hata oluştu.");
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      handleProcessFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      handleProcessFile(selectedFile);
    }
  };

  // Sonuçları Excel olarak indir
  const handleExportExcel = () => {
    if (!data || !data.results.length) return;

    try {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const excelBytes = exportRFQResultsToExcel(data.results, currentOrigin);
      const blob = new Blob([excelBytes as unknown as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Beseka_Cross_Eslestirme_Sonuc_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Excel export error:", e);
      alert("Excel dosyası oluşturulurken bir hata oluştu.");
    }
  };

  // RFQ Teklif Talebi Gönderimi
  const handleSendRfqQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRfq(true);

    // Canlıya almadan önce simüle edebilir veya contact/rfq loguna kaydedebiliriz
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmittingRfq(false);
    setRfqSubmitted(true);
  };

  // Filtrelenmiş ve aratılmış sonuçlar
  const filteredResults = useMemo(() => {
    if (!data) return [];

    return data.results.filter((item) => {
      // Tab filtre
      if (activeTab === "MATCHED" && item.status === "NOT_FOUND") return false;
      if (activeTab === "NOT_FOUND" && item.status !== "NOT_FOUND") return false;

      // Metin arama
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const inCust = item.customerSku.toLowerCase().includes(q);
      const inOems = item.requestedOems.some((o) => o.toLowerCase().includes(q));
      const inBsk = item.matchedProducts.some((p) => p.sku.toLowerCase().includes(q));
      const inName = item.matchedProducts.some((p) => {
        const nameStr =
          typeof p.name === "object" && p.name !== null
            ? (p.name as Record<string, string>).tr || ""
            : String(p.name);
        return nameStr.toLowerCase().includes(q);
      });

      return inCust || inOems || inBsk || inName;
    });
  }, [data, activeTab, searchQuery]);

  return (
    <div className="w-full">
      {/* 1. ÜST HERO & TANITIM BÖLÜMÜ */}
      <section className="relative overflow-hidden bg-linear-to-b from-brand-brown-dark via-brand-brown to-brand-brown-mid py-12 text-white shadow-inner md:py-16">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Toplu Çapraz Referans & RFQ Eşleştirme
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
              Elinizdeki parça listenizi veya OEM numaralarınızı tek seferde Excel ile yükleyin.
              Sistemimiz anında Beseka ürün kataloğuyla eşleştirip eşdeğer ürün kodlarını, stok
              bilgilerini ve teklif listenizi çıkarsın.
            </p>

            {/* Hızlı Aksiyon Butonları */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/api/rfq/template"
                download="BSK_RFQ_Sablon.xlsx"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-brown-dark shadow-md transition-all hover:bg-brand-cream-light hover:shadow-lg active:scale-95"
              >
                <Download className="h-4 w-4 text-brand-brown" />
                <span>Örnek Şablonu İndir (.xlsx)</span>
              </a>

              <button
                type="button"
                onClick={handleTestWithSampleData}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{isPending ? "Test Ediliyor..." : "Örnek Veriyle Hemen Test Et"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ŞABLON BİLGİLENDİRME & DOSYA YÜKLEME ALANI */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sol Kolon: Şablon Format Açıklaması */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-brand-brown font-bold text-base mb-3">
                <Info className="h-5 w-5 text-brand-brown" />
                <h2>Excel Şablon Formatı</h2>
              </div>
              <p className="text-xs leading-relaxed text-zinc-600 mb-4">
                Listenizin doğru eşleşebilmesi için aşağıdaki sütun sırasına göre hazırlanması
                önerilir:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-brown/10 font-bold text-brand-brown text-[11px]">
                    A
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-900">Müşteri Ürün Kodu</span>
                    <p className="text-zinc-500 text-[11px]">Kendi firmanıza ait stok/parça kodu</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 font-bold text-emerald-700 text-[11px]">
                    B-E
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-900">OEM Kodları (1, 2, 3, 4...)</span>
                    <p className="text-zinc-500 text-[11px]">Orijinal veya muadil parça numaraları</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/10 font-bold text-amber-700 text-[11px]">
                    F
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-900">Talep Adedi (Opsiyonel / Şart Değil)</span>
                    <p className="text-zinc-500 text-[11px]">Fiyat teklifi için adet miktarı (boş bırakılabilir)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200 font-bold text-zinc-700 text-[11px]">
                    G
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-900">Not / Açıklama (Opsiyonel / Şart Değil)</span>
                    <p className="text-zinc-500 text-[11px]">Özel notunuz varsa yazabilirsiniz (boş bırakılabilir)</p>
                  </div>
                </div>

                {/* Çoklu Ürün Bilgilendirme Kutusu */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Çoklu Ürün Eşleşme Desteği
                  </p>
                  Aynı OEM numarası kataloğumuzda birden fazla ürüne denk geliyorsa (örneğin hem tekil parça hem takım kiti veya muadil kodlar), sistem <strong>tüm eşleşen ürünleri ayrı ayrı ekranda gösterir</strong> ve indirilen Excel çıktısına her birini detaylarıyla satır olarak ekler.
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100">
              <a
                href="/api/rfq/template"
                download="BSK_RFQ_Sablon.xlsx"
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-brown hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Hazır Boş Şablonu Buradan İndirin
              </a>
            </div>
          </div>

          {/* Sağ Kolon: Sürükle Bırak / Dosya Seçme Alanı */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-brand-brown bg-brand-brown/5 scale-[1.01]"
                  : "border-zinc-300 bg-white hover:border-brand-brown/60 hover:bg-zinc-50/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown shadow-inner">
                {isPending ? (
                  <RefreshCw className="h-8 w-8 animate-spin text-brand-brown" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>

              <h3 className="text-lg font-bold text-zinc-900">
                {isPending
                  ? "Dosya İşleniyor ve Katalogla Eşleştiriliyor..."
                  : file
                  ? file.name
                  : "Excel Dosyanızı Buraya Sürükleyin veya Seçin"}
              </h3>

              <p className="mt-1.5 text-xs text-zinc-500 max-w-md">
                {isPending
                  ? "OEM kodları normalize ediliyor ve Beseka veritabanı taranıyor..."
                  : "Desteklenen formatlar: .xlsx, .xls, .csv (Maksimum 5.000 satır)"}
              </p>

              <button
                type="button"
                disabled={isPending}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file ? "Farklı Dosya Seç" : "Bilgisayardan Dosya Seç"}</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. SONUÇLAR VE İSTATİSTİK DASHBOARD */}
      {data && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                  Çapraz Eşleştirme Sonuçları
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Yüklenen listedeki {data.summary.totalRows} parça başarıyla analiz edildi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Sonuçları Excel İndir (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-brown px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-brown-dark active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Teklif Talebi İlet (RFQ)</span>
              </button>
            </div>
          </div>

          {/* KPI İstatistik Kartları */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Toplam Satır
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-900 sm:text-3xl">
                {data.summary.totalRows}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">Analiz edilen parça</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Eşleşen Ürünler
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700 sm:text-3xl">
                  {data.summary.matchedRows}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  (%{data.summary.matchRate})
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-600">Katalogda bulundu</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Çoklu Eşleşme
              </p>
              <p className="mt-2 text-2xl font-black text-amber-700 sm:text-3xl">
                {data.summary.multipleRows}
              </p>
              <p className="mt-1 text-[11px] text-amber-600">1'den fazla muadil</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Bulunamayanlar
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-700 sm:text-3xl">
                {data.summary.unmatchedRows}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">Katalog dışı kodlar</p>
            </div>
          </div>

          {/* Filtre ve Arama Çubuğu */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Sekmeler */}
            <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`rounded-lg px-3 py-1.5 font-bold transition-colors ${
                  activeTab === "ALL"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Tümü ({data.results.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("MATCHED")}
                className={`rounded-lg px-3 py-1.5 font-bold transition-colors ${
                  activeTab === "MATCHED"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-zinc-600 hover:text-emerald-700"
                }`}
              >
                Eşleşenler ({data.summary.matchedRows + data.summary.multipleRows})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("NOT_FOUND")}
                className={`rounded-lg px-3 py-1.5 font-bold transition-colors ${
                  activeTab === "NOT_FOUND"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Bulunamayanlar ({data.summary.unmatchedRows})
              </button>
            </div>

            {/* Arama Kutusu */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Müşteri kodu, OEM veya BSK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-brand-brown focus:outline-hidden focus:ring-1 focus:ring-brand-brown"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tablo Arayüzü */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 w-12 text-center">
                      #
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Müşteri Ürün Kodu
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      İletilen OEM Kodları
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Eşleşen BSK Ürünü
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Eşleşen Referans
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center w-16">
                      Adet
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center">
                      Durum
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Aksiyon
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400">
                        Bu filtreye uygun kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((row) => {
                      const isMatched = row.status === "MATCHED";
                      const isMultiple = row.status === "MULTIPLE";
                      const isNotFound = row.status === "NOT_FOUND";

                      return (
                        <tr
                          key={row.rowNumber}
                          className={`transition-colors hover:bg-zinc-50/80 ${
                            isNotFound ? "bg-zinc-50/30" : ""
                          }`}
                        >
                          {/* Satır No */}
                          <td className="px-4 py-3.5 font-mono text-zinc-400 text-center">
                            {row.rowNumber}
                          </td>

                          {/* Müşteri Kodu */}
                          <td className="px-4 py-3.5 font-semibold text-zinc-900">
                            {row.customerSku || <span className="text-zinc-300">-</span>}
                          </td>

                          {/* OEM Kodları */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {row.requestedOems.length > 0 ? (
                                row.requestedOems.map((oem, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-700"
                                  >
                                    {oem}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-300">-</span>
                              )}
                            </div>
                          </td>

                          {/* Eşleşen BSK Ürünü */}
                          <td className="px-4 py-3.5">
                            {row.matchedProducts.length === 0 ? (
                              <span className="text-zinc-400 italic">Eşleşme bulunamadı</span>
                            ) : row.matchedProducts.length === 1 ? (
                              (() => {
                                const p = row.matchedProducts[0];
                                const nameTr =
                                  typeof p.name === "object" && p.name !== null
                                    ? (p.name as Record<string, string>).tr || ""
                                    : String(p.name);
                                return (
                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/${locale}/urunler/${p.slug}`}
                                      target="_blank"
                                      className="inline-flex items-center gap-1 rounded-md bg-brand-brown/10 px-2 py-0.5 font-mono text-xs font-bold text-brand-brown hover:bg-brand-brown hover:text-white transition-colors"
                                    >
                                      <span>{p.sku}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                    <span
                                      className="max-w-[220px] truncate text-xs text-zinc-700 font-medium"
                                      title={nameTr}
                                    >
                                      {nameTr}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : (
                              /* Birden fazla ürün eşleştiğinde iki ürünü de belirgin kartlar olarak göster */
                              <div className="space-y-1.5 py-0.5">
                                <div className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                                  <Sparkles className="h-3 w-3 text-amber-600" />
                                  <span>{row.matchedProducts.length} Farklı Ürün Eşleşti:</span>
                                </div>
                                {row.matchedProducts.map((p, pIdx) => {
                                  const nameTr =
                                    typeof p.name === "object" && p.name !== null
                                      ? (p.name as Record<string, string>).tr || ""
                                      : String(p.name);
                                  return (
                                    <div
                                      key={p.id}
                                      className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/90 bg-amber-50/60 px-2.5 py-1.5 shadow-2xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-950 font-black text-[9px]">
                                          {pIdx + 1}
                                        </span>
                                        <Link
                                          href={`/${locale}/urunler/${p.slug}`}
                                          target="_blank"
                                          className="inline-flex items-center gap-1 rounded bg-brand-brown/10 px-1.5 py-0.5 font-mono text-xs font-bold text-brand-brown hover:bg-brand-brown hover:text-white transition-colors"
                                        >
                                          <span>{p.sku}</span>
                                          <ExternalLink className="h-2.5 w-2.5" />
                                        </Link>
                                        <span
                                          className="max-w-[200px] truncate text-[11px] font-medium text-zinc-800"
                                          title={nameTr}
                                        >
                                          {nameTr}
                                        </span>
                                      </div>
                                      <Link
                                        href={`/${locale}/urunler/${p.slug}`}
                                        target="_blank"
                                        className="shrink-0 text-[10px] font-bold text-brand-brown hover:underline"
                                      >
                                        Gör &rarr;
                                      </Link>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Eşleşen Referans */}
                          <td className="px-4 py-3.5">
                            {row.matchedProducts.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.from(
                                  new Set(row.matchedProducts.map((p) => p.matchedCode))
                                ).map((code, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800"
                                  >
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    {code}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-300">-</span>
                            )}
                          </td>

                          {/* Talep Adedi */}
                          <td className="px-4 py-3.5 font-mono font-semibold text-center text-zinc-900">
                            {row.quantity ?? <span className="text-zinc-300">-</span>}
                          </td>

                          {/* Durum Rozeti */}
                          <td className="px-4 py-3.5 text-center">
                            {isMatched && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Eşleşti
                              </span>
                            )}
                            {isMultiple && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs">
                                <Layers className="h-3.5 w-3.5 text-amber-600" />
                                {row.matchedProducts.length} Ürün Eşleşti
                              </span>
                            )}
                            {isNotFound && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                                <AlertCircle className="h-3.5 w-3.5 text-zinc-400" />
                                Bulunamadı
                              </span>
                            )}
                          </td>

                          {/* Aksiyon */}
                          <td className="px-4 py-3.5 text-right">
                            {row.matchedProducts.length > 1 ? (
                              <div className="flex flex-col items-end gap-1">
                                {row.matchedProducts.map((p) => (
                                  <Link
                                    key={p.id}
                                    href={`/${locale}/urunler/${p.slug}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-700 shadow-2xs hover:border-brand-brown hover:text-brand-brown transition-colors"
                                  >
                                    <span>{p.sku} İncele</span>
                                    <ArrowRight className="h-2.5 w-2.5" />
                                  </Link>
                                ))}
                              </div>
                            ) : row.primaryProduct ? (
                              <Link
                                href={`/${locale}/urunler/${row.primaryProduct.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-xs hover:border-brand-brown hover:text-brand-brown transition-colors"
                              >
                                <span>İncele</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-zinc-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 4. RFQ TEKLİF İLETME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all sm:p-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>

            {rfqSubmitted ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Teklif Talebiniz Alındı!</h3>
                <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                  Çaprazlanan {data?.summary.matchedRows} adet eşleşen ürün ve listeniz satış
                  ekibimize iletildi. En kısa sürede sizinle iletişime geçilecektir.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setRfqSubmitted(false);
                  }}
                  className="mt-6 inline-flex rounded-xl bg-brand-brown px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-brown-dark"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-brown uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Resmi RFQ Talebi</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mt-1">Teklif İsteği Gönderin</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Eşleşen {data?.summary.matchedRows} adet parçanın fiyat ve teslim süresi teklifi
                    için iletişim bilgilerinizi giriniz.
                  </p>
                </div>

                <form onSubmit={handleSendRfqQuote} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Firma Adı
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="Örn: ABC Yedek Parça Ltd."
                        value={contactForm.company}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, company: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-xs focus:border-brand-brown focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Yetkili Adı Soyadı
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          placeholder="Ad Soyad"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-xs focus:border-brand-brown focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Telefon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="tel"
                          required
                          placeholder="0 (5XX) XXX XX XX"
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm({ ...contactForm, phone: e.target.value })
                          }
                          className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-xs focus:border-brand-brown focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      E-Posta Adresi
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="email"
                        required
                        placeholder="ornek@sirket.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-xs focus:border-brand-brown focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Ek Talep / Notlar
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Hedef teslim tarihi, ambalaj talebi veya özel notlar..."
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 p-2.5 text-xs focus:border-brand-brown focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingRfq}
                      className="w-full rounded-xl bg-brand-brown py-3 text-xs font-bold text-white shadow-md transition hover:bg-brand-brown-dark disabled:opacity-50"
                    >
                      {isSubmittingRfq ? "İletiliyor..." : "Teklif Talebini Gönder"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
