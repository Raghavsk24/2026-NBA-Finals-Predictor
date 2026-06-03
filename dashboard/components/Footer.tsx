// lightweight footer with the copyright line, the data source attribution and the required
// non affiliation disclaimer

export function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="stat-display text-lg text-ink">Knicks v Spurs</p>
            <p className="mt-1 text-sm text-muted-foreground">2026 NBA Finals Predictor</p>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            This is an unofficial, educational project and is not affiliated with, endorsed by, or
            sponsored by the National Basketball Association, the New York Knicks, the San Antonio
            Spurs, or any of their players. All team names, logos, and player images are the
            property of their respective owners. Data is sourced from public NBA statistics via the
            nba_api project. Predictions are estimates for entertainment only.
          </p>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          (c) {year} Raghav. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
