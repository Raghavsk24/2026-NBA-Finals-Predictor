"use client";

/*
  the head to head win probability bar shared by all three engines. knicks orange grows from the
  left, spurs grey from the right, and the split animates whenever the numbers change. each team
  carries a pill that reads favorites or underdogs depending on who is ahead.
*/

import { motion } from "motion/react";
import { TeamMark } from "@/components/Marks";
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
      <div className="flex items-end justify-between gap-2 sm:gap-4">
        <TeamScore teamKey="NYK" value={nyk} leading={nykLeads} align="left" />
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

      <p className="eyebrow mt-2 text-center text-[11px] text-walnut">Win Probability</p>
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
    <div className={`flex min-w-0 flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <div
        className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <TeamMark
          abbr={team.abbr}
          color={team.color}
          className="h-5 w-5 rounded-[5px] text-[7px] sm:h-6 sm:w-6 sm:text-[8px]"
        />
        <span className="text-xs font-semibold tracking-wide sm:text-sm">{team.short}</span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:px-2 sm:text-[10px]"
          style={{ backgroundColor: team.color }}
        >
          {leading ? "Favorites" : "Underdogs"}
        </span>
      </div>
      <span className="stat-display mt-1 text-4xl sm:text-5xl" style={{ color: team.color }}>
        {value.toFixed(1)}
        <span className="text-xl sm:text-2xl">%</span>
      </span>
    </div>
  );
}
