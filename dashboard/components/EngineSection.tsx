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
  topFlush = false,
}: {
  id: string;
  number: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  topFlush?: boolean;
}) {
  const sectionPadding = topFlush ? "pt-0 pb-5 md:pb-7" : "py-5 md:py-7";
  const innerClasses = topFlush ? "rounded-b-2xl py-6 md:py-8" : "rounded-2xl py-12 md:py-16";

  return (
    <section id={id} className={`scroll-mt-6 px-4 ${sectionPadding}`}>
      <div className={`mx-auto max-w-6xl bg-white px-5 shadow-sm ring-1 ring-black/5 md:px-10 ${innerClasses}`}>
        <div className="flex items-center gap-4">
          <span className="stat-display select-none text-6xl leading-none text-walnut-honey md:text-7xl">
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
