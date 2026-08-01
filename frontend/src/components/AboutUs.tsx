import BackgroundImage from "../assets/Frame 46.png";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Reveal, RevealItem, RevealStagger } from "../motion";

export function AboutUs() {
  return (
    <section className="pt-16 lg:pt-20 page-px max-w-[2000px] mx-auto">
      <Reveal preset="scaleIn" early className="w-full mx-auto overflow-hidden rounded-2xl">
        <div
          className="w-full bg-[#0B6E66]"
          style={{
            backgroundImage: `url('${BackgroundImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "multiply",
          }}
        >
          <RevealStagger
            className="flex flex-col lg:flex-row items-center gap-8 lg:gap-[80px] xl:gap-[120px] px-[24px] lg:px-[60px] py-[40px] lg:py-[48px]"
            preset="default"
          >
            <RevealItem
              preset="fadeLeft"
              className="w-full lg:w-[38%] flex flex-col gap-[24px] shrink-0"
            >
              <h2 className="font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#F0C165]">
                About Us
              </h2>
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Nunito'] font-bold text-[16px] lg:text-[24px] leading-[28px] lg:leading-[32px] text-[#fafafa]">
                  Wildbook is a simple platform designed to help connect people with wildlife in the right way -
                </p>
                <p
                  className="text-[26px] lg:text-[32px] leading-tight lg:leading-[50px] text-[#E8E2DC]"
                  style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
                >
                  by bringing structure, credibility, and intent to wildlife tourism in India.
                </p>
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 font-['Nunito'] font-medium text-[16px] lg:text-[18px] text-[#F6F4F1] border border-[#E3DDD8] rounded-[4px] px-[24px] h-[40px] w-fit hover:bg-white/5 transition-colors"
              >
                Read our story
                <ArrowRightIcon size={20} />
              </Link>
            </RevealItem>

            <RevealItem
              preset="fadeRight"
              as="p"
              className="flex-1 min-w-0 font-['Nunito'] font-normal text-[16px] lg:text-[20px] leading-[26px] lg:leading-[28px] text-[#fafafa] text-justify"
            >
              We bring together a trusted network of guides, naturalists, and
              responsible wildlife tour operators. Through this network,
              travellers can discover expert-led nature tours, curated wildlife
              plans, and community based homestays that offer deeper, more
              authentic experiences in the wild.
              <br /><br />
              While we are still new and continuously striving to refine and
              improve what we do, our ambition remains clear — to contribute
              towards building a more structured and responsible wildlife tourism
              ecosystem in India, where people connect with nature in an informed,
              ethical, and meaningful way.
            </RevealItem>
          </RevealStagger>
        </div>
      </Reveal>
    </section>
  );
}
