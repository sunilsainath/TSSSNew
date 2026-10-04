import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatRelative } from "@/lib/utils/format";

export function ImpactStats({
  stats,
}: {
  stats: Array<{ label: string; value: number; description: string }>;
}) {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-24">
      <div className="aurora opacity-50" aria-hidden="true" />
      <div className="container-page relative">
        <SectionHeading
          tone="dark"
          eyebrow="Community Impact"
          title="Our service to the community, in numbers"
          description="Every figure below comes directly from the trust's live records and updates as programmes are published."
        />

        <dl className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass group relative overflow-hidden rounded-3xl p-6 transition-colors hover:border-gold-400/40"
            >
              <div
                className="absolute inset-x-0 -top-16 h-32 bg-gold-400/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
              />
              <dt className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">
                {stat.label}
              </dt>
              <dd className="mt-3 font-display text-4xl font-semibold text-white sm:text-5xl">
                {stat.value.toLocaleString("en-IN")}
              </dd>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{stat.description}</p>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-white/70">
            <span className="font-semibold text-gold-200">{formatRelative(new Date().toISOString())}:</span>{" "}
            registration is free, and every family registered strengthens the trust network.
          </p>
          <ButtonLink href="/register" size="sm" className="shrink-0">
            Register Your Family
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
