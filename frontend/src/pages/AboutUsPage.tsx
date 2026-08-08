import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@phosphor-icons/react";

import LeopardImg from "../assets/AboutLeopard.jpg";
import AnuragImg from "../assets/team_photos/Anurag.png";
import NishadImg from "../assets/team_photos/Nishad.png";
import SangeethaImg from "../assets/team_photos/Sangeetha.png";
import PavanImg from "../assets/team_photos/Pavan.png";
import { WildlifeGallery } from "../components/about/WildlifeGallery";
import { track } from "../lib/analytics";

/* ─────────────────────────────────────────────
   Animation helpers
───────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const;

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-50px" }}
      transition={{ duration: 0.65, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionEyebrow({ text, light = false }: { text: string; light?: boolean }) {
  const [num = "", ...rest] = text.split("—");
  return (
    <p
      className="font-['Nunito'] font-semibold text-xs tracking-[0.18em] uppercase mb-5 flex items-center gap-2"
      style={{ color: light ? "#F0C165" : "#AB863F" }}
    >
      <span style={{ color: light ? "rgba(240,193,101,0.55)" : "rgba(171,134,63,0.5)" }}>
        {num.trim()}
      </span>
      <span style={{ color: light ? "rgba(240,193,101,0.4)" : "rgba(171,134,63,0.4)" }}>—</span>
      <span>{rest.join("—").trim()}</span>
    </p>
  );
}

/* ─────────────────────────────────────────────
   Section 3 + 4 data
───────────────────────────────────────────── */
const EXPERT_CARDS = [
  {
    num: "01",
    label: "Guides",
    tagline: "The ones who know the land by heart.",
    body: "Local guides who navigate the forest, read animal behaviour in real time, and get you to the right place at the right moment.",
    tags: ["Forest Navigation", "Animal Tracking", "Local Knowledge"],
  },
  {
    num: "02",
    label: "Naturalists",
    tagline: "The ones who teach you how to see.",
    body: "Wildlife biologists and naturalists who translate bird calls, tracks, and ecology into stories that make every moment richer.",
    tags: ["Birding", "Ecology", "Behaviour Reading"],
  },
] as const;

const IMPACT_CARDS = [
  {
    num: "01",
    label: "More Meaningful",
    body: "Journeys that travellers describe for years — grounded in real understanding of the wild.",
  },
  {
    num: "02",
    label: "More Informed",
    body: "Travellers who leave knowing more about the wild than when they arrived.",
  },
  {
    num: "03",
    label: "More Respectful",
    body: "Deeper understanding drives the choices that protect ecosystems and local communities.",
  },
] as const;

