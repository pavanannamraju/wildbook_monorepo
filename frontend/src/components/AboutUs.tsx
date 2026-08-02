import BackgroundImage from "../assets/Frame 46.jpg";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function AboutUs() {
  return (
    <section className="mx-auto max-w-[1920px] page-px pt-12 sm:pt-16 lg:pt-20">
      <div className="mx-auto w-full overflow-hidden rounded-xl sm:rounded-2xl">
        <div
          className="w-full bg-[#0B6E66]"
          style={{
            backgroundImage: `url('${BackgroundImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "multiply",
          }}
        >
          <div className="flex flex-col items-stretch gap-6 px-5 py-8 sm:gap-8 sm:px-8 sm:py-10 md:flex-row md:items-center md:gap-10 md:px-10 md:py-11 lg:gap-20 lg:px-[60px] lg:py-12 xl:gap-[120px]">
            <div className="flex w-full shrink-0 flex-col gap-4 sm:gap-5 md:w-[42%] md:gap-6 lg:w-[38%]">
              <h2 className="font-['Nunito'] font-bold text-[16px] leading-snug text-[#F0C165] sm:text-[18px] sm:leading-8 md:text-[20px] lg:text-[24px]">
                About Us
              </h2>
              <div className="flex flex-col gap-2">
                <p className="font-['Nunito'] text-[15px] leading-6 font-bold text-[#fafafa] sm:text-[16px] sm:leading-7 md:text-[18px] lg:text-[24px] lg:leading-8">
                  Wildbook is a simple platform designed to help connect people with wildlife in
                  the right way -
                </p>
                <p
                  className="text-[22px] leading-tight text-[#E8E2DC] sm:text-[26px] md:text-[30px] lg:text-[38px] lg:leading-[50px]"
                  style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 400 }}
                >
                  by bringing structure, credibility, and intent to wildlife tourism in India.
                </p>
              </div>
              <Link
                to="/about"
                className="inline-flex h-10 w-fit items-center gap-2 rounded-[4px] border border-[#E3DDD8] px-5 font-['Nunito'] text-[15px] font-medium text-[#F6F4F1] transition-colors hover:bg-white/5 sm:px-6 sm:text-[16px] lg:text-[18px]"
              >
                Read our story
                <ArrowRightIcon size={20} />
              </Link>
            </div>

            <p className="min-w-0 flex-1 text-justify font-['Nunito'] text-[15px] leading-6 font-normal text-[#fafafa] sm:text-[16px] sm:leading-7 md:text-[17px] lg:text-[20px] lg:leading-7">
              We bring together a trusted network of guides, naturalists, and wildlife experts.
              Through this network, wildlife enthusiasts can discover expert-led nature tours,
              curated wildlife plans, and community based homestays that offer deeper, more
              authentic experiences in the wild.
              <br />
              <br />
              While we are still new and continuously striving to refine and improve what we do,
              our ambition remains clear — to contribute towards building a more structured and
              responsible wildlife tourism ecosystem in India, where people connect with nature in
              an informed, ethical, and meaningful way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
