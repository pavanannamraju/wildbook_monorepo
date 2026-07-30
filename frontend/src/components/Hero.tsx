import { forwardRef } from "react";
import bannerImage from "../assets/Home_Page_Banner.png";
import Navbar from "./Navbar";

const HEADING_FONT_STYLE: React.CSSProperties = {
  fontFamily: '"Cocogoose Pro"',
  fontWeight: 300,
  fontSize: "70px",
  fontStyle: "normal"
};

export const Hero = forwardRef<HTMLElement>(function Hero(_, ref) {
  return (
    <section ref={ref} className="relative mx-auto max-w-[1920px]">
      <img
        src={bannerImage}
        alt=""
        className="block h-auto w-full select-none"
      />

      <div className="absolute inset-0">
        <div className="mx-auto max-w-[1920px]">
          <Navbar variant="light" />
        </div>
        <div className="page-px py-8">
          <h1 className="mb-12 flex flex-col gap-4 pt-20 leading-[0.95] text-[#EDE8E2]/90 md:text-7xl">
          {
            ["connect", "conserve", "coexist"].map((word, index) => (
              <span
                key={index}
                style={{
                  ...HEADING_FONT_STYLE,
                  textShadow: "0px 0px 8px black, 0px 1px 1px #264e4566"
                }}
                className="drop-shadow-lg"
              >
                {word}
              </span>
            ))
          }
          </h1>

          <p className="mb-32 max-w-[350px] font-[Nunito] text-[28px] text-[#7FCDB2] leading-tight font-bold">
            Introducing India&apos;s first integrated digital wildlife platform.
          </p>
        </div>
      </div>
    </section>
  );
});
