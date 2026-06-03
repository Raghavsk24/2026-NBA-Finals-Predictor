"use client";

/*
  the hovering arrow at the bottom of the landing section. it bobs up and down to invite a
  click, and clicking it smoothly scrolls down to the first engine. it watches the first engine
  with an intersection observer and fades itself out the moment that engine scrolls into view,
  so the user stops seeing it once the pace-adjusted efficiency model is on screen.
*/

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function ScrollCue() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById("engine-1");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // smoothly scroll the page down to the first prediction engine
  function scrollToEngine1() {
    document.getElementById("engine-1")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div
      className={`mt-10 flex justify-center transition-opacity duration-300 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <motion.button
        type="button"
        onClick={scrollToEngine1}
        aria-label="Scroll down to the first prediction engine"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-black/40 bg-white/70 text-black shadow-sm backdrop-blur transition-colors hover:bg-white"
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.button>
    </div>
  );
}
