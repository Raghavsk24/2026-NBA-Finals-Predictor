"use client";

// measures its own width with a resize observer and only renders the chart once a real width is
// known. this avoids the recharts responsive container warning that fires when it first paints
// before it has measured its box.

import { useEffect, useRef, useState } from "react";

export function ChartBox({
  height,
  children,
}: {
  height: number;
  children: (width: number, height: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {width > 0 ? children(width, height) : null}
    </div>
  );
}
