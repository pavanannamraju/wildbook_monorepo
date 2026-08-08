import type { ComponentType, ReactNode } from "react";

export const cardClassName =
  "rounded-xl border border-[#E3DDD8] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,.04)]";

export function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: ComponentType<{ size?: number | string; className?: string }>;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="text-[#0B6E66]">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-['Nunito'] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A9691]">
          {eyebrow}
        </p>
        <h2
          className="text-[16px] font-bold tracking-[-0.02em] text-[#3B372F] sm:text-[18px]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#D7D2CC] py-12 text-center font-['Nunito'] text-sm text-[#73706C]">
      {children}
    </div>
  );
}
