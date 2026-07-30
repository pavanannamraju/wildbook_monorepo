import { useRef } from "react";
import { Hero } from "../components/Hero";
import { StickyHeader } from "../components/StickyHeader";
import { WhatWeDo } from "../components/WhatWeDo";
import { AboutUs } from "../components/AboutUs";
import { ResponsibleTourism } from "../components/ResponsibleTourism";
import { Team } from "../components/Team";
import { MapSection } from "../components/MapSection";
import { useScrollPastRef } from "../hooks/useScrollPastRef";

export function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const isPastHero = useScrollPastRef(heroRef);

  return (
    <div className="bg-[#f6f4f0]">
      <StickyHeader visible={isPastHero} />
      <main>
        <Hero ref={heroRef} />
        <WhatWeDo />
        <AboutUs />
        <ResponsibleTourism />
        <Team />
        <MapSection />
      </main>
    </div>
  );
}

