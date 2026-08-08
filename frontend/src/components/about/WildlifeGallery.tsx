import { useState, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import {
  MapPinIcon,
  XIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

import orioleImg from "../../assets/wildlife/black-hooded-oriole.jpg";
import liocichlaImg from "../../assets/wildlife/bugun-liocichla.jpg";
import macaqueImg from "../../assets/wildlife/lion-tailed-macaque.jpg";
import snowLeopardImg from "../../assets/wildlife/snow-leopard.jpg";
import stagBeetleImg from "../../assets/wildlife/stag-beetle.jpg";
import { track } from "../../lib/analytics";

/* ─────────────────────────────────────────────
   Wildlife polaroid data
───────────────────────────────────────────── */
const WILDLIFE = [
  {
    name: "Black-hooded Oriole",
    species: "Songbird",
    scientific: "Oriolus xanthornus",
    fact: 'Among India\'s four oriole species, often called the "golden flash of the forest" for its brilliant yellow plumage that lights up the canopy.',
    park: "Kabini Wildlife Sanctuary",
    image: orioleImg,
  },
  {
    name: "Bugun Liocichla",
    species: "Rare Bird",
    scientific: "Liocichla bugunorum",
    fact: "One of the world's rarest birds, it remained unknown to science until 2006 and is found only in a tiny corner of Arunachal Pradesh.",
    park: "Eaglenest Wildlife Sanctuary",
    image: liocichlaImg,
  },
  {
    name: "Lion-tailed Macaque",
    species: "Primate",
    scientific: "Macaca silenus",
    fact: "Some spend their entire lives in the treetops, rarely if ever touching the forest floor — canopy nomads of the Western Ghats.",
    park: "Silent Valley National Park",
    image: macaqueImg,
  },
  {
    name: "Leopard",
    species: "Big Cat",
    scientific: "Panthera pardus",
    fact: "Masters of stealth and silence — leopards can haul prey heavier than themselves high into the canopy, keeping it safe from scavengers below.",
    park: "Nagarhole National Park",
    image: snowLeopardImg,
  },
  {
    name: "Stag Beetle",
    species: "Insect",
    scientific: "Family Lucanidae",
    fact: "Male stag beetles don't use their giant jaws for biting — they use them to lift rivals and throw them off branches in wrestling matches.",
    park: "Namdapha National Park",
    image: stagBeetleImg,
  },
] as const;

/* ── Slide variants for within-modal card transitions ── */
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -36 }),
};

/* ── Polaroid modal ── */
function PolaroidModal({
  initialIdx,
  onClose,
}: {
  initialIdx: number;
  onClose: () => void;
}) {
  const N = WILDLIFE.length;
  const [idx, setIdx] = useState(initialIdx);
  const [direction, setDirection] = useState(0);

  const navigate = (dir: number) => {
    setDirection(dir);
    setIdx((prev) => (prev + dir + N) % N);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const card = WILDLIFE[idx];
  if (!card) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.82)",
          zIndex: 9000,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Modal panel */}
      <motion.div
        key="modal-panel"
        initial={{ opacity: 0, scale: 0.92, x: "-50%", y: "calc(-50% + 28px)" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        exit={{ opacity: 0, scale: 0.94, x: "-50%", y: "calc(-50% + 14px)" }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          width: "min(740px, 95vw)",
          zIndex: 9001,
          backgroundColor: "#ffffff",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: 6,
            border: "none",
            backgroundColor: "rgba(59,55,47,0.10)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XIcon size={14} weight="bold" style={{ color: "#3B372F" }} />
        </button>

        {/* Animated card content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={idx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", minHeight: 420 }}
          >
            {/* Left — image */}
            <div style={{ flex: "0 0 55%", position: "relative", minHeight: 420, overflow: "hidden" }}>
              <img
                src={card.image}
                alt={card.name}
                className="max-h-none max-w-none"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: card.name === "Leopard" ? "center 35%" : "center",
                  display: "block",
                  position: "absolute",
                  inset: 0,
                }}
              />
              {/* species pill over image */}
              <span
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  backgroundColor: "rgba(11,110,102,0.80)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 20,
                  padding: "4px 12px",
                }}
              >
                {card.species}
              </span>
            </div>

            {/* Right — details */}
            <div
              style={{
                flex: 1,
                padding: "44px 36px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <p
                className="font-['Montserrat'] font-bold leading-tight"
                style={{ fontSize: 22, color: "#3B372F", marginBottom: 4 }}
              >
                {card.name}
              </p>
              <p
                className="font-['Nunito'] italic"
                style={{ fontSize: 12, color: "#AB863F", marginBottom: 20 }}
              >
                {card.scientific}
              </p>
              <p
                className="font-['Nunito'] leading-relaxed"
                style={{ fontSize: 13.5, color: "rgba(59,55,47,0.75)", marginBottom: 24 }}
              >
                {card.fact}
              </p>
              <div className="flex items-center gap-1.5">
                <MapPinIcon size={12} weight="fill" style={{ color: "#0B6E66", flexShrink: 0 }} />
                <p className="font-['Nunito'] font-semibold text-sm" style={{ color: "#0B6E66" }}>
                  {card.park}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderTop: "1px solid #E3DDD8",
            backgroundColor: "#FAFAF8",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Previous"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Nunito', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#3B372F",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.65,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
          >
            <CaretLeftIcon size={14} weight="bold" />
            Previous
          </button>

          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11,
              color: "rgba(59,55,47,0.40)",
              letterSpacing: "0.10em",
            }}
          >
            {idx + 1} / {N}
          </span>

          <button
            onClick={() => navigate(1)}
            aria-label="Next"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Nunito', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#3B372F",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.65,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
          >
            Next
            <CaretRightIcon size={14} weight="bold" />
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

