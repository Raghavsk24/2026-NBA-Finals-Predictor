// the footer spans the full width of the page and carries the title, copyright, data attribution and the non affiliation disclaimer

export function Footer() {
  return (
    <footer className="w-full border-t border-border/70 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6 md:flex-row md:items-start md:justify-between md:px-10">
        <div>
          <p className="stat-display text-lg">
            <span style={{ color: "var(--knicks)" }}>Knicks</span>
            <span className="mx-2 text-sm text-muted-foreground">v</span>
            <span style={{ color: "var(--spurs)" }}>Spurs</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">2026 NBA Finals Prediction Engine</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            © 2025 Raghav Senthil Kumar. All rights reserved.
          </p>
        </div>
        <p className="max-w-xl text-xs leading-relaxed">
          <strong className="text-ink">Disclaimer:</strong>{" "}
          <span className="text-muted-foreground">
            This is an unofficial, educational project and is not affiliated with, endorsed by, or
            sponsored by the National Basketball Association, the New York Knicks, the San Antonio
            Spurs, or any of their players. All team and player names are the property of their
            respective owners. Data is sourced from public NBA statistics via the{" "}
            <a
              href="https://github.com/swar/nba_api"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-knicks underline underline-offset-2 hover:text-knicks-blue"
            >
              nba_api project
            </a>
            . Predictions are estimates for entertainment only.
          </span>
        </p>
      </div>
    </footer>
  );
}
