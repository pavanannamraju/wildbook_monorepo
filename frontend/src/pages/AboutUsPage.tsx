import Navbar from "../components/Navbar";
import heroImage from "../assets/AboutUsPageHero.png";

const PROGRESS_ITEMS = [
  {
    value: "10",
    title: "Guides & Naturalists Onboarded",
    subtitle: "Experienced voices from key wildlife regions",
  },
  {
    value: "10",
    title: "Key Parks in Phase 1",
    subtitle: "Across India's most diverse ecosystems",
  },
  {
    value: "30+",
    title: "Expert-led Experiences",
    subtitle: "Planned from birding trails to multi-day safaris",
  }
] as const;

export function AboutUsPage() {
  return (
    <main className="mx-auto w-full max-w-[1920px] bg-[#F6F4F0]">
      <section className="relative h-[600px] overflow-hidden">
        <img
          src={heroImage}
          alt="Wild landscape with safari silhouettes"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />

        <header className="absolute left-0 right-0 top-0 z-10">
          <Navbar variant="light" />
        </header>

        <div className="absolute left-1/2 top-1/2 z-10 w-full max-w-[1600px] -translate-x-1/2 -translate-y-1/2 page-px">
          <h1 className="max-w-[580px] font-['Montserrat'] text-[32px] leading-tight text-[#E8E2DC] drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] md:text-[44px] lg:text-[52px]">
            Bringing deeper understanding to every encounter in nature.
          </h1>
        </div>
      </section>

      <section className="page-px mx-auto w-full max-w-[1696px] py-4 md:pt-16 md:pb-0">
        <div className="space-y-6">
          <p className="text-[16px] leading-[1.33] font-bold text-[#2F2B28] md:text-[20px]">
            Wildlife travel today is often fragmented and misunderstood. Many journeys into the
            wild are approached purely as recreational outings, where the focus is limited to a
            handful of iconic species. Safaris, in particular, have increasingly become
            tiger-centric experiences, where the richness of the ecosystem - its birds, smaller
            mammals, insects, plants, and the intricate stories of natural history - is often
            overlooked.
          </p>
          <p className="text-[20px] leading-[1.42] font-bold text-(--color-wildbook-teal) md:text-[24px]">
            Yet the true magic of the wild lies in its complexity and interconnectedness.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          <p className="text-[16px] leading-[1.27] text-[#2F2B28] md:text-[18px]">
            Understanding landscapes, behaviours, and ecological relationships transforms a safari
            from a simple sighting-driven trip into a deeply immersive experience.
          </p>
          <p className="text-[16px] leading-[1.27] font-bold text-[#2F2B28] md:text-[18px]">
            Our platform seeks to bring that perspective back to wildlife travel - helping
            travellers engage with nature in a more informed, meaningful, and responsible way.
          </p>
          <p className="text-[16px] leading-[1.27] text-[#2F2B28] md:text-[18px]">
            We do this by building meaningful connections between travellers and the people who
            truly understand the wild. At the heart of the platform is a growing network of
            experienced guides, naturalists, and responsible wildlife tour operators who bring deep
            field knowledge and local insight to every journey. By making these experts more
            visible and accessible, we enable travellers to move beyond generic itineraries and
            experience nature through the lens of those who study, interpret, and live within these
            landscapes.
          </p>
          <p className="text-[16px] leading-[1.27] text-[#2F2B28] md:text-[18px]">
            By creating a space where credible expertise, responsible operators, and curious
            travellers come together, we hope to gradually shift how wildlife travel is approached
            - encouraging journeys that are more informed, more immersive, and ultimately more
            supportive of the ecosystems and communities that make these experiences possible.
          </p>
        </div>
      </section>
    </main>
  );
}
