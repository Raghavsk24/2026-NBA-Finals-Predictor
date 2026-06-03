/*
  shared frame for each of the three stacked engine sections. each engine sits on its own white
  panel, and the wooden floor backdrop shows only in the gaps between panels, so those gaps act
  as the dividers. the engine number sits as a large ghost figure with the all caps engine name
  centered vertically next to it.
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
    <section id={id} className="scroll-mt-6 px-4 py-5 md:py-7">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white px-5 py-12 shadow-sm ring-1 ring-black/5 md:px-10 md:py-16">
        <div className="flex items-center gap-4">
          <span className="stat-display select-none text-6xl leading-none text-border md:text-7xl">
            {number}
          </span>
          <h2 className="stat-display text-3xl text-ink md:text-4xl">{title}</h2>
        </div>
        <div className="mt-4 text-sm text-muted-foreground md:text-base">{description}</div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
