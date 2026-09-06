import { db } from "@/lib/db";
import { normalizeOEM } from "@/lib/oem/normalize";

export interface RFQInputRow {
  rowNumber: number;
  customerSku: string;
  oems: string[];
  quantity?: number | string | null;
  note?: string | null;
}

export interface MatchedProductInfo {
  id: string;
  sku: string;
  slug: string;
  name: Record<string, string> | string;
  images: string[];
  categoryName?: Record<string, string> | string | null;
  matchedVia: "oem" | "cross" | "sku";
  matchedCode: string;
}

export interface RFQRowResult {
  rowNumber: number;
  customerSku: string;
  requestedOems: string[];
  quantity: number | null;
  note: string | null;
  status: "MATCHED" | "MULTIPLE" | "NOT_FOUND";
  matchedProducts: MatchedProductInfo[];
  primaryProduct: MatchedProductInfo | null;
}

export interface RFQMatchSummary {
  totalRows: number;
  matchedRows: number;
  multipleRows: number;
  unmatchedRows: number;
  matchRate: number; // Yüzdelik (Örn: 80.0)
}

export interface RFQMatchResponse {
  summary: RFQMatchSummary;
  results: RFQRowResult[];
}

export async function matchRFQRows(rows: RFQInputRow[]): Promise<RFQMatchResponse> {
  if (!rows || rows.length === 0) {
    return {
      summary: {
        totalRows: 0,
        matchedRows: 0,
        multipleRows: 0,
        unmatchedRows: 0,
        matchRate: 0,
      },
      results: [],
    };
  }

  // 1. Tüm satırlardan sorgulanacak kodları topla ve normalize et
  const codeSet = new Set<string>();
  const normalizedSet = new Set<string>();

  for (const row of rows) {
    if (row.customerSku) {
      const trimmed = String(row.customerSku).trim();
      if (trimmed) {
        codeSet.add(trimmed);
        const norm = normalizeOEM(trimmed);
        if (norm) normalizedSet.add(norm);
      }
    }

    if (Array.isArray(row.oems)) {
      for (const oem of row.oems) {
        if (!oem) continue;
        const trimmed = String(oem).trim();
        if (trimmed) {
          codeSet.add(trimmed);
          const norm = normalizeOEM(trimmed);
          if (norm) normalizedSet.add(norm);
        }
      }
    }
  }

  // Leading zeroes varyasyonları da ekle (Örn: 0001234 -> 1234)
  for (const norm of Array.from(normalizedSet)) {
    const noZeros = norm.replace(/^0+/, "");
    if (noZeros && noZeros.length >= 3 && noZeros !== norm) {
      normalizedSet.add(noZeros);
    }
  }

  const normalizedList = Array.from(normalizedSet);
  const rawList = Array.from(codeSet);

  // 2. Veritabanında toplu (batch) sorgular
  const [oemMatches, crossMatches, skuMatches] = await Promise.all([
    normalizedList.length > 0
      ? db.oEMCode.findMany({
          where: {
            OR: [
              { codeNormalized: { in: normalizedList } },
              { code: { in: rawList, mode: "insensitive" } },
            ],
            product: { isActive: true },
          },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                images: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      : [],

    normalizedList.length > 0
      ? db.crossCode.findMany({
          where: {
            OR: [
              { codeNormalized: { in: normalizedList } },
              { code: { in: rawList, mode: "insensitive" } },
            ],
            product: { isActive: true },
          },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                images: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      : [],

    rawList.length > 0
      ? db.product.findMany({
          where: {
            isActive: true,
            OR: [
              { sku: { in: rawList, mode: "insensitive" } },
              { sku: { in: normalizedList, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            sku: true,
            slug: true,
            name: true,
            images: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        })
      : [],
  ]);

  // 3. Eşleşme haritası oluştur (normalizedCode -> MatchedProductInfo[])
  type MatchItem = {
    product: {
      id: string;
      sku: string;
      slug: string;
      name: unknown;
      images: string[];
      category?: { name: unknown } | null;
    };
    matchedVia: "oem" | "cross" | "sku";
    matchedCode: string;
  };

  const lookup = new Map<string, MatchItem[]>();

  function addToLookup(key: string, item: MatchItem) {
    if (!key) return;
    const cleanKey = key.toLowerCase().trim();
    const existing = lookup.get(cleanKey) || [];
    if (!existing.some((e) => e.product.id === item.product.id)) {
      existing.push(item);
      lookup.set(cleanKey, existing);
    }
  }

  for (const oem of oemMatches) {
    addToLookup(oem.codeNormalized, {
      product: oem.product,
      matchedVia: "oem",
      matchedCode: oem.code,
    });
    addToLookup(oem.code, {
      product: oem.product,
      matchedVia: "oem",
      matchedCode: oem.code,
    });
    const noZ = oem.codeNormalized.replace(/^0+/, "");
    if (noZ && noZ !== oem.codeNormalized) {
      addToLookup(noZ, {
        product: oem.product,
        matchedVia: "oem",
        matchedCode: oem.code,
      });
    }
  }

  for (const cross of crossMatches) {
    addToLookup(cross.codeNormalized, {
      product: cross.product,
      matchedVia: "cross",
      matchedCode: cross.code,
    });
    addToLookup(cross.code, {
      product: cross.product,
      matchedVia: "cross",
      matchedCode: cross.code,
    });
  }

  for (const prod of skuMatches) {
    const normSku = normalizeOEM(prod.sku);
    addToLookup(normSku, {
      product: prod,
      matchedVia: "sku",
      matchedCode: prod.sku,
    });
    addToLookup(prod.sku, {
      product: prod,
      matchedVia: "sku",
      matchedCode: prod.sku,
    });
  }

  // 4. Her satırı eşleştir
  const results: RFQRowResult[] = [];
  let matchedCount = 0;
  let multipleCount = 0;
  let unmatchedCount = 0;

  for (const row of rows) {
    const requestedOems = (row.oems || []).map((o) => String(o).trim()).filter(Boolean);
    const seenProductIds = new Set<string>();
    const matchedProducts: MatchedProductInfo[] = [];

    // Satırdaki tüm kodları topla (hem girilen OEM'ler hem de Sütun A müşteri kodu)
    const allRowCodes = [...requestedOems];
    if (row.customerSku && String(row.customerSku).trim()) {
      allRowCodes.push(String(row.customerSku).trim());
    }

    for (const rawCode of allRowCodes) {
      const norm = normalizeOEM(rawCode);
      const noZeros = norm.replace(/^0+/, "");

      const hits = [
        ...(lookup.get(norm) || []),
        ...(lookup.get(rawCode.toLowerCase().trim()) || []),
        ...(noZeros && noZeros !== norm ? lookup.get(noZeros) || [] : []),
      ];

      for (const hit of hits) {
        if (!seenProductIds.has(hit.product.id)) {
          seenProductIds.add(hit.product.id);
          matchedProducts.push({
            id: hit.product.id,
            sku: hit.product.sku,
            slug: hit.product.slug,
            name: hit.product.name as Record<string, string> | string,
            images: hit.product.images || [],
            categoryName: hit.product.category?.name as Record<string, string> | string | undefined,
            matchedVia: hit.matchedVia,
            matchedCode: rawCode || hit.matchedCode,
          });
        }
      }
    }

    let status: RFQRowResult["status"] = "NOT_FOUND";
    if (matchedProducts.length === 1) {
      status = "MATCHED";
      matchedCount++;
    } else if (matchedProducts.length > 1) {
      status = "MULTIPLE";
      multipleCount++;
    } else {
      status = "NOT_FOUND";
      unmatchedCount++;
    }

    const parsedQty =
      row.quantity !== undefined && row.quantity !== null && row.quantity !== ""
        ? Number(row.quantity)
        : null;

    results.push({
      rowNumber: row.rowNumber,
      customerSku: row.customerSku || "",
      requestedOems,
      quantity: Number.isFinite(parsedQty) ? parsedQty : null,
      note: row.note ? String(row.note).trim() : null,
      status,
      matchedProducts,
      primaryProduct: matchedProducts[0] || null,
    });
  }

  const totalRows = rows.length;
  const matchRate =
    totalRows > 0 ? Number((((matchedCount + multipleCount) / totalRows) * 100).toFixed(1)) : 0;

  return {
    summary: {
      totalRows,
      matchedRows: matchedCount,
      multipleRows: multipleCount,
      unmatchedRows: unmatchedCount,
      matchRate,
    },
    results,
  };
}