const TEAM = [
  { img: AnuragImg, name: "Anurag Jha", role: "NATURALIST", offset: false },
  { img: NishadImg, name: "Nishad Barde", role: "FILMMAKER", offset: true },
  { img: SangeethaImg, name: "Sangeetha Venugopalan", role: "DESIGN CONSULTANT", offset: false },
  { img: PavanImg, name: "Sai Pavan Annamaraju", role: "IT CONSULTANT", offset: true },
] as const;

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function AboutUsPage() {
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F4F1" }}>
      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div
        className="group relative w-full overflow-hidden"
        style={{ height: "clamp(520px, 85vh, 800px)" }}
      >
        <motion.img
          src={LeopardImg}
          alt="Leopard resting on a tree branch in dappled forest light"
          className="w-full h-full object-cover object-center"
          initial={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(4,16,11,0.90) 0%, rgba(4,16,11,0.60) 48%, rgba(4,16,11,0.20) 100%)",
          }}
        />

        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-14 lg:px-20 pb-14 md:pb-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 max-w-screen-xl w-full">
            <div className="max-w-xl">
              <motion.p
                initial={{ opacity: 0, x: reduced ? 0 : -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.25, ease }}
                className="font-['Nunito'] font-semibold text-xs tracking-[0.18em] uppercase mb-4"
                style={{ color: "#F0C165" }}
              >
                About Wildbook
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: reduced ? 0 : 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.38, ease }}
                className="font-['Montserrat'] font-bold text-3xl md:text-4xl lg:text-5xl text-white leading-[1.1]"
              >
                Bringing deeper understanding to every encounter in nature.
              </motion.h1>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          01 — LOOK CLOSER
      ══════════════════════════════════════ */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-14 lg:gap-20 items-center max-w-5xl">
            {/* Left — text */}
            <div>
              <FadeUp>
                <SectionEyebrow text="01 — LOOK CLOSER" />
              </FadeUp>

              <FadeUp delay={0.08}>
                <h2
                  className="font-['Montserrat'] font-bold text-2xl md:text-3xl lg:text-4xl leading-tight mb-7"
                  style={{ color: "#3B372F" }}
                >
                  The wild is more than what you came to see.
                </h2>
              </FadeUp>

              <FadeUp delay={0.14}>
                <div className="space-y-4 font-['Nunito'] text-sm leading-relaxed" style={{ color: "#3B372F" }}>
                  <p>
                    Wildlife travel can sometimes become a search for the spectacular — a tiger, a leopard, a
                    particular sighting to take home.
                  </p>
                  <p>But a forest is never just one animal.</p>
                  <p>
                    It is birds calling from the canopy, tracks in the dust, insects beneath the leaves, plants
                    shaping entire habitats, and countless relationships unfolding around us. The more we
                    understand these connections, the more there is to notice.
                  </p>
                  <p style={{ fontWeight: 600 }}>
                    Because the real magic of the wild lies in everything that happens beyond the obvious.
                  </p>
                </div>
              </FadeUp>
            </div>

            {/* Right — wildlife gallery */}
            <FadeUp delay={0.2} className="flex justify-center lg:justify-end">
              <WildlifeGallery />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          02 — OUR BELIEF  (dark teal)
      ══════════════════════════════════════ */}
      <section className="py-14 md:py-20" style={{ backgroundColor: "#074A46" }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <FadeUp>
              <SectionEyebrow text="02 — OUR BELIEF" light />
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2
                className="font-['Montserrat'] font-bold text-2xl md:text-3xl lg:text-4xl leading-tight mb-8"
                style={{ color: "#ffffff" }}
              >
                We believe better understanding makes better journeys.
              </h2>
            </FadeUp>

            <FadeUp delay={0.16}>
              <div className="space-y-4 font-['Nunito'] text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                <p>A safari changes when you begin to understand the landscape you're moving through.</p>
                <p>
                  The behaviour of an animal becomes a story. A familiar trail becomes a clue. A fleeting sighting
                  becomes part of something much larger.
                </p>
                <p style={{ color: "rgba(255,255,255,0.90)", fontWeight: 600 }}>
                  We want wildlife travel to feel less like ticking off sightings and more like learning to see —
                  with curiosity, context, and a deeper appreciation for the places we visit.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          03 — EXPERT CONNECT  (manifesto style)
      ══════════════════════════════════════ */}
      <section className="pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header row */}
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <SectionEyebrow text="03 — EXPERT CONNECT" />
                <h2
                  className="font-['Montserrat'] font-bold text-2xl md:text-3xl lg:text-4xl leading-tight"
                  style={{ color: "#3B372F", maxWidth: 480 }}
                >
                  So we bring the right people closer to the journey.
                </h2>
              </div>
              <p
                className="font-['Nunito'] text-sm leading-relaxed md:text-right md:max-w-xs shrink-0"
                style={{ color: "#3B372F" }}
              >
                Not just someone to take you into the forest — someone who helps you understand it.
              </p>
            </div>
          </FadeUp>

          {/* Hairline */}
          <div style={{ height: 1, backgroundColor: "#E3DDD8", marginBottom: 24 }} />

          {/* Expert cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {EXPERT_CARDS.map((e, i) => (
              <motion.div
                key={e.num}
                initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                style={{
                  backgroundColor: i === 0 ? "#0B6E66" : "#ffffff",
                  borderRadius: 8,
                  padding: "36px 36px",
                  boxShadow: i === 0 ? "0 4px 24px rgba(11,110,102,0.18)" : "0 2px 10px rgba(0,0,0,0.05)",
                }}
              >
                {/* Number + badge */}
                <div className="flex items-start justify-between mb-5">
                  <span
                    className="font-['Nunito'] font-bold text-xs tracking-[0.18em] uppercase"
                    style={{ color: i === 0 ? "rgba(240,193,101,0.70)" : "#AB863F" }}
                  >
                    {e.num}
                  </span>
                  <span
                    className="font-['Nunito'] font-bold text-xs tracking-[0.12em] uppercase"
                    style={{
                      color: i === 0 ? "rgba(255,255,255,0.45)" : "rgba(59,55,47,0.32)",
                      border: `1px solid ${i === 0 ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.09)"}`,
                      borderRadius: 20,
                      padding: "3px 12px",
                    }}
                  >
                    Expert type
                  </span>
                </div>

                <h3
                  className="font-['Montserrat'] font-bold text-2xl leading-tight mb-2"
                  style={{ color: i === 0 ? "#ffffff" : "#3B372F" }}
                >
                  {e.label}
                </h3>
                <p
                  className="font-['Nunito'] italic text-sm mb-4"
                  style={{ color: i === 0 ? "rgba(255,255,255,0.60)" : "#AB863F" }}
                >
                  {e.tagline}
                </p>
                <p
                  className="font-['Nunito'] text-sm leading-relaxed mb-6"
                  style={{ color: i === 0 ? "rgba(255,255,255,0.78)" : "#3B372F" }}
                >
                  {e.body}
                </p>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-2">
                  {e.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-['Nunito'] font-semibold text-xs"
                      style={{
                        color: i === 0 ? "rgba(255,255,255,0.78)" : "#0B6E66",
                        backgroundColor: i === 0 ? "rgba(255,255,255,0.10)" : "rgba(11,110,102,0.07)",
                        border: `1px solid ${i === 0 ? "rgba(255,255,255,0.16)" : "rgba(11,110,102,0.14)"}`,
                        borderRadius: 20,
                        padding: "3px 12px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <FadeUp delay={0.25} className="mt-7">
            <Link
              to="/experts"
              onClick={() => track("about_cta_experts", { placement: "mid" })}
              className="inline-flex items-center gap-2 font-['Nunito'] text-sm font-semibold group"
              style={{ color: "#0B6E66" }}
            >
              Browse our network of guides and naturalists
              <ArrowRightIcon size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════
          04 — THE BIGGER PICTURE  (manifesto style)
      ══════════════════════════════════════ */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-20" style={{ backgroundColor: "#ECEAE6" }}>
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header row */}
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <SectionEyebrow text="04 — THE BIGGER PICTURE" />
                <h2
                  className="font-['Montserrat'] font-bold text-2xl md:text-3xl leading-tight"
                  style={{ color: "#3B372F", maxWidth: 420 }}
                >
                  And when understanding grows, so does the connection.
                </h2>
              </div>
              <p
                className="font-['Nunito'] text-sm leading-relaxed md:text-right md:max-w-xs shrink-0"
                style={{ color: "#3B372F" }}
              >
                The kind of wildlife travel where curiosity leads the way and every encounter leaves you seeing the
                wild a little differently.
              </p>
            </div>
          </FadeUp>

          {/* Hairline */}
          <div style={{ height: 1, backgroundColor: "#D5D0CA", marginBottom: 24 }} />

          {/* Impact cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {IMPACT_CARDS.map((c, i) => (
              <motion.div
                key={c.num}
                initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  padding: "28px 28px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  borderTop: i === 1 ? "3px solid #0B6E66" : "3px solid transparent",
                }}
              >
                <p className="font-['Nunito'] font-bold text-xs tracking-[0.18em] uppercase mb-4" style={{ color: "#AB863F" }}>
                  {c.num}
                </p>
                <h4 className="font-['Montserrat'] font-bold text-lg leading-snug mb-3" style={{ color: "#3B372F" }}>
                  {c.label}
                </h4>
                <p className="font-['Nunito'] text-sm leading-relaxed" style={{ color: "#3B372F" }}>
                  {c.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          05 — PEOPLE BEHIND THE MISSION
      ══════════════════════════════════════ */}
      <section className="py-14 md:py-20" style={{ backgroundColor: "#F6F4F1" }}>
        <div className="container mx-auto px-6 lg:px-12">
          <FadeUp className="mb-10">
            <SectionEyebrow text="05 — THE TEAM" />
            <h2
              className="font-['Montserrat'] font-bold text-2xl md:text-3xl lg:text-4xl leading-tight mb-4"
              style={{ color: "#3B372F", maxWidth: 560 }}
            >
              The people behind the mission.
            </h2>
            <p className="font-['Nunito'] text-sm leading-relaxed" style={{ color: "#3B372F", maxWidth: 520 }}>
              A diverse group of naturalists, designers, filmmakers, engineers, and consultants — united by a
              genuine love for wildlife and the stories it inspires.
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 items-start px-4 md:px-10 lg:px-0">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 44, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -10, transition: { duration: 0.32 } }}
                className={`relative rounded-2xl overflow-hidden group cursor-default${member.offset ? " md:mt-12" : ""}`}
                style={{
                  aspectRatio: "3/4",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.07)",
                }}
              >
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <div
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 48%, transparent 100%)",
                  }}
                />
                <div className="absolute bottom-0 left-0 p-5 transition-transform duration-300 ease-out group-hover:-translate-y-1">
                  <p className="font-['Montserrat'] font-bold text-white text-base leading-tight">{member.name}</p>
                  <p className="font-['Nunito'] text-xs tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {member.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CLOSING — solid dark section + CTA
      ══════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#1B3D2C",
          padding: "clamp(72px, 10vh, 120px) 24px",
          textAlign: "center",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px" }}
          transition={{ duration: 0.9, ease }}
          className="font-['Montserrat'] text-white leading-tight mx-auto"
          style={{
            fontWeight: 900,
            fontSize: "clamp(28px, 4.5vw, 52px)",
            maxWidth: 600,
            marginBottom: 40,
            letterSpacing: "-0.01em",
          }}
        >
          There is always more to see when you know how to look.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.18, ease }}
        >
          <Link
            to="/experts"
            data-testid="link-about-cta"
            onClick={() => track("about_cta_experts", { placement: "closing" })}
            className="inline-flex items-center gap-2 font-['Nunito'] text-sm font-semibold rounded-sm px-7 py-3.5 transition-colors group"
            style={{ backgroundColor: "#0B6E66", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#095B54")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B6E66")}
          >
            Plan your next trip
            <ArrowRightIcon size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
