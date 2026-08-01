import ExpertConnectImage from "../assets/ExpertConnect.jpeg";
import { useNavigate } from "react-router-dom";

const comingSoonOfferings = [
  {
    title: "Shared Safaris",
    description:
      "Some sightings are better witnessed together. Join travellers heading to the same park on the same dates, share the cost of your safari, and experience the forest alongside people who share your curiosity. Whether you're travelling solo or with friends, it's an easier way to make wildlife journeys more accessible, social, and memorable.",
  },
  {
    title: "Homestays",
    description:
      "Stay with the people whose lives are deeply rooted in the landscapes around them. From expert-run homestays near the forest to welcoming local retreats, discover stays that offer an authentic, comfortable, and enriching way to experience the wild, where every stay is shaped by local knowledge and a deep connection to nature.",
  },
] as const;

function StatusTag({ variant, children }: { variant: "live" | "comingSoon"; children: string }) {
  return (
    <span
      className={
        variant === "live"
          ? "animate-live-pulse inline-flex items-center justify-center h-[40px] px-[16px] rounded-[4px] bg-[#ab863f]/80 backdrop-blur-[2px] font-['Nunito'] font-semibold text-[16px] lg:text-[16px] text-[#FAFAFA]"
          : "inline-flex items-center justify-center h-[40px] px-[16px] rounded-[4px] border border-dashed border-[#6B6B6B]/80 backdrop-blur-[2px] font-['Nunito'] font-semibold text-[16px] lg:text-[16px] text-[#6B6B6B]"
      }
    >
      {children}
    </span>
  );
}

export function WhatWeDo() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-16 lg:pt-20 pb-8 page-px max-w-[1920px] mx-auto">
      {/* Section header */}
      <div className="mb-[24px] lg:mb-[40px] flex flex-col gap-[8px]">
        <h2 className="font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">
          This is what was never visible before.
        </h2>
        <p
          className="text-[18px] lg:text-[22px] leading-[28px] lg:leading-[32px] text-[#2F2B28] max-w-[900px]"
          style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600 }}
        >
          Every wildlife journey starts somewhere. Ours starts by bringing it all together.
        </p>
      </div>

      {/* Offerings: Expert Connect (live) + Shared Safaris / Homestays (coming soon) */}
      <div className="flex flex-col lg:flex-row gap-[24px]">
        {/* Expert Connect */}
        <div className="lg:w-1/2 shrink-0 rounded-[16px] overflow-hidden bg-[#F3EEE9] flex flex-col">
          <div className="relative h-[220px] lg:h-[364px] shrink-0">
            <img
              src={ExpertConnectImage}
              alt="Guide walking with a traveller in the forest"
              className="absolute inset-0 h-full w-full object-cover object-bottom"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%), linear-gradient(180deg, rgba(0,0,0,0) 15%, rgba(0,0,0,0.4) 100%)",
              }}
            />
            <div className="absolute top-[16px] left-[16px] lg:top-[37px] lg:left-[48px]">
              <StatusTag variant="live">Live Now</StatusTag>
            </div>
            <p
              className="absolute bottom-[16px] left-[16px] right-[16px] lg:bottom-[24px] lg:left-[48px] lg:right-[48px] uppercase tracking-[0.4px] text-[22px] lg:text-[32px] leading-[1.2] text-[#E3DDD8]"
              style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 500 }}
            >
              Expert Connect
            </p>
          </div>

          <div className="flex flex-col gap-[16px] p-[24px] lg:p-[48px]">
            <h3 className="font-['Nunito'] font-bold text-[22px] lg:text-[28px] leading-snug lg:leading-[40px] text-[#0B6E66]">
              Begin your journey with the people who know the forest best.
            </h3>
            <p className="font-['Nunito'] text-[16px] lg:text-[20px] leading-[24px] lg:leading-[28px] text-[#2F2B28] text-justify">
              Naturalists and forest guides who've spent decades in the field - the birder who
              knows the exact tree a hornbill returns to every March, the herping guide who can
              spot a pit viper by torchlight thirty feet off the trail -{" "}
              <span className="font-bold">
                now discoverable by the specialty, park, and language that matter most to you.
              </span>
            </p>
            <button
              onClick={() => navigate("/experts")}
              className="inline-flex items-center justify-center font-['Nunito'] font-medium text-[14px] lg:text-[18px] text-[#3B372F] border-[0.8px] border-[#3B372F] rounded-[4px] px-[24px] h-[40px] w-fit hover:bg-[#3B372F]/5 transition-colors"
            >
              Find your Expert
            </button>
          </div>
        </div>

        {/* Shared Safaris + Homestays */}
        <div className="lg:w-1/2 flex flex-col gap-[24px]">
          {comingSoonOfferings.map((offering) => (
            <div
              key={offering.title}
              className="relative flex-1 rounded-[16px] bg-[#F3EEE9] p-[24px] lg:p-[48px] flex flex-col gap-[16px] justify-center"
            >
              <div className="absolute top-[16px] left-[16px] lg:top-[32px] lg:left-[48px]">
                <StatusTag variant="comingSoon">Coming Soon</StatusTag>
              </div>
              <h3 className="mt-[40px] lg:mt-[24px] font-['Nunito'] font-bold uppercase tracking-[0.32px] text-[22px] lg:text-[28x] leading-snug text-[#2F2B28]">
                {offering.title}
              </h3>
              <p className="font-['Nunito'] text-[16px] lg:text-[20px] leading-[24px] lg:leading-[28px] text-[#2F2B28] text-justify">
                {offering.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
