"use client";

// how likely the series is to last 4, 5, 6 or 7 games, drawn as a small spurs grey column chart that animates its heights when the inputs change

import { motion } from "motion/react";

const LABELS: Record<string, string> = {
  "4": "Sweep",
  "5": "5 games",
  "6": "6 games",
  "7": "Game 7",
};

export function SeriesLengthBars({ data }: { data: Record<string, number> }) {
  const keys = ["4", "5", "6", "7"];
  const max = Math.max(...keys.map((k) => data[k] ?? 0), 1);

  return (
    <div>
      <div className="flex h-40 items-end justify-between gap-3">
        {keys.map((k) => {
          const value = data[k] ?? 0;
          return (
            <div key={k} className="flex flex-1 flex-col items-center gap-2">
              <span className="stat-display text-lg text-ink">{value.toFixed(0)}%</span>
              <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-secondary">
                <motion.div
                  className="w-full rounded-md bg-spurs"
                  initial={false}
                  animate={{ height: `${(value / max) * 100}%` }}
                  transition={{ type: "spring", stiffness: 130, damping: 20 }}
                />
              </div>
              <span className="text-center text-xs font-medium text-muted-foreground">
                {LABELS[k]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="eyebrow mt-3 text-center text-[11px] text-walnut">Series Length Distribution</p>
    </div>
  );
}
