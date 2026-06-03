"use client";

// the head to head win probability bar shared by all three engines. knicks orange grows from
// the left, spurs grey from the right, and the split animates whenever the numbers change.

import { motion } from "motion/react";
import { TEAMS } from "@/lib/teams";

export function WinProbabilityBar({
  nyk,
  sas,
  height = "lg",
}: {
  nyk: number;
  sas: number;
  height?: "lg" | "sm";
}) {
  const nykLeads = nyk >= sas;
  const barHeight = height === "lg" ? "h-16" : "h-10";

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <TeamScore teamKey="NYK" value={nyk} leading={nykLeads} align="left" />
        <span className="eyebrow mb-2 text-[11px] text-muted-foreground">win probability</span>
        <TeamScore teamKey="SAS" value={sas} leading={!nykLeads} align="right" />
      </div>

      <div
        className={`relative mt-3 ${barHeight} w-full overflow-hidden rounded-lg border border-border bg-secondary`}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ backgroundColor: TEAMS.NYK.color }}
          initial={false}
          animate={{ width: `${nyk}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        <motion.div
          className="absolute inset-y-0 right-0"
          style={{ backgroundColor: TEAMS.SAS.color }}
          initial={false}
          animate={{ width: `${sas}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        {/* center seam so the split point is always readable */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/60" />
      </div>
    </div>
  );
}

function TeamScore({
  teamKey,
  value,
  leading,
  align,
}: {
  teamKey: "NYK" | "SAS";
  value: number;
  leading: boolean;
  align: "left" | "right";
}) {
  const team = TEAMS[teamKey];
  return (
    <div className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <img src={team.logo} alt={`${team.short} logo`} className="h-6 w-6 object-contain" />
        <span className="text-sm font-semibold tracking-wide">{team.short}</span>
        {leading && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: team.color }}
          >
            favored
          </span>
        )}
      </div>
      <span className="stat-display mt-1 text-5xl" style={{ color: team.color }}>
        {value.toFixed(1)}
        <span className="text-2xl">%</span>
      </span>
    </div>
  );
}
