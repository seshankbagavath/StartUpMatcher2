/**
 * ScrollStoryboard
 *
 * A sticky scroll section that cycles through 5 images as the user scrolls.
 * The container is 500 vh tall; each "frame" occupies 100 vh of scroll travel.
 * Images crossfade with a subtle Ken-Burns scale so the transition feels
 * like a cinematic video rather than a slide-show.
 */
import { useRef, useState } from "react";
import {
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
  motion,
} from "framer-motion";

import img1 from "@assets/storyboard_1_logo_1777781988631.png";
import img2 from "@assets/storyboard_2_transformation_1777781988631.png";
import img3 from "@assets/storyboard_3_realistic_1777781988630.png";
import img4 from "@assets/storyboard_4_ignition_1777781988629.png";
import img5 from "@assets/storyboard_5_takeoff_1777781988628.png";

const FRAMES = [
  {
    src: img1,
    label: "The Idea",
    caption:
      "Every great company starts as a single idea — a sketch on a napkin, a thought in the shower.",
    accent: "hsl(0 0% 100%)",
  },
  {
    src: img2,
    label: "Taking Shape",
    caption:
      "Your concept gains form, depth, and purpose. The vision becomes undeniable.",
    accent: "hsl(220 60% 70%)",
  },
  {
    src: img3,
    label: "On the Pad",
    caption:
      "Preparation. Evaluation. The critical moment before everything changes.",
    accent: "hsl(190 80% 65%)",
  },
  {
    src: img4,
    label: "Ignition",
    caption:
      "AI scoring, investor matches, real feedback. Your startup gets the fuel it needs.",
    accent: "hsl(35 100% 65%)",
  },
  {
    src: img5,
    label: "LiftOff",
    caption: "Watch your vision clear every horizon. The sky is not the limit.",
    accent: "hsl(190 100% 65%)",
  },
] as const;

export function ScrollStoryboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const raw = v * FRAMES.length;
    const idx = Math.min(Math.floor(raw), FRAMES.length - 1);
    setActiveIndex(idx);
  });

  const frame = FRAMES[activeIndex];

  return (
    /* Scroll travel container — 100 vh per frame */
    <div ref={containerRef} style={{ height: `${FRAMES.length * 100}vh`, position: "relative" }}>
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── Images ───────────────────────────────────── */}
        <AnimatePresence initial={false}>
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={frame.src}
              alt={frame.label}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Gradient overlay ─────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

        {/* ── Caption ──────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-16 md:pb-20 md:px-16 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Frame label */}
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: frame.accent }}
              >
                {String(activeIndex + 1).padStart(2, "0")} / {FRAMES.length} —{" "}
                {frame.label}
              </p>
              {/* Caption text */}
              <p className="text-white text-lg md:text-xl font-medium leading-snug max-w-lg drop-shadow-lg">
                {frame.caption}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Progress bar (bottom edge) ────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
          <motion.div
            className="h-full"
            style={{ backgroundColor: frame.accent }}
            animate={{ width: `${((activeIndex + 1) / FRAMES.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* ── Dot indicator (right side) ────────────────── */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          {FRAMES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === activeIndex ? 1 : 0.55,
                opacity: i === activeIndex ? 1 : 0.35,
                backgroundColor:
                  i === activeIndex ? frame.accent : "rgb(255 255 255)",
              }}
              transition={{ duration: 0.3 }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "white" }}
            />
          ))}
        </div>

        {/* ── Scroll hint (first frame only) ───────────── */}
        <AnimatePresence>
          {activeIndex === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-8 right-16 flex flex-col items-center gap-1.5 pointer-events-none select-none"
            >
              <span className="text-white/50 text-xs font-semibold tracking-widest uppercase">
                Scroll
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Frame number (top-right) ──────────────────── */}
        <div className="absolute top-6 right-6 font-display text-white/30 text-xs font-bold tracking-widest uppercase select-none">
          Scene {activeIndex + 1}
        </div>
      </div>
    </div>
  );
}
