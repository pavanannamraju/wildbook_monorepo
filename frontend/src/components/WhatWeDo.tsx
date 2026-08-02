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
          ? "animate-live-pulse inline-flex h-9 items-center justify-center rounded-[4px] bg-[#ab863f]/80 px-3.5 font-['Nunito'] text-[14px] font-semibold text-[#FAFAFA] backdrop-blur-[2px] sm:h-10 sm:px-4 sm:text-[16px]"
          : "inline-flex h-9 items-center justify-center rounded-[4px] border border-dashed border-[#6B6B6B]/80 px-3.5 font-['Nunito'] text-[14px] font-semibold text-[#6B6B6B] backdrop-blur-[2px] sm:h-10 sm:px-4 sm:text-[16px]"
      }
    >
      {children}
    </span>
  );
}

export function WhatWeDo() {
  const navigate = useNavigate();

  return (
    <section className="relative mx-auto max-w-[1920px] page-px pt-12 pb-6 sm:pt-16 sm:pb-8 lg:pt-20">
      <div className="mb-5 flex flex-col gap-1.5 sm:mb-6 sm:gap-2 lg:mb-10">
        <h2 className="font-['Nunito'] font-bold text-[16px] leading-snug text-[#AB863F] sm:text-[18px] sm:leading-8 md:text-[20px] lg:text-[24px]">
          This is what was never visible before.
        </h2>
        <p
          className="max-w-[900px] text-[16px] leading-snug text-[#2F2B28] sm:text-[18px] sm:leading-7 md:text-[20px] lg:text-[22px] lg:leading-8"
          style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600 }}
        >
          Every wildlife journey starts somewhere. Ours starts by bringing it all together.
        </p>
      </div>

      <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:gap-6">
        {/* Expert Connect */}
        <div className="flex shrink-0 flex-col overflow-hidden rounded-xl bg-[#F3EEE9] sm:rounded-2xl lg:w-1/2">
          <div className="relative h-[200px] shrink-0 sm:h-[260px] md:h-[300px] lg:h-[364px]">
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
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 lg:top-[37px] lg:left-12">
              <StatusTag variant="live">Live Now</StatusTag>
            </div>
            <p
              className="absolute right-3 bottom-3 left-3 text-[20px] leading-[1.2] tracking-[0.4px] text-[#E3DDD8] uppercase sm:right-4 sm:bottom-4 sm:left-4 sm:text-[22px] md:text-[26px] lg:right-12 lg:bottom-6 lg:left-12 lg:text-[32px]"
              style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 500 }}
            >
              Expert Connect
            </p>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:gap-4 sm:p-6 md:p-8 lg:gap-4 lg:p-12">
            <h3 className="font-['Nunito'] font-bold text-[18px] leading-snug text-[#0B6E66] sm:text-[22px] md:text-[24px] lg:text-[28px] lg:leading-10">
              Begin your journey with the people who know the forest best.
            </h3>
            <p className="text-justify font-['Nunito'] text-[15px] leading-6 text-[#2F2B28] sm:text-[16px] md:text-[18px] md:leading-7 lg:text-[20px]">
              Naturalists and forest guides who&apos;ve spent decades in the field - the birder who
              knows the exact tree a hornbill returns to every March, the herping guide who can
              spot a pit viper by torchlight thirty feet off the trail -{" "}
              <span className="font-bold">
                now discoverable by the specialty, park, and language that matter most to you.
              </span>
            </p>
            <button
              type="button"
              onClick={() => navigate("/experts")}
              className="inline-flex h-10 w-fit items-center justify-center rounded-[4px] border-[0.8px] border-[#3B372F] px-5 font-['Nunito'] text-[14px] font-medium text-[#3B372F] transition-colors hover:bg-[#3B372F]/5 sm:px-6 lg:text-[18px]"
            >
              Find your Expert
            </button>
          </div>
        </div>

        {/* Shared Safaris + Homestays */}
        <div className="flex flex-col gap-5 sm:gap-6 lg:w-1/2">
          {comingSoonOfferings.map((offering) => (
            <div
              key={offering.title}
              className="relative flex flex-1 flex-col justify-center gap-3 rounded-xl bg-[#F3EEE9] p-5 sm:gap-4 sm:rounded-2xl sm:p-6 md:p-8 lg:p-12"
            >
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 lg:top-8 lg:left-12">
                <StatusTag variant="comingSoon">Coming Soon</StatusTag>
              </div>
              <h3 className="mt-9 font-['Nunito'] text-[18px] leading-snug font-bold tracking-[0.32px] text-[#2F2B28] uppercase sm:mt-10 sm:text-[22px] md:text-[24px] lg:mt-6 lg:text-[28px]">
                {offering.title}
              </h3>
              <p className="text-justify font-['Nunito'] text-[15px] leading-6 text-[#2F2B28] sm:text-[16px] md:text-[18px] md:leading-7 lg:text-[20px]">
                {offering.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
