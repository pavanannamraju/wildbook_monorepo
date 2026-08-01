import { useMemo, useState } from "react";
import GuideConnectImage from "../assets/GuideConnect.png";
// import SharedSafarisImage from "../assets/SharedSafaris.png";
// import WildLifePackagesImage from "../assets/WildLifePackages.png";
import { useNavigate } from "react-router-dom";
import { Reveal, RevealItem, RevealStagger } from "../motion";

const tabs = [
  {
    title: "Guide Connect",
    heading: "Begin your journey with the people who know the forest best.",
    highlights: [
      "Speak directly with seasoned experts and gain insight for your trip",
      "Book expert-led experiences - from birding trails to herping and more",
      "Stay at guide-run homestays, rooted in local landscapes",
    ],
    buttonText: "Find your Expert",
    buttonLink: "/experts",
    image: GuideConnectImage,
    buttonDisabled: false,
  },
  // {
  //   title: "Shared Safaris",
  //   heading: "Some journeys become richer when shared with fellow explorers.",
  //   highlights: [
  //     "Find wildlife enthusiasts headed to the same park, on the same dates",
  //     "Share costs, sightings, stories — and memories from the wild",
  //     "Join a ready safari plan or create your own, built around your intent",
  //   ],
  //   buttonText: "Join/Create a Safari",
  //   buttonLink: "/safaris",
  //   image: SharedSafarisImage,
  //   buttonDisabled: false,
  // },
  // {
  //   title: "Wildlife Packages",
  //   heading: "Thoughtfully crafted journeys, ready when you are.",
  //   highlights: [
  //     "Discover curated plans from India's leading wildlife tour operators",
  //     "Compare prices and itineraries across multiple packages easily",
  //     "Find the best value while enjoying a smooth, hassle-free booking",
  //   ],
  //   buttonText: "Discover Packages",
  //   buttonLink: "/packages",
  //   image: WildLifePackagesImage,
  //   buttonDisabled: true,
  // },
] as const;

export function WhatWeDo() {
  const [activeTabTitle, setActiveTabTitle] = useState<string>(tabs[0].title);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.title === activeTabTitle) ?? tabs[0],
    [activeTabTitle],
  );

  const navigate = useNavigate();

  return (
    <section className="relative pt-16 lg:pt-20 pb-8 page-px max-w-[1920px] mx-auto">
      {/* Section header row — heading left, CONNECT watermark right */}
      <Reveal className="mb-[24px] flex items-center justify-between overflow-visible">
        <div>
          <h2 className="font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">
            Our Offerings
          </h2>
          <p className="font-['Nunito'] font-bold text-[20px] lg:text-[28px] leading-snug lg:leading-[40px] text-[#2F2B28] mt-1 lg:mt-2 max-w-[760px]">
            With the wild so complex, exploring it should feel simple
          </p>
        </div>
      </Reveal>

      {/* Main content: image + card */}
      <div className="flex flex-col lg:flex-row gap-[24px]">
        {/* Left: photo — 50% at desktop matching Figma 800/1601 */}
        <Reveal preset="image" early className="w-full lg:w-[60%] shrink-0 overflow-hidden rounded-[16px]">
          <img
            src={activeTab.image}
            alt={activeTab.title}
            className="h-auto w-full object-cover"
            style={{ aspectRatio: "800/512" }}
          />
        </Reveal>

        {/* Right: info card (wrapper carries the watermark behind the card) */}
        <Reveal preset="fadeRight" delay={0.12} className="relative min-w-0 flex-1">
          {/* <span
            aria-hidden="true"
            className="absolute top-[-80px] left-0 right-0 z-0 text-center lg:block pointer-events-none select-none leading-none"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 400,
              fontSize: "100px",
              color: "#f6f4f0",
              opacity: 0.7,
              mixBlendMode: "multiply",
            }}
          >
            CONNECT
          </span> */}
          <div className="relative z-10 rounded-[16px] bg-[#F3EEE9] px-8 py-8 flex flex-col gap-[24px]">
            <p className="text-left text-[14px] lg:text-[24px] font-['Nunito'] font-bold rounded-[4px] text-[#73706C]">Guide Connect</p>

            <div className="flex flex-col flex-1 justify-between gap-[40px]">
              <div className="flex flex-col gap-[16px]">
                <h3
                  className="text-[20px] lg:text-[28px] leading-snug lg:leading-[36px] text-[#0B6E66]"
                  style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 350 }}
                >
                  {activeTab.heading}
                </h3>

                <RevealStagger as="ul" preset="fast" className="flex flex-col gap-[8px]">
                  {activeTab.highlights.map((highlight) => (
                    <RevealItem as="li" key={highlight} className="flex items-start gap-[4px]">
                      <span className="shrink-0 size-[32px] flex items-center justify-center">
                        <span className="h-[6px] w-[6px] rounded-full border border-[#2F2B28]" />
                      </span>
                      <span className="font-['Nunito'] font-light text-[14px] lg:text-[20px] leading-[22px] lg:leading-[32px] text-[#2F2B28]">
                        {highlight}
                      </span>
                    </RevealItem>
                  ))}
                </RevealStagger>
              </div>

              <button
                disabled={activeTab.buttonDisabled}
                onClick={() => navigate(activeTab.buttonLink)}
                className="inline-flex items-center justify-center font-['Nunito'] font-medium text-[14px] lg:text-[18px] text-[#3B372F] border-[0.8px] border-[#3B372F] rounded-[4px] px-[24px] h-[40px] w-fit hover:bg-[#3B372F]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {activeTab.buttonText}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
