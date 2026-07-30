import Anurag from "../assets/team_photos/Anurag.png";
import NishadBarde from "../assets/team_photos/Nishad.png";
import Pavan from "../assets/team_photos/Pavan.png";
import Sangeetha from "../assets/team_photos/Sangeetha.png";

const teamMembers = [
  {
    name: "Anurag Jha",
    role: "Chief Pathfinder",
    image: Anurag,
    offsetUp: true,
  },
  {
    name: "Nishad Barde",
    role: "Operations Commander",
    image: NishadBarde,
    offsetUp: false,
  },
  {
    name: "Sangeetha Venugopalan",
    role: "Keeper of Experiences",
    image: Sangeetha,
    offsetUp: true,
  },
  {
    name: "Sai Pavan Annamaraju",
    role: "Chief Systems Ranger",
    image: Pavan,
    offsetUp: false,
  },
];

export function Team() {
  return (
    <section className="relative pt-16 lg:pt-20 page-px max-w-[1920px] mx-auto">
      {/* Section header row — heading left, COEXIST watermark right */}
      <header className="flex items-start justify-between overflow-visible">
        <div className="flex flex-col gap-[24px] max-w-[767px]">
          <h2 className="font-['Nunito'] font-bold text-[18px] lg:text-[24px] leading-[32px] text-[#AB863F]">
            People Behind the Mission
          </h2>
          <p className="font-['Nunito'] font-bold text-[16px] lg:text-[22px] leading-snug lg:leading-[28px] text-[#2F2B28]">
            We&apos;re a diverse team of naturalists, designers, filmmakers,
            engineers, and consultants, united by a genuine love for wildlife and
            the stories it inspires.
          </p>
        </div>
        
      </header>

      {/* Team Grid — top-[135px] in Figma, header is 108px → gap = 27px */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[24px] mt-8 xl:mt-[27px]">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className={`flex w-full items-center ${
              member.offsetUp
                ? "xl:pt-[64px] xl:pb-0"
                : "xl:pt-0 xl:pb-[64px]"
            }`}
          >
            <div
              className="flex flex-col w-full min-h-0 items-start justify-end p-[32px] rounded-[16px] relative overflow-hidden"
              style={{ aspectRatio: "384/472" }}
            >
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 overflow-hidden rounded-[16px]">
                  <img
                    alt={member.name}
                    src={member.image}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[43%] to-black/80 rounded-[16px]" />
              </div>

              <div className="px-[24px] py-[16px] w-full bg-[rgba(66,66,66,0.1)] rounded-[4px] backdrop-blur-[5px] flex flex-col items-start justify-end relative z-10 border border-[rgba(220,220,220,0.4)]">
                <div className="flex flex-col items-start gap-[8px] w-full">
                  <h3 className="font-['Nunito'] font-bold text-[#EDE7E2] text-[20px] lg:text-[24px] leading-[30px] tracking-[0]">
                    {member.name}
                  </h3>
                  <p className="font-['Nunito'] font-normal text-[#EDE7E2] text-[14px] lg:text-[12px] uppercase tracking-wider opacity-90">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <span
        aria-hidden="true"
        className="absolute right-0 top-[64px] lg:top-[80px] z-[1] hidden lg:block pointer-events-none select-none leading-none"
        style={{
          fontFamily: '"Cocogoose Pro"',
          fontWeight: 400,
          fontSize: "clamp(80px, 7vw, 120px)",
          color: "#f6f4f0",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
      >
        COEXIST
      </span>
    </section>
  );
}
