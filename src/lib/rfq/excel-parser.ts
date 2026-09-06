import * as XLSX from "xlsx";
import type { RFQInputRow, RFQRowResult } from "./cross-matcher";

export function parseRFQExcel(data: ArrayBuffer | Uint8Array | Buffer): RFQInputRow[] {
  const workbook = XLSX.read(data, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  // 2D Array olarak oku
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  }) as (string | number)[][];

  if (!rawRows || rawRows.length === 0) return [];

  // İlk 5 satırı tara, başlık satırını tespit et
  let headerRowIndex = -1;
  let qtyColIndex = -1;
  let noteColIndex = -1;
  let customerColIndex = 0;

  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i] || [];
    const rowStr = row.map((c) => String(c).toLowerCase()).join(" ");

    const isHeaderCandidate =
      rowStr.includes("oem") ||
      rowStr.includes("kod") ||
      rowStr.includes("sku") ||
      rowStr.includes("müşteri") ||
      rowStr.includes("customer") ||
      rowStr.includes("part") ||
      rowStr.includes("ref") ||
      rowStr.includes("parça") ||
      rowStr.includes("adet") ||
      rowStr.includes("not");

    if (isHeaderCandidate) {
      headerRowIndex = i;
      // Kolon tiplerini tespit et
      row.forEach((cell, cIdx) => {
        const h = String(cell).toLowerCase().trim();
        if (h.includes("adet") || h.includes("miktar") || h.includes("qty") || h.includes("quantity")) {
          qtyColIndex = cIdx;
        } else if (h.includes("not") || h.includes("açıklama") || h.includes("note") || h.includes("desc")) {
          noteColIndex = cIdx;
        } else if (h.includes("müşteri") || h.includes("customer") || h.includes("stok") || h.includes("kendi")) {
          customerColIndex = cIdx;
        }
      });
      break;
    }
  }

  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  const rows: RFQInputRow[] = [];

  for (let i = startIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || r.length === 0) continue;

    let customerSku = "";
    let quantity: number | null = null;
    let note: string | null = null;
    const oems: string[] = [];

    // Eğer müşteri sütunu belirlendiyse al
    if (customerColIndex >= 0 && r[customerColIndex] !== undefined) {
      customerSku = String(r[customerColIndex] ?? "").trim();
    }

    // Tüm sütunları tara
    for (let col = 0; col < r.length; col++) {
      const cellVal = String(r[col] ?? "").trim();
      if (!cellVal) continue;

      if (col === qtyColIndex) {
        const num = Number(cellVal);
        if (!isNaN(num) && num > 0) quantity = num;
        continue;
      }

      if (col === noteColIndex) {
        note = cellVal;
        continue;
      }

      if (col === customerColIndex && r.length > 1) {
        // Eğer birden fazla kolon varsa ve bu kolon müşteri kolonuysa oems listesine eklemeden önce
        // müşteri kodu olarak kalsın ama OEM aramasında da taranması için saklansın
        continue;
      }

      // Hücre virgül, noktalı virgül veya / içeriyorsa parçala
      if (cellVal.includes(",") || cellVal.includes(";") || cellVal.includes("/")) {
        const parts = cellVal.split(/[,;/]+/).map((p) => p.trim()).filter(Boolean);
        oems.push(...parts);
      } else {
        oems.push(cellVal);
      }
    }

    // Eğer sadece 1 sütun girilmişse veya OEM sütunları boşsa, Sütun A'daki değeri OEM listesine de ekle
    if (customerSku && oems.length === 0) {
      oems.push(customerSku);
    }

    // Satırda hiçbir değer yoksa atla
    if (!customerSku && oems.length === 0) continue;

    rows.push({
      rowNumber: i + 1,
      customerSku,
      oems,
      quantity,
      note,
    });
  }

  return rows;
}

