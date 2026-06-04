// shared display constants for the two finals teams. colors are kept as hex here because
// recharts paints svg fills and reads these directly.

import { playersData } from "@/lib/data";

export const KNICKS_ORANGE = "#f58426";
export const KNICKS_BLUE = "#1d6bb6";
export const SPURS_GREY = "#6e7378";
export const SPURS_SILVER = "#c4ced4";

export const TEAMS = {
  NYK: {
    key: "NYK" as const,
    name: "New York Knicks",
    short: "Knicks",
    color: KNICKS_ORANGE,
    soft: "#fde8d6",
    abbr: playersData.NYK.abbr,
    record: { w: 53, l: 29 },
  },
  SAS: {
    key: "SAS" as const,
    name: "San Antonio Spurs",
    short: "Spurs",
    color: SPURS_GREY,
    soft: "#e9ecee",
    abbr: playersData.SAS.abbr,
    record: { w: 62, l: 20 },
  },
};

export type TeamKey = "NYK" | "SAS";
