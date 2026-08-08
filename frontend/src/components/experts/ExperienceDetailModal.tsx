import {
  ClockIcon,
  CurrencyInrIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import type { ExperienceDetail } from "../../api/experts";
import { durationLabel } from "./labels";

function groupSizeLabel(experience: ExperienceDetail): string | null {
  const gs = experience.group_size;
  if (!gs) return null;
  if (gs.min != null && gs.max != null) return `${gs.min} – ${gs.max} people`;
  if (gs.max != null) return `Up to ${gs.max} people`;
  if (gs.min != null) return `From ${gs.min} people`;
  return null;
}

function priceLabel(experience: ExperienceDetail): string | null {
  if (!experience.pricing) return null;
  return `₹${experience.pricing.amount} / ${experience.pricing.per ?? "person"}`;
}

type Props = {
  isOpen: boolean;
  experience: ExperienceDetail | null;
  guideId: string;
  guideFirstName: string;
  onClose: () => void;
};

export function ExperienceDetailModal({ isOpen, experience, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"details" | "bring">("details");

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setActiveTab("details");
  }, [isOpen, experience?.id]);

  if (!isOpen || !experience) return null;

  const duration = durationLabel(experience);
  const groupSize = groupSizeLabel(experience);
  const price = priceLabel(experience);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[20px] bg-[#FBF9F6]">
        <div className="relative h-[140px] shrink-0 bg-[#2F2B28]">
          {experience.image_url && (
            <img
              src={experience.image_url}
              alt={experience.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <p
            className="absolute bottom-[16px] left-[24px] right-[72px] text-[18px] leading-[1.25] text-white sm:text-[20px] md:text-[24px] md:leading-[30px]"
            style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
          >
            {experience.title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-[16px] top-[16px] flex size-[40px] items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-[20px] px-[32px] pt-[24px]">
          {experience.description && (
            <p className="font-['Nunito'] font-normal text-[15px] sm:text-[16px] md:text-[18px] leading-[28px] text-[#2F2B28]">
              {experience.description}
            </p>
          )}

          {(duration ?? groupSize ?? price) && (
            <div className="flex flex-wrap gap-[12px]">
              {duration && (
                <div className="flex items-center gap-[8px] rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                  <ClockIcon size={20} className="text-[#2F2B28]" />
                  <span className="font-['Nunito'] font-medium text-[16px] text-[#2F2B28]">{duration}</span>
                </div>
              )}
              {groupSize && (
                <div className="flex items-center gap-[8px] rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                  <UsersThreeIcon size={20} className="text-[#2F2B28]" />
                  <span className="font-['Nunito'] font-medium text-[16px] text-[#2F2B28]">{groupSize}</span>
                </div>
              )}
              {price && (
                <div className="flex items-center gap-[8px] rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                  <CurrencyInrIcon size={20} className="text-[#2F2B28]" />
                  <span className="font-['Nunito'] font-medium text-[16px] text-[#2F2B28]">{price}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex border-b border-black/10">
            {(["details", "bring"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  "px-[16px] py-[12px] font-['Nunito'] text-[16px] transition-colors",
                  activeTab === tab
                    ? "border-b-2 border-[#0B6E66] font-semibold text-[#0B6E66]"
                    : "font-normal text-[#73706C] hover:text-[#2F2B28]",
                ].join(" ")}
              >
                {tab === "details" ? "Details" : "What to Bring"}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[32px] pb-[32px] pt-[16px]">
          {activeTab === "details" && (
            <p className="font-['Nunito'] text-[16px] text-[#73706C]">
              Availability calendar is not part of Wildbook v1. Use Send inquiry on the expert
              page to request dates.
            </p>
          )}
          {activeTab === "bring" && (
            <p className="font-['Nunito'] font-normal text-[16px] text-[#73706C]">
              Details coming soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
