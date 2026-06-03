// shared frame for each of the three stacked engine sections. it shows a big ghost number, an
// eyebrow with the tier, the engine title, a short blurb and an optional accuracy badge.

import { Badge } from "@/components/ui/badge";

export function EngineSection({
  id,
  number,
  tier,
  title,
  blurb,
  badge,
  tone = "light",
  children,
}: {
  id: string;
  number: string;
  tier: string;
  title: string;
  blurb: string;
  badge?: string;
  tone?: "light" | "alt";
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 border-b border-border ${tone === "alt" ? "bg-secondary/40" : "bg-background"}`}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="flex items-start gap-4">
          <span className="stat-display select-none text-6xl leading-none text-border md:text-7xl">
            {number}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-xs text-knicks">{tier}</span>
              {badge && (
                <Badge variant="outline" className="border-border text-[11px] font-medium">
                  {badge}
                </Badge>
              )}
            </div>
            <h2 className="stat-display mt-1 text-3xl text-ink md:text-4xl">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">{blurb}</p>
          </div>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
