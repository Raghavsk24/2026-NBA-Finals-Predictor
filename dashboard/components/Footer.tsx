// the footer sits on its own white panel and carries the copyright, data attribution and the non affiliation disclaimer

export function Footer() {
  return (
    <footer className="px-4 py-5 md:py-7">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white px-5 py-10 shadow-sm ring-1 ring-black/5 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="stat-display text-lg text-ink">Knicks v Spurs</p>
            <p className="mt-1 text-sm text-muted-foreground">2026 NBA Finals Predictor</p>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            This is an unofficial, educational project and is not affiliated with, endorsed by, or
            sponsored by the National Basketball Association, the New York Knicks, the San Antonio
            Spurs, or any of their players. All team names, logos, and player images are the
            property of their respective owners. Data is sourced from public NBA statistics via the{" "}
            <a
              href="https://github.com/swar/nba_api"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-knicks underline underline-offset-2 hover:text-knicks-blue"
            >
              nba_api project
            </a>
            . Predictions are estimates for entertainment only.
          </p>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          © 2025 Raghav Senthil Kumar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
