import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRightIcon,
  BinocularsIcon,
  LeafIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import bannerImage from "../assets/Banner_Image_V2.jpg";
import expertConnectImg from "../assets/Expert_Connect.jpg";
import { claimHomeSectionView, track } from "../lib/analytics";

const words = ["Connect", "Conserve", "Coexist"] as const;

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerItemScale = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const comingSoonOfferings = [
  {
    title: "Shared Safaris",
    body: "Some sightings are better witnessed together. Join travellers heading to the same park on the same dates, share the cost, and experience the forest alongside people who share your curiosity.",
    accent: "#0B6E66",
    accentBg: "rgba(11,110,102,0.07)",
    to: "/safaris",
  },
  {
    title: "Homestays",
    body: "Stay with people whose lives are deeply rooted in the landscapes around them — expert-run homestays near the forest shaped by local knowledge and a genuine connection to nature.",
    accent: "#AB863F",
    accentBg: "rgba(171,134,63,0.07)",
    to: "/homestays",
  },
  {
    title: "More to Come",
    body: "We're building more ways to make every wildlife journey more meaningful. Stay tuned.",
    accent: "#3B372F",
    accentBg: "rgba(59,55,47,0.05)",
    to: null,
  },
] as const;

const responsiblePrinciples = [
  {
    num: "01",
    Icon: LeafIcon,
    title: "Respect for Nature",
    desc: "Responsible travel means minimising disturbance to wildlife and habitats while promoting ethical practices in the field.",
  },
  {
    num: "02",
    Icon: ShieldCheckIcon,
    title: "Expert-Led Exploration",
    desc: "Meaningful wildlife experiences are shaped by guides and naturalists who understand the wild, making your journey more about knowledge than recreation.",
  },
  {
    num: "03",
    Icon: UsersThreeIcon,
    title: "Support Local Communities",
    desc: "We partner with guides and naturalists who support conservation while helping create sustainable livelihoods for local communities.",
  },
  {
    num: "04",
    Icon: BinocularsIcon,
    title: "Beyond Iconic Species",
    desc: "We encourage travellers to appreciate entire ecosystems — from birds and insects to plants and natural history — not just a single species.",
  },
] as const;

