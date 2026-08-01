import { forwardRef } from "react";
import bannerImage from "../assets/Banner Image_V2.png";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@phosphor-icons/react";

const HEADING_FONT_STYLE: React.CSSProperties = {
  fontFamily: '"Montserrat", sans-serif',
  fontWeight: 500,
  fontSize: "70px",
  fontStyle: "normal"
};

export const Hero = forwardRef<HTMLElement>(function Hero(_, ref) {
  const navigate = useNavigate();
  return (
    <section ref={ref} className="relative mx-auto max-w-[1920px] overflow-hidden">
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
          <div className="pt-24 font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">Bringing India’s wildlife ecosystem together</div>
          <h1
            className="mb-8 flex flex-col gap-4 pt-4 leading-[0.95] text-[#EDE8E2]/90 md:text-7xl"
          >
            {["connect", "conserve", "coexist"].map((word) => (
              <span
                key={word}
                style={{
                  ...HEADING_FONT_STYLE,
                  textShadow: "0px 0px 8px black, 0px 1px 1px #264e4566"
                }}
                className="drop-shadow-lg"
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="mb-6 max-w-[600px] font-[Nunito] text-[28px] text-[#7FCDB2] leading-tight font-[100]">
          India is home to exceptional naturalists and guides, who know the wild better than any guidebook. You've just never been able to find them. Wildbook brings them within your reach!
          </p>
          <button
     
                
                onClick={() => navigate('/experts')}
                className="inline-flex items-center
                justify-center font-['Nunito']
                font-medium text-[14px]
                lg:text-[18px] text-[#F6F4F1] border-[0.8px]
                border-[#E3DDD8] rounded-[4px]
                px-[24px] py-[24px] 
                h-[40px]
                w-fit hover:bg-[#F6F4F1]/5
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Meet the Experts
                <ArrowRightIcon className="w-6 h-6 ml-4" />
              </button>
        </div>
      </div>
    </section>
  );
});
