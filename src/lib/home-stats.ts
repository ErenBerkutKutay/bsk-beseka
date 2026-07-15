import { db } from "@/lib/db";
import { fallbackHomeStats, type HomeStatItem } from "@/lib/beseka/home-stats";

export async function getActiveHomeStats(): Promise<HomeStatItem[]> {
  try {
    const rows = await db.homeStat.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const mapped = rows.map((row) => ({
      id: row.id,
      value: row.value,
      label: row.label,
      sub: row.sub,
    }));

    return mapped.length ? mapped : fallbackHomeStats;
  } catch {
    return fallbackHomeStats;
  }
}

export async function getAllHomeStats() {
  return db.homeStat.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
