import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/AboutUsPageHero.png";
import deselectedEbird from "../assets/DeselectediBird.png";
import deselectedINaturalist from "../assets/DeselectediNaturalist.png";
import deselectedMerlin from "../assets/DeselectedMerlin.png";
import deselectedNaturalistSchool from "../assets/DeselectedNaturalistSchool.png";
import selectedEbird from "../assets/SelectedEbird.png";
import selectedINaturalist from "../assets/SelectedINaturalist.png";
import selectedMerlin from "../assets/SelectedMerlin.png";
import selectedNaturalistSchool from "../assets/SelectedNaturalistSchool.png";
import { HeroReveal, Reveal, RevealItem, RevealStagger } from "../motion";

const PROGRESS_ITEMS = [
  {
    value: "50+",
    title: "Guides & Naturalists Onboarded",
    subtitle: "Experienced voices from key wildlife regions",
  },
  {
    value: "10",
    title: "Key Parks in Phase 1",
    subtitle: "Across India’s most diverse ecosystems",
  },
  {
    value: "25+",
    title: "Responsible Operators",
    subtitle: "Carefully selected for ethics and experience",
  },
  {
    value: "30+",
    title: "Expert-led Experiences",
    subtitle: "Planned from birding trails to multi-day safaris",
  },
  {
    value: "15+",
    title: "Shared Safari Routes",
    subtitle: "Connecting like-minded travellers",
  },
] as const;

const PARTNER_LOGOS = [
  { id: "ebird", defaultSrc: deselectedEbird, hoverSrc: selectedEbird, alt: "eBird" },
  {
    id: "inaturalist",
    defaultSrc: deselectedINaturalist,
    hoverSrc: selectedINaturalist,
    alt: "iNaturalist",
  },
  { id: "merlin", defaultSrc: deselectedMerlin, hoverSrc: selectedMerlin, alt: "Merlin" },
  {
    id: "naturalist-school",
    defaultSrc: deselectedNaturalistSchool,
    hoverSrc: selectedNaturalistSchool,
    alt: "The Naturalist School",
  },
] as const;

