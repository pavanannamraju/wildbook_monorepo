import Anurag from "../assets/team_photos/Anurag.jpg";
import NishadBarde from "../assets/team_photos/Nishad.jpg";
import Pavan from "../assets/team_photos/Pavan.jpg";
import Sangeetha from "../assets/team_photos/Sangeetha.jpg";

const teamMembers = [
  {
    name: "Anurag Jha",
    role: "Naturalist",
    image: Anurag,
    offsetUp: true,
  },
  {
    name: "Nishad Barde",
    role: "Filmmaker",
    image: NishadBarde,
    offsetUp: false,
  },
  {
    name: "Sangeetha Venugopalan",
    role: "Design Consultant",
    image: Sangeetha,
    offsetUp: true,
  },
  {
    name: "Sai Pavan Annamaraju",
    role: "IT Consultant",
    image: Pavan,
    offsetUp: false,
  },
];

export function Team() {
  return (
    <section className="relative mx-auto max-w-[1920px] page-px pt-12 sm:pt-16 lg:pt-20">
      <header className="flex items-start justify-between overflow-visible">
        <div className="flex max-w-[767px] flex-col gap-3 sm:gap-4 lg:gap-6">
          <h2 className="font-['Nunito'] font-bold text-[16px] leading-snug text-[#AB863F] sm:text-[18px] sm:leading-8 md:text-[20px] lg:text-[24px]">
            People Behind the Mission
          </h2>
          <p className="font-['Nunito'] font-bold text-[15px] leading-snug text-[#2F2B28] sm:text-[16px] md:text-[18px] lg:text-[22px] lg:leading-7">
            We&apos;re a diverse team of naturalists, designers, filmmakers, engineers, and
            consultants, united by a genuine love for wildlife and the stories it inspires.
          </p>
        </div>
      </header>

      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:gap-5 lg:mt-8 lg:grid-cols-4 lg:gap-5 xl:mt-[27px] xl:gap-6">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className={`flex w-full items-center ${
              member.offsetUp ? "xl:pt-16 xl:pb-0" : "xl:pt-0 xl:pb-16"
            }`}
          >
            <div className="relative flex aspect-[3/4] w-full max-h-[220px] min-h-0 flex-col items-start justify-end overflow-hidden rounded-xl p-2.5 sm:max-h-[280px] sm:rounded-2xl sm:p-4 md:max-h-[320px] md:p-5 lg:max-h-none lg:aspect-[384/472] lg:p-6 xl:p-8">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
                  <img
                    alt={member.name}
                    src={member.image}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent from-[43%] to-black/80 sm:rounded-2xl" />
              </div>

              <div className="relative z-10 flex w-full flex-col items-start justify-end rounded-[4px] border border-[rgba(220,220,220,0.4)] bg-[rgba(66,66,66,0.1)] px-2 py-1.5 backdrop-blur-[5px] sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4">
                <div className="flex w-full flex-col items-start gap-0.5 sm:gap-1.5 md:gap-2">
                  <h3 className="font-['Nunito'] text-[12px] leading-tight font-bold tracking-[0] text-[#EDE7E2] sm:text-[15px] sm:leading-snug md:text-[17px] lg:text-[18px] xl:text-[24px] xl:leading-[30px]">
                    {member.name}
                  </h3>
                  <p className="font-['Nunito'] text-[9px] font-normal tracking-wider text-[#EDE7E2] uppercase opacity-90 sm:text-[11px] md:text-[12px]">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
