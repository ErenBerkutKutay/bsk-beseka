import { formatYearRange } from "@/lib/catalog/fitment-display";

type EngineOptionLike = {
  name: string;
  yearFrom?: number | null;
  yearTo?: number | null;
  kw?: number | null;
  hp?: number | null;
};

export function formatEngineOptionLabel(engine: EngineOptionLike): string {
  const yearLabel = formatYearRange(engine.yearFrom, engine.yearTo);
  const power =
    engine.kw || engine.hp
      ? ` · ${[engine.kw ? `${engine.kw} kW` : null, engine.hp ? `${engine.hp} HP` : null]
          .filter(Boolean)
          .join(" / ")}`
      : "";

  if (yearLabel === "—") return `${engine.name}${power}`;
  return `${engine.name} (${yearLabel})${power}`;
}