export function HomePage() {
  const [wordIndex, setWordIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Once per section per tab session (sessionStorage) — revisiting / later won't re-fire.
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-home-section]"),
    );
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = entry.target.getAttribute("data-home-section");
          if (!section) continue;
          if (!claimHomeSectionView(section)) {
            observer.unobserve(entry.target);
            continue;
          }
          track("home_section_view", { section });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.35 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section
        ref={heroRef}
        data-home-section="hero"
        className="relative flex min-h-[100dvh] w-full items-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <motion.div style={{ y: bannerY }} className="absolute top-[-15%] h-[130%] w-full">
            <img
              src={bannerImage}
              alt="Elephant in forest"
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-black/50 opacity-[0.7]" />
        </div>

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-start px-8 pt-24 pb-16 text-left font-semibold text-white md:px-14 lg:px-20">
          <motion.p
            initial={{ opacity: 0, x: -16, y: 16 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-4 font-['Nunito'] text-xs font-semibold tracking-[0.18em] uppercase"
            style={{ color: "#F0C165" }}
          >
            Bringing India&apos;s wildlife ecosystem together
          </motion.p>

          <div className="relative mb-6 h-[1.15em] w-full overflow-hidden font-['Montserrat'] text-6xl leading-[1.1] font-extrabold md:text-7xl lg:text-8xl xl:text-[7rem]">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: 72, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -72, opacity: 0 }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                className="absolute text-white"
              >
                {words[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mb-10 max-w-lg font-['Nunito'] text-lg leading-relaxed font-medium"
            style={{ color: "rgba(170, 210, 200, 0.92)" }}
          >
            India is home to exceptional naturalists and guides, who know the wild better than any
            guidebook. Finding them, however, has never been easy.
            <br />
            <br />
            Wildbook helps you discover them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              to="/experts"
              onClick={() => track("home_cta_click", { cta: "meet_experts" })}
              className="group inline-flex items-center gap-3 rounded-sm border border-white/70 px-6 py-3 font-['Nunito'] text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Meet the Experts
              <ArrowRightIcon
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About snippet */}
      <section
        data-home-section="about"
        className="py-14 md:py-20"
        style={{ backgroundColor: "#074A46" }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col gap-6">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="font-['Nunito'] text-xs font-semibold tracking-[0.18em] uppercase"
              style={{ color: "#F0C165" }}
            >
              Why Wildbook Exists
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-['Montserrat'] text-3xl leading-[1.1] font-bold md:text-4xl lg:text-[2.6rem]"
              style={{ color: "#ffffff" }}
            >
              The wildlife community was never missing.{" "}
              <span style={{ color: "#F0C165" }}>It was simply hard to discover.</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.65, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between"
            >
              <p
                className="max-w-md font-['Nunito'] text-[16px] font-medium"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Wildbook helps you connect with India&apos;s trusted guides and naturalists, and
                explore the wildlife experiences they offer — all in one place.
              </p>
              <Link
                to="/about"
                onClick={() => track("home_cta_click", { cta: "read_story" })}
                className="group inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-sm px-6 py-3 font-['Nunito'] text-sm font-semibold transition-colors lg:self-auto"
                style={{ backgroundColor: "#0B6E66", color: "#ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#095B54";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#0B6E66";
                }}
              >
                Read Our Story
                <ArrowRightIcon
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        data-home-section="offerings"
        className="relative overflow-hidden py-14 md:py-20"
        style={{ backgroundColor: "#F6F4F1" }}
      >
        <div
          className="pointer-events-none absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(11,110,102,0.07) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="pointer-events-none absolute right-1/4 bottom-0 h-72 w-72 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(201,132,58,0.06) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        <div className="container relative mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="mb-8 max-w-2xl md:mb-10">
            <div className="mb-4 inline-flex items-center gap-4">
              <span
                className="rounded-sm px-3 py-1 font-['Nunito'] text-xs font-bold tracking-[0.18em] uppercase"
                style={{ color: "#AB863F", border: "1px solid rgba(171,134,63,0.4)" }}
              >
                START YOUR JOURNEY
              </span>
              <div
                className="hidden h-px w-16 sm:block"
                style={{ backgroundColor: "rgba(201,132,58,0.35)" }}
              />
            </div>
            <h2
              className="font-['Montserrat'] text-2xl leading-tight font-bold md:text-3xl lg:text-4xl"
              style={{ color: "#3B372F" }}
            >
              Every unforgettable wildlife journey begins with the right people.{" "}
              <span className="font-medium not-italic" style={{ color: "#0B6E66" }}>
                Find the ones who know the wild best.
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <Link
                to="/experts"
                onClick={() => track("home_cta_click", { cta: "find_expert" })}
                className="relative block overflow-hidden rounded-xl"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                }}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
                  <img
                    src={expertConnectImg}
                    alt="Guide walking with a traveller in the forest"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.48) 20%, transparent 60%)",
                    }}
                  />
                  <div
                    className="absolute top-4 left-4 flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-['Nunito'] text-xs font-semibold text-white"
                    style={{ backgroundColor: "#0B6E66" }}
                  >
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    Live Now
                  </div>
                </div>

                <div className="px-6 pt-5 pb-6">
                  <h3
                    className="mb-2 font-['Montserrat'] text-xl font-bold md:text-2xl"
                    style={{ color: "#1B3D2C" }}
                  >
                    Expert Connect
                  </h3>
                  <p
                    className="mb-5 font-['Nunito'] text-sm leading-relaxed"
                    style={{ color: "rgba(59,55,47,0.65)" }}
                  >
                    Naturalists and forest guides who have spent years understanding India&apos;s
                    wild — now discoverable by specialty, destination, and the experiences they
                    curate.
                  </p>
                  <span
                    className="group/btn inline-flex items-center gap-2 rounded-sm px-5 py-2.5 font-['Nunito'] text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#0B6E66" }}
                  >
                    Find your Expert
                    <ArrowRightIcon
                      size={15}
                      className="transition-transform duration-200 group-hover/btn:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              className="flex flex-col gap-4"
            >
              {comingSoonOfferings.map(({ title, body, accent, accentBg, to }) => {
                const cardClass =
                  "relative flex gap-0 overflow-hidden rounded-xl";
                const cardStyle = {
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                } as const;
                const inner = (
                  <>
                    <div
                      className="w-1 shrink-0 rounded-l-xl"
                      style={{ backgroundColor: accent, opacity: 0.55 }}
                    />
                    <div className="flex-1 px-5 py-5">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3
                          className="font-['Montserrat'] text-base font-bold"
                          style={{ color: "#1B3D2C" }}
                        >
                          {title}
                        </h3>
                        <span
                          className="mt-0.5 shrink-0 rounded-sm px-2.5 py-1 font-['Nunito'] text-[10px] font-semibold tracking-[0.16em] uppercase"
                          style={{ backgroundColor: accentBg, color: accent }}
                        >
                          Coming Soon
                        </span>
                      </div>
                      <p
                        className="font-['Nunito'] text-sm leading-relaxed"
                        style={{ color: "rgba(59,55,47,0.6)" }}
                      >
                        {body}
                      </p>
                    </div>
                  </>
                );
                return (
                  <motion.div
                    key={title}
                    variants={slideFromRight}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  >
                    {to ? (
                      <Link to={to} className={cardClass} style={cardStyle}>
                        {inner}
                      </Link>
                    ) : (
                      <div className={cardClass} style={cardStyle}>
                        {inner}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Responsible Tourism */}
      <section
        data-home-section="responsible"
        className="py-14"
        style={{ backgroundColor: "#F6F4F1" }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="mb-10 text-right">
            <p
              className="mb-2 font-['Nunito'] text-xs font-semibold tracking-[0.18em] uppercase"
              style={{ color: "#AB863F" }}
            >
              Our Take on Responsible Tourism
            </p>
            <h2
              className="font-['Montserrat'] text-2xl font-bold md:text-3xl lg:text-4xl"
              style={{ color: "#3B372F" }}
            >
              The wild doesn&apos;t belong to us. We belong to it.
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {responsiblePrinciples.map(({ num, Icon, title, desc }) => (
              <motion.div
                key={num}
                variants={staggerItemScale}
                whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
                className="relative flex flex-col gap-4 overflow-hidden rounded-xl p-6"
                style={{
                  backgroundColor: "rgba(11,110,102,0.07)",
                  borderTop: "2px solid rgba(11,110,102,0.55)",
                }}
              >
                <span
                  className="pointer-events-none absolute right-4 bottom-2 select-none font-['Montserrat'] font-black leading-none"
                  style={{ fontSize: 80, color: "rgba(11,110,102,0.07)", lineHeight: 1 }}
                >
                  {num}
                </span>

                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(11,110,102,0.12)" }}
                  >
                    <Icon size={20} weight="duotone" style={{ color: "#0B6E66" }} />
                  </div>
                  <span
                    className="font-['Montserrat'] text-xs font-bold tracking-[0.14em]"
                    style={{ color: "#AB863F" }}
                  >
                    {num}
                  </span>
                </div>

                <h3
                  className="font-['Montserrat'] text-sm leading-snug font-bold"
                  style={{ color: "#3B372F" }}
                >
                  {title}
                </h3>

                <p
                  className="font-['Nunito'] text-sm leading-relaxed"
                  style={{ color: "rgba(59,55,47,0.65)" }}
                >
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
