"use client";

/*
  the hovering arrow at the bottom of the landing section. it bobs up and down to invite a
  click, and clicking it smoothly scrolls down to the first engine. because it lives in the
  normal flow at the bottom of the header, it naturally scrolls out of view once the user
  moves past the landing section.
*/

import { motion } from "motion/react";

export function ScrollCue() {
  // smoothly scroll the page down to the first prediction engine
  function scrollToEngine1() {
    document.getElementById("engine-1")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mt-10 flex justify-center">
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
