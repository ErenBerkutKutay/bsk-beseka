import type { HomeStatItem } from "@/lib/beseka/home-stats";

export function HomeStatsBar({ stats }: { stats: HomeStatItem[] }) {
  return (
    <section className="bg-brand-brown text-white">
      <div className="mx-auto grid max-w-7xl divide-y divide-brand-cream/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="px-6 py-10 text-center">
            <div className="text-3xl font-black text-brand-cream md:text-4xl">{stat.value}</div>
            <div className="mt-1 text-sm font-semibold uppercase tracking-wider">{stat.label}</div>
            <div className="mt-1 text-xs text-brand-cream/70">{stat.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