/* ── Wildlife gallery component (clean fade, larger display) ── */
export function WildlifeGallery() {
  const reduced = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const [modalIdx, setModalIdx] = useState<number | null>(null);
  const N = WILDLIFE.length;

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % N);
    }, 4500);
    return () => clearInterval(timer);
  }, [reduced, N]);

  const card = WILDLIFE[activeIdx];
  if (!card) return null;
  const CARD_W = 400;
  const PHOTO_H = 268;

  return (
    <div style={{ width: CARD_W }}>
      {/* Photo card */}
      <motion.div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 4,
          padding: "8px 8px 20px",
          boxShadow: "0 16px 52px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08)",
          cursor: "zoom-in",
        }}
        onClick={() => {
          setModalIdx(activeIdx);
          const item = WILDLIFE[activeIdx];
          track("about_wildlife_open", {
            index: activeIdx,
            species_name: item?.name ?? null,
          });
        }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25 }}
      >
        {/* Photo area with crossfade */}
        <div
          style={{
            width: "100%",
            height: PHOTO_H,
            overflow: "hidden",
            backgroundColor: "#ECEAE6",
            borderRadius: 2,
            position: "relative",
          }}
        >
          {WILDLIFE.map((item, i) => (
            <motion.img
              key={item.name}
              src={item.image}
              alt={item.name}
              initial={false}
              animate={{ opacity: i === activeIdx ? 1 : 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="max-h-none max-w-none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: item.name === "Leopard" ? "center 35%" : "center",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Species pill */}
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontFamily: "'Nunito', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#ffffff",
              backgroundColor: "rgba(11,110,102,0.82)",
              backdropFilter: "blur(6px)",
              borderRadius: 20,
              padding: "4px 10px",
              zIndex: 1,
            }}
          >
            {card.species}
          </span>

          {/* View hint */}
          <span
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              fontFamily: "'Nunito', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.80)",
              zIndex: 1,
            }}
          >
            View details →
          </span>
        </div>

        {/* Caption */}
        <div
          style={{
            paddingTop: 12,
            paddingLeft: 4,
            paddingRight: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            className="font-['Montserrat'] font-bold"
            style={{ fontSize: 14, color: "#3B372F", letterSpacing: "-0.01em" }}
          >
            {card.name}
          </p>
          <p
            className="font-['Nunito']"
            style={{ fontSize: 10, color: "rgba(59,55,47,0.40)", letterSpacing: "0.04em" }}
          >
            {activeIdx + 1} / {N}
          </p>
        </div>
      </motion.div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5 justify-center" style={{ marginTop: 14 }}>
        {WILDLIFE.map((item, i) => (
          <button
            key={item.name}
            onClick={() => setActiveIdx(i)}
            style={{
              width: i === activeIdx ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === activeIdx ? "#0B6E66" : "rgba(11,110,102,0.22)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.35s ease",
              padding: 0,
            }}
            aria-label={`Show ${item.name}`}
          />
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalIdx !== null && (
          <PolaroidModal key="polaroid-modal" initialIdx={modalIdx} onClose={() => setModalIdx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