export function AboutUsPage() {
  return (
    <main className="mx-auto w-full max-w-[1920px] bg-[#F6F4F0]">
      <section className="relative h-[600px] overflow-hidden">
        <HeroReveal preset="image" className="h-full w-full">
          <img
            src={heroImage}
            alt="Wild landscape with safari silhouettes"
            className="h-full w-full object-cover"
          />
        </HeroReveal>
        <div className="absolute inset-0 bg-black/25" />

        <header className="absolute left-0 right-0 top-0 z-10">
          <Navbar variant="light" />
        </header>

        <div className="absolute left-1/2 top-1/2 z-10 w-full max-w-[1600px] -translate-x-1/2 -translate-y-1/2 page-px">
          <HeroReveal delay={0.2} preset="fadeUp">
            <h1 className="max-w-[580px] font-['Montserrat'] text-[32px] leading-tight text-[#E8E2DC] drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] md:text-[44px] lg:text-[52px]">
              Bringing deeper understanding to every encounter in nature.
            </h1>
          </HeroReveal>
        </div>
      </section>

      <section className="page-px mx-auto w-full max-w-[1696px] py-16 md:py-20">
        <RevealStagger preset="default" className="space-y-6">
          <RevealItem
            as="p"
            className="text-[16px] leading-[1.33] font-bold text-[#2F2B28] md:text-[20px]"
          >
            Wildlife travel today is often fragmented and misunderstood. Many journeys into the
            wild are approached purely as recreational outings, where the focus is limited to a
            handful of iconic species. Safaris, in particular, have increasingly become
            tiger-centric experiences, where the richness of the ecosystem - its birds, smaller
            mammals, insects, plants, and the intricate stories of natural history - is often
            overlooked.
          </RevealItem>
          <RevealItem
            as="p"
            preset="fadeUp"
            className="text-[20px] leading-[1.42] font-bold text-(--color-wildbook-teal) md:text-[24px]"
          >
            Yet the true magic of the wild lies in its complexity and interconnectedness.
          </RevealItem>
        </RevealStagger>

        <RevealStagger preset="slow" className="mt-10 space-y-8">
          <RevealItem
            as="p"
            className="text-[16px] leading-[1.27] text-[#2F2B28] md:text-[18px]"
          >
            Understanding landscapes, behaviours, and ecological relationships transforms a safari
            from a simple sighting-driven trip into a deeply immersive experience.
          </RevealItem>
          <RevealItem
            as="p"
            className="text-[16px] leading-[1.27] font-bold text-[#2F2B28] md:text-[18px]"
          >
            Our platform seeks to bring that perspective back to wildlife travel - helping
            travellers engage with nature in a more informed, meaningful, and responsible way.
          </RevealItem>
          <RevealItem
            as="p"
            className="text-[16px] leading-[1.27] text-[#2F2B28] md:text-[18px]"
          >
            We do this by building meaningful connections between travellers and the people who
            truly understand the wild. At the heart of the platform is a growing network of
            experienced guides, naturalists, and responsible wildlife tour operators who bring deep
            field knowledge and local insight to every journey. By making these experts more
            visible and accessible, we enable travellers to move beyond generic itineraries and
            experience nature through the lens of those who study, interpret, and live within these
            landscapes.
          </RevealItem>
          <RevealItem
            as="p"
            className="text-[16px] leading-[1.27] text-[#2F2B28] md:text-[18px]"
          >
            By creating a space where credible expertise, responsible operators, and curious
            travellers come together, we hope to gradually shift how wildlife travel is approached
            - encouraging journeys that are more informed, more immersive, and ultimately more
            supportive of the ecosystems and communities that make these experiences possible.
          </RevealItem>
        </RevealStagger>
      </section>

      <section className="page-px pb-16 md:pb-20">
        <Reveal
          preset="scaleIn"
          className="mx-auto w-full max-w-[1696px] overflow-hidden rounded-[20px] bg-[#EBE7E3] bg-cover bg-center px-5 py-10 md:px-12 md:py-12"
        >
          <div className="mx-auto max-w-[1120px]">
            <Reveal className="text-center">
              <p className="text-[16px] font-bold text-(--color-wildbook-accent) md:text-[20px]">
                What we’re working towards
              </p>
              <p className="mt-2 text-[16px] font-bold text-[#2F2B28] md:text-[20px]">
                What we’ve been building so far — a snapshot of our progress and early milestones.
              </p>
            </Reveal>

            <RevealStagger
              preset="fast"
              className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5"
            >
              {PROGRESS_ITEMS.map((item) => (
                <RevealItem key={item.title} as="article" preset="fadeUpSoft" className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[44px] leading-[0.9] font-semibold text-[#73706C] md:text-[60px]">
                      {item.value}
                    </p>
                    <h2 className="font-['Montserrat'] text-[12px] leading-8 text-[#2F2B28] md:text-[16px]">
                      {item.title}
                    </h2>
                  </div>
                  <p className="text-[14px] leading-7 font-bold text-[#73706C]">{item.subtitle}</p>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </Reveal>
      </section>

      <section className="page-px pb-8 md:pb-12">
        <RevealStagger
          preset="fast"
          className="mx-auto max-w-[1379px] grid grid-cols-2 items-center gap-x-8 gap-y-6 md:grid-cols-4 md:gap-x-10 md:gap-y-8"
        >
          {PARTNER_LOGOS.map((logo) => (
            <RevealItem key={logo.id} preset="fadeIn" className="flex items-center justify-center">
              <span className="group relative inline-flex h-12 w-full items-center justify-center md:h-16">
                <img
                  src={logo.defaultSrc}
                  alt={`${logo.alt} logo`}
                  className="block h-auto max-h-full w-auto max-w-full object-contain transition-opacity duration-200 group-hover:opacity-0"
                />
                <img
                  src={logo.hoverSrc}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 m-auto h-auto max-h-full w-auto max-w-full object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                />
              </span>
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      <section className="page-px pb-16 md:pb-20">
        <Reveal
          preset="fadeUp"
          className="mx-auto flex w-full max-w-[1232px] flex-col items-center gap-8 text-center"
        >
          <div>
            <p className="text-[16px] font-bold text-(--color-wildbook-accent) md:text-[20px]">
              Partner With Us
            </p>
            <p className="mt-2 text-[20px] font-semibold leading-[1.33] text-[#2F2B28]">
              We’re always looking to collaborate with people who share our approach to wildlife
              travel.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex h-14 items-center justify-center gap-2 rounded bg-(--color-wildbook-teal) px-6 text-[14px] font-medium text-[#FAFAFA] transition-colors hover:bg-[#095852]"
          >
            Get in touch
            <ArrowRightIcon size={24} />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
