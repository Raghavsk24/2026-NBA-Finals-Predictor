/*
  logo-free and photo-free brand marks. TeamMark renders a team's abbreviation in a colored tile in
  place of a logo, and PlayerMonogram renders a player's initials in place of a headshot, so the
  dashboard ships with no third party images while keeping each team and player visually distinct.
*/

// the two letter monogram for a player: first name initial plus last name initial
export function playerInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamMark({
  abbr,
  color,
  className = "",
}: {
  abbr: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-bold uppercase leading-none text-white ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {abbr}
    </span>
  );
}

export function PlayerMonogram({
  name,
  color,
  className = "",
  rounded = "rounded-full",
}: {
  name: string;
  color: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border font-bold uppercase leading-none ${rounded} ${className}`}
      style={{ color, backgroundColor: color + "1f", borderColor: color + "55" }}
      aria-hidden="true"
    >
      {playerInitials(name)}
    </span>
  );
}
