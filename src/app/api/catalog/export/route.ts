import { NextRequest, NextResponse } from "next/server";
import { getCatalogPdfSettings } from "@/lib/catalog/pdf-settings";
import {
  buildCatalogExcelBuffer,
  buildCatalogPdfBuffer,
  catalogExportFilename,
  resolveSiteOrigin,
} from "@/lib/products/catalog-export";
import { fetchProductsForExport, type ProductSearchParams } from "@/lib/products/search";

export const maxDuration = 120;

type ExportRequestBody = {
  format?: "excel" | "pdf";
  includeImages?: boolean;
  ids?: string[];
  search?: ProductSearchParams;
};

function parseSearchFromUrl(url: URL): ProductSearchParams {
  return {
    q: url.searchParams.get("q") || undefined,
    sku: url.searchParams.get("sku") || undefined,
    make: url.searchParams.get("make") || undefined,
    model: url.searchParams.get("model") || undefined,
    engineInfo: url.searchParams.get("engineInfo") || undefined,
    subModel: url.searchParams.get("subModel") || undefined,
    vehicleId: url.searchParams.get("vehicleId") || undefined,
    category: url.searchParams.get("category") || undefined,
  };
}

function parseExportInput(
  url: URL,
  body?: ExportRequestBody | null,
): {
  format: "excel" | "pdf";
  includeImages: boolean;
  productIds?: string[];
  searchParams: ProductSearchParams;
} {
  const format: "excel" | "pdf" =
    body?.format === "pdf" || url.searchParams.get("format") === "pdf" ? "pdf" : "excel";
  const includeImages =
    body?.includeImages === true || url.searchParams.get("includeImages") === "1";

  const idsParam = url.searchParams.get("ids");
  const productIds =
    body?.ids?.filter(Boolean) ||
    (idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined);

  const searchParams = body?.search || parseSearchFromUrl(url);

  return { format, includeImages, productIds, searchParams };
}

async function buildExportResponse(
  request: NextRequest,
  format: "excel" | "pdf",
  includeImages: boolean,
  searchParams: ProductSearchParams,
  productIds?: string[],
) {
  const { products, total, exported, capped } = await fetchProductsForExport(
    searchParams,
    includeImages,
    productIds,
  );

  if (!products.length) {
    return NextResponse.json({ error: "Dışa aktarılacak ürün bulunamadı." }, { status: 404 });
  }

  const origin = resolveSiteOrigin(request.nextUrl.origin);
  const filename = catalogExportFilename(format);
  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-Export-Total": String(total),
    "X-Export-Count": String(exported),
    ...(capped ? { "X-Export-Capped": "1" } : {}),
  };

  if (format === "excel") {
    const buffer = buildCatalogExcelBuffer(products as never[], { includeImages, origin });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        ...headers,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  }

  const settings = await getCatalogPdfSettings();
  const buffer = await buildCatalogPdfBuffer(products as never[], {
    origin,
    settings,
    includeImages,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { format, includeImages, productIds, searchParams } = parseExportInput(
      new URL(request.url),
    );
    return await buildExportResponse(request, format, includeImages, searchParams, productIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dışa aktarma başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ExportRequestBody | null;
    const { format, includeImages, productIds, searchParams } = parseExportInput(
      new URL(request.url),
      body,
    );
    return await buildExportResponse(request, format, includeImages, searchParams, productIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dışa aktarma başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
