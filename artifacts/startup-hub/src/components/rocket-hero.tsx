import { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────
const FRAME_COUNT = 240;
const FRAME_W = 1280;
const FRAME_H = 664;

function frameUrl(i: number) {
  return `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;
}

// ─── RocketHero ──────────────────────────────────────────────────────

export function RocketHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const drawnFrameRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  // ── Framer Motion scroll for text overlays ────────────────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity  = useTransform(scrollYProgress, [0, 0.06, 0.72, 0.85], [1, 1, 1, 0]);
  const heroY        = useTransform(scrollYProgress, [0.72, 0.86], [0, -28]);
  const subOpacity   = useTransform(scrollYProgress, [0, 0.06, 0.60, 0.72], [1, 1, 1, 0]);
  const ctaOpacity   = useTransform(scrollYProgress, [0, 0.06, 0.55, 0.66], [1, 1, 1, 0]);
  const cueOpacity   = useTransform(scrollYProgress, [0, 0.04, 0.12], [1, 1, 0]);

  // ── Preload all frames ────────────────────────────────────────────
  useEffect(() => {
    const imgs: HTMLImageElement[] = Array.from({ length: FRAME_COUNT }, (_, i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i + 1);
      return img;
    });
    imagesRef.current = imgs;

    // Show canvas as soon as frame 1 is ready
    imgs[0].onload = () => {
      drawFrame(0);
      setReady(true);
    };
    // If already cached
    if (imgs[0].complete) {
      drawFrame(0);
      setReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Canvas resize ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = "100%";
      canvas.style.height = "100%";
      // Redraw current frame at new size
      if (drawnFrameRef.current >= 0) drawFrame(drawnFrameRef.current);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => window.removeEventListener("resize", resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll → frame ────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrolled = window.scrollY - container.offsetTop;
      const maxScroll = container.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrolled / maxScroll));
      const idx = Math.round(progress * (FRAME_COUNT - 1));

      if (idx === drawnFrameRef.current) return;

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        drawFrame(idx);
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw a frame to the canvas ────────────────────────────────────
  function drawFrame(idx: number) {
    const canvas = canvasRef.current;
    const img = imagesRef.current[idx];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Cover-fit: scale to fill the canvas, centred
    const scale = Math.max(cw / FRAME_W, ch / FRAME_H);
    const dw = FRAME_W * scale;
    const dh = FRAME_H * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
    drawnFrameRef.current = idx;
  }

  return (
    <div
      ref={containerRef}
      style={{ height: "550vh", position: "relative" }}
    >
      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {/* Image-sequence canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s ease" }}
        />

        {/* Dark gradient at bottom for text legibility */}
        <div
          className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(2,4,12,0.88) 0%, rgba(2,4,12,0.4) 55%, transparent 100%)",
          }}
        />

        {/* ── Hero text ── */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-5 text-center px-4"
        >
          <h1 className="font-display font-bold text-6xl sm:text-7xl md:text-8xl tracking-tight leading-[1.04]">
            Lift
            <span className="text-gradient">Off</span>
            <span className="text-white">.</span>
          </h1>

          <motion.p
            style={{ opacity: subOpacity }}
            className="text-white/70 text-lg sm:text-xl max-w-sm leading-relaxed"
          >
            Validate your startup idea before you commit a year to the wrong one.
          </motion.p>

          <motion.div
            style={{ opacity: ctaOpacity }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 font-semibold gap-2 glow-primary"
              >
                Launch Your Idea
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/startups">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-white/20 bg-white/5 hover:bg-white/10 font-medium backdrop-blur-sm"
              >
                Browse Startups
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Scroll cue ── */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="absolute bottom-7 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-white/40 text-xs font-bold uppercase tracking-[0.22em]">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-7 bg-gradient-to-b from-white/40 to-transparent"
          />
        </motion.div>
      </div>
    </div>
  );
}
