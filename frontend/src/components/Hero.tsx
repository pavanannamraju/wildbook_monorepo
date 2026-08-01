import { forwardRef } from "react";
import bannerImage from "../assets/Banner Image_V2.png";
import { HeroReveal, HeroStagger, RevealItem } from "../motion";
import Navbar from "./Navbar";

const HEADING_FONT_STYLE: React.CSSProperties = {
  fontFamily: '"Montserrat", sans-serif',
  fontWeight: 500,
  fontSize: "70px",
  fontStyle: "normal"
};

export const Hero = forwardRef<HTMLElement>(function Hero(_, ref) {
  return (
    <section ref={ref} className="relative mx-auto max-w-[1920px] overflow-hidden">
      <HeroReveal preset="image" className="block w-full">
        <img
          src={bannerImage}
          alt=""
          className="block h-auto w-full select-none"
        />
      </HeroReveal>

      <div className="absolute inset-0">
        <div className="mx-auto max-w-[1920px]">
          <Navbar variant="light" />
        </div>
        <div className="page-px py-8">
          <div className="pt-20 font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">Bringing India’s wildlife ecosystem together</div>
          <HeroStagger
            as="h1"
            className="mb-12 flex flex-col gap-4 pt-4 leading-[0.95] text-[#EDE8E2]/90 md:text-7xl"
          >
            {["connect", "conserve", "coexist"].map((word) => (
              <RevealItem
                as="span"
                key={word}
                preset="fadeUp"
                style={{
                  ...HEADING_FONT_STYLE,
                  textShadow: "0px 0px 8px black, 0px 1px 1px #264e4566"
                }}
                className="drop-shadow-lg"
              >
                {word}
              </RevealItem>
            ))}
          </HeroStagger>

          <HeroReveal delay={0.45} preset="fadeUp">
            <p className="mb-32 max-w-[600px] font-[Nunito] text-[28px] text-[#7FCDB2] leading-tight font-medium">
            India has thousands of naturalists and guides, who know the wild better than any guidebook. You've just never been able to find them — <span className="font-bold">UNTIL NOW</span>
            </p>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
});
