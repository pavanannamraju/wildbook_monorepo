import ResponsibleTourismImage from "../assets/ceylon-spotted-deer 1.jpg";

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
    <section className="relative mx-auto max-w-[1920px] page-px pt-12 sm:pt-16 lg:pt-20">
      <div className="relative mb-6 flex items-start justify-end overflow-visible sm:mb-8 lg:mb-10">
        <div className="relative z-10 flex flex-col items-end text-right">
          <h2 className="font-['Nunito'] font-bold text-[16px] leading-snug text-[#AB863F] sm:text-[18px] sm:leading-8 md:text-[20px] lg:text-[24px]">
            Our Take on Responsible Tourism
          </h2>
          <p className="mt-1 font-['Nunito'] font-bold text-[18px] leading-snug text-[#2F2B28] sm:text-[20px] md:text-[24px] lg:text-[28px] lg:leading-10">
            The wild doesn&apos;t belong to us. We belong to it.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 md:gap-6 lg:flex-row">
        <div className="grid w-full grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 md:gap-6 lg:w-[62%]">
          {principles.map((item) => (
            <div
              key={item.number}
              className="flex flex-col gap-3 rounded-2xl bg-[#F3EEE9] p-5 sm:gap-4 sm:rounded-[20px] sm:p-6 md:p-7 lg:p-6"
            >
              <span className="font-['Nunito'] text-[32px] leading-none font-light tracking-[-0.48px] text-[#0B6E66] uppercase sm:text-[36px] md:text-[40px] md:leading-10">
                {item.number}
              </span>
              <div className="flex flex-col gap-2 text-[#73706C] sm:gap-2.5">
                <h3 className="font-['Nunito'] text-[16px] leading-snug font-extrabold tracking-[-0.28px] uppercase sm:text-[18px] md:text-[20px] lg:text-[24px] lg:leading-10">
                  {item.title}
                </h3>
                <p className="font-['Nunito'] text-[13px] leading-5 font-bold sm:text-[14px] sm:leading-[22px] md:text-[16px] md:leading-6 lg:text-[20px] lg:leading-7">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex w-full items-stretch lg:w-[38%]">
          <div className="min-h-[220px] flex-1 overflow-hidden rounded-2xl sm:min-h-[280px] sm:rounded-[20px] md:min-h-[360px] lg:min-h-0">
            <img
              src={ResponsibleTourismImage}
              alt="Spotted deer in forest"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
