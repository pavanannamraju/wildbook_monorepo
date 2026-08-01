import ResponsibleTourismImage from "../assets/ceylon-spotted-deer 1.png";
import { Reveal, RevealItem, RevealStagger } from "../motion";

const principles = [
  {
    number: "1.",
    title: "Beyond Iconic Species",
    description:
      "We encourage travellers to appreciate entire ecosystems - from birds and insects to plants and natural history - not just a single species.",
  },
  {
    number: "2.",
    title: "Respect for Nature",
    description:
      "Responsible travel means minimising disturbance to wildlife and habitats while promoting ethical practices in the field.",
  },
  {
    number: "3.",
    title: "Expert-Led Exploration",
    description:
      "Meaningful wildlife experiences are shaped by guides and naturalists who understand the wild, making your journey more about knowledge than recreation.",
  },
  {
    number: "4.",
    title: "Support Local Communities",
    description:
      "We partner with operators and homestays that support conservation while creating sustainable livelihoods for local communities.",
  },
];

export function ResponsibleTourism() {
  return (
    <section className="relative pt-16 lg:pt-20 page-px max-w-[1920px] mx-auto">
      <Reveal
        preset="fadeLeft"
        className="mb-8 lg:mb-10 relative flex items-start justify-end overflow-visible"
      >
        <div className="flex flex-col items-end text-right relative z-10">
          <h2 className="font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">
            Our Take on Responsible Tourism
          </h2>
          <p className="font-['Nunito'] font-bold text-[20px] lg:text-[28px] leading-snug lg:leading-[40px] text-[#2F2B28] mt-1">
            The wild doesn&apos;t belong to us. We belong to it.
          </p>
        </div>
      </Reveal>

      <div className="flex flex-col lg:flex-row gap-[24px]">
        <RevealStagger
          preset="default"
          className="w-full lg:w-[62%] grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[20px]"
        >
          {principles.map((item) => (
            <RevealItem
              key={item.number}
              preset="fadeUpSoft"
              className="bg-[#F3EEE9] rounded-[20px] p-[24px] flex flex-col gap-[16px]"
            >
              <span className="font-['Nunito'] font-light text-[40px] lg:text-[40px] leading-[40px] text-[#0B6E66] tracking-[-0.48px] uppercase">
                {item.number}
              </span>
              <div className="flex flex-col gap-[10px] text-[#73706C]">
                <h3 className="font-['Nunito'] font-extrabold text-[18px] lg:text-[24px] leading-snug lg:leading-[40px] tracking-[-0.28px] uppercase">
                  {item.title}
                </h3>
                <p className="font-['Nunito'] font-bold text-[14px] lg:text-[20px] leading-[22px] lg:leading-[28px]">
                  {item.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal
          preset="image"
          delay={0.15}
          early
          className="w-full lg:w-[38%] flex items-stretch"
        >
          <div className="flex-1 rounded-[20px] overflow-hidden min-h-[300px]">
            <img
              src={ResponsibleTourismImage}
              alt="Spotted deer in forest"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <span
        aria-hidden="true"
        className="absolute left-24 top-80 z-[1] hidden lg:block pointer-events-none select-none leading-none"
        style={{
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 400,
          fontSize: "100px",
          color: "#f6f4f0",
          opacity: 0.7,
          mixBlendMode: "multiply",
        }}
      >
        CONSERVE
      </span>
    </section>
  );
}
