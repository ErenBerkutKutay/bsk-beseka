import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/products/search";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 24)));

  const { products, total } = await searchProducts({
    q: searchParams.get("q") || undefined,
    sku: searchParams.get("sku") || undefined,
    make: searchParams.get("make") || undefined,
    model: searchParams.get("model") || undefined,
    subModel: searchParams.get("subModel") || undefined,
    category: searchParams.get("category") || undefined,
    isNew: searchParams.get("isNew") === "true",
    page,
    limit,
  });

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
