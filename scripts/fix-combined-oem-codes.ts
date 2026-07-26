/**
 * Birleşik OEM/cross kodlarını ayırır (örn. "93807641&512631&93817641").
 * Kullanım: DATABASE_URL=... npx tsx scripts/fix-combined-oem-codes.ts
 */
import { db } from "../src/lib/db";
import { buildOEMEntries, parseCodeList } from "../src/lib/oem/normalize";

async function fixOemCodes() {
  const combined = await db.oEMCode.findMany({
    where: {
      OR: [{ code: { contains: "&" } }, { code: { contains: "|" } }],
    },
  });

  let fixed = 0;

  for (const row of combined) {
    const parts = parseCodeList(row.code);
    if (parts.length <= 1) continue;

    const existing = await db.oEMCode.findMany({
      where: { productId: row.productId },
      select: { codeNormalized: true },
    });
    const known = new Set(existing.map((item) => item.codeNormalized));

    await db.oEMCode.delete({ where: { id: row.id } });

    for (const entry of buildOEMEntries(parts)) {
      if (known.has(entry.codeNormalized)) continue;
      await db.oEMCode.create({
        data: { productId: row.productId, ...entry },
      });
      known.add(entry.codeNormalized);
    }

    fixed += 1;
  }

  return fixed;
}

async function fixCrossCodes() {
  const combined = await db.crossCode.findMany({
    where: {
      OR: [{ code: { contains: "&" } }, { code: { contains: "|" } }],
    },
  });

  let fixed = 0;

  for (const row of combined) {
    const parts = parseCodeList(row.code);
    if (parts.length <= 1) continue;

    const existing = await db.crossCode.findMany({
      where: { productId: row.productId },
      select: { codeNormalized: true },
    });
    const known = new Set(existing.map((item) => item.codeNormalized));

    await db.crossCode.delete({ where: { id: row.id } });

    for (const entry of buildOEMEntries(parts)) {
      if (known.has(entry.codeNormalized)) continue;
      await db.crossCode.create({
        data: {
          productId: row.productId,
          ...entry,
          brand: row.brand ?? null,
        },
      });
      known.add(entry.codeNormalized);
    }

    fixed += 1;
  }

  return fixed;
}

async function main() {
  const oemFixed = await fixOemCodes();
  const crossFixed = await fixCrossCodes();
  console.log(`OEM: ${oemFixed} ürün kaydı ayrıldı`);
  console.log(`Cross: ${crossFixed} ürün kaydı ayrıldı`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
