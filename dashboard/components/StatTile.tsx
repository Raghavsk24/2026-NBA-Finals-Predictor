// a compact labeled stat box used across the engine sections

import { Card } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="eyebrow text-[11px] text-walnut">{label}</p>
      <p className="stat-display mt-2 text-3xl" style={{ color: color ?? "var(--ink)" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
