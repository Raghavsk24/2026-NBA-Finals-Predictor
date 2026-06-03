/*
  shared frame for each of the three stacked engine sections. it shows the engine number in
  black in front of the all caps engine name, then a description, then the engine's charts and
  controls. the section is transparent so the wooden floor backdrop shows through behind it.
*/

export function EngineSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-b border-border/70">
      <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="flex items-baseline gap-3">
          <span className="stat-display text-4xl text-black md:text-5xl">{number}</span>
          <h2 className="stat-display text-3xl text-ink md:text-4xl">{title}</h2>
        </div>
        <div className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
          {description}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