export function createRFQTemplateWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Müşteri Ürün Kodu (Zorunlu Değil)",
    "OEM No 1",
    "OEM No 2",
    "OEM No 3",
    "OEM No 4",
    "Talep Adedi (Opsiyonel)",
    "Not / Açıklama (Opsiyonel)",
  ];

  const sampleData = [
    ["STK-EGEA-01", "51772753", "51 77 275 3", "", "", 50, "Fiat Egea amortisör körüğü"],
    ["STK-FIAT-02", "5978771", "5978 771", "", "", 25, "Fiat Uno / Ritmo ön körük"],
    ["STK-CLIO-03", "8200127285", "Y4452", "", "", 100, "Renault Clio III / Modus körük"],
    ["STK-MEG-04", "540500006R", "540505143R", "", "", 30, "Megane III / Fluence amortisör körüğü"],
    ["STK-TEST-99", "999999999", "", "", "", 10, "Katalogda olmayan test OEM numarası"],
  ];

  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Sütun genişlikleri
  ws["!cols"] = [
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "RFQ_Sablon");

  // Uint8Array formatında yaz (Node ve Tarayıcı uyumlu)
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(out);
}

export function exportRFQResultsToExcel(
  results: RFQRowResult[],
  siteUrl: string = ""
): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Kullanıcının talep ettiği sütun adları
  const headers = [
    "Satır No",
    "Müşteri Ürün Kodu",
    "Aranan OEM Kodları",
    "Eşleşme Durumu",
    "Beseka Kodu",
    "Ürün Adı",
    "Eşleşen Oem",
    "Talep Adedi",
    "Müşteri Notu",
    "Link",
  ];

  const rows: (string | number)[][] = [];

  for (const r of results) {
    if (r.status === "NOT_FOUND" || r.matchedProducts.length === 0) {
      // Eşleşme yoksa da satırı yaz; "Eşleşme Yok" olarak belirt
      rows.push([
        r.rowNumber,
        r.customerSku || "-",
        r.requestedOems.join(", "),
        "Eşleşme Yok",
        "-",
        "-",
        "-",
        r.quantity ?? "-",
        r.note || "-",
        "-",
      ]);
    } else if (r.matchedProducts.length === 1) {
      const p = r.matchedProducts[0];
      const nameTr =
        typeof p.name === "object" && p.name !== null
          ? (p.name as Record<string, string>).tr || Object.values(p.name)[0] || ""
          : String(p.name || "");

      const productLink = `${siteUrl || ""}/tr/urunler/${p.slug}`;

      rows.push([
        r.rowNumber,
        r.customerSku || "-",
        r.requestedOems.join(", "),
        "Eşleşti",
        p.sku,
        nameTr,
        p.matchedCode,
        r.quantity ?? "-",
        r.note || "-",
        productLink,
      ]);
    } else {
      // Çoklu eşleşme: Her ürün için ayrı satır yaz
      r.matchedProducts.forEach((p, idx) => {
        const nameTr =
          typeof p.name === "object" && p.name !== null
            ? (p.name as Record<string, string>).tr || Object.values(p.name)[0] || ""
            : String(p.name || "");

        const productLink = `${siteUrl || ""}/tr/urunler/${p.slug}`;

        rows.push([
          `${r.rowNumber} (${idx + 1}/${r.matchedProducts.length})`,
          r.customerSku || "-",
          r.requestedOems.join(", "),
          `Çoklu Eşleşme (${idx + 1}. Ürün)`,
          p.sku,
          nameTr,
          p.matchedCode,
          r.quantity ?? "-",
          r.note || "-",
          productLink,
        ]);
      });
    }
  }

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Sütun genişlikleri
  ws["!cols"] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
    { wch: 50 },
    { wch: 28 },
    { wch: 14 },
    { wch: 26 },
    { wch: 55 },
  ];

  // Başlık satırı stillemesi: kırmızı dolgu (#C0272D) + beyaz yazı + kalın
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "C0272D" }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };

  const numCols = headers.length;
  for (let col = 0; col < numCols; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddr]) {
      ws[cellAddr].s = headerStyle;
    }
  }

  // İlk satır yüksekliği
  ws["!rows"] = [{ hpt: 28 }];

  XLSX.utils.book_append_sheet(wb, ws, "BSK_Cross_Eslestirme");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  return new Uint8Array(out);
}
