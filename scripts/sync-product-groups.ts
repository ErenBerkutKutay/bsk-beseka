import "dotenv/config";
import { db } from "../src/lib/db";
import {
  DEPRECATED_CATEGORY_SLUGS,
  LEGACY_CATEGORY_SLUG_MAP,
  PRODUCT_GROUPS,
} from "../src/lib/categories/product-groups";

async function main() {
  const targetBySlug = new Map<string, string>();

  for (const [index, group] of PRODUCT_GROUPS.entries()) {
    const category = await db.category.upsert({
      where: { slug: group.slug },
      update: {
        name: group.name,
        sortOrder: index,
        isActive: true,
      },
      create: {
        slug: group.slug,
        name: group.name,
        sortOrder: index,
        isActive: true,
      },
    });
    targetBySlug.set(group.slug, category.id);
    console.log(`✓ ${group.slug}`);
  }

  let movedProducts = 0;

  for (const [legacySlug, newSlug] of Object.entries(LEGACY_CATEGORY_SLUG_MAP)) {
    const legacy = await db.category.findUnique({ where: { slug: legacySlug } });
    const targetId = targetBySlug.get(newSlug);
    if (!legacy || !targetId) continue;

    const result = await db.product.updateMany({
      where: { categoryId: legacy.id },
      data: { categoryId: targetId },
    });
    movedProducts += result.count;
    if (result.count > 0) {
      console.log(`→ ${result.count} ürün: ${legacySlug} → ${newSlug}`);
    }
  }

  const deactivated = await db.category.updateMany({
    where: { slug: { in: DEPRECATED_CATEGORY_SLUGS } },
    data: { isActive: false },
  });

  console.log(JSON.stringify({ movedProducts, deactivatedCategories: deactivated.count }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
