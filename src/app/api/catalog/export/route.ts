import { NextRequest, NextResponse } from "next/server";
import {
  buildCatalogExcelBuffer,
  buildCatalogPdfBuffer,
  catalogExportFilename,
  resolveSiteOrigin,
} from "@/lib/products/catalog-export";
import { fetchProductsForExport, type ProductSearchParams } from "@/lib/products/search";

function parseSearchParams(url: URL): ProductSearchParams & { format: "excel" | "pdf"; includeImages: boolean } {
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "excel";
  const includeImages = url.searchParams.get("includeImages") === "1";

  return {
    q: url.searchParams.get("q") || undefined,
    sku: url.searchParams.get("sku") || undefined,
    make: url.searchParams.get("make") || undefined,
    model: url.searchParams.get("model") || undefined,
    engineInfo: url.searchParams.get("engineInfo") || undefined,
    subModel: url.searchParams.get("subModel") || undefined,
    vehicleId: url.searchParams.get("vehicleId") || undefined,
    category: url.searchParams.get("category") || undefined,
    format,
    includeImages,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { format, includeImages, ...searchParams } = parseSearchParams(url);

  try {
    const idsParam = url.searchParams.get("ids");
    const productIds = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined;

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

    if (format === "excel") {
      const buffer = buildCatalogExcelBuffer(products as never[], { includeImages, origin });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Export-Total": String(total),
          "X-Export-Count": String(exported),
          ...(capped ? { "X-Export-Capped": "1" } : {}),
        },
      });
    }

    const buffer = await buildCatalogPdfBuffer(products as never[], { includeImages, origin });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Total": String(total),
        "X-Export-Count": String(exported),
        ...(capped ? { "X-Export-Capped": "1" } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dışa aktarma başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
