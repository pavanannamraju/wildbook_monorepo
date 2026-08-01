import {
  ArrowLeftIcon,
  FootprintsIcon,
  PawPrintIcon,
  TreeEvergreenIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F4F1] font-['Nunito'] text-[#2F2B28] selection:bg-[#0B6E66] selection:text-white">
      <StickyTopNavbar variant="dark" />

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <div className="relative mb-10 flex items-end justify-center gap-3">
          <FootprintsIcon size={28} className="mb-1 rotate-[-12deg] text-[#9BCDB2]/60" />
          <FootprintsIcon size={22} className="mb-4 rotate-[-6deg] text-[#9BCDB2]/40" />
          <FootprintsIcon size={18} className="mb-7 text-[#9BCDB2]/25" />
          <span
            className="mx-4 text-[100px] font-black leading-none tracking-[-0.04em] text-[#0B6E66]/10 select-none md:text-[120px]"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            404
          </span>
          <FootprintsIcon size={18} className="mb-7 -scale-x-100 text-[#9BCDB2]/25" />
          <FootprintsIcon size={22} className="mb-4 -scale-x-100 rotate-[6deg] text-[#9BCDB2]/40" />
          <FootprintsIcon size={28} className="mb-1 -scale-x-100 rotate-[12deg] text-[#9BCDB2]/60" />
        </div>

        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#9BCDB2]/30">
          <PawPrintIcon size={32} weight="duotone" className="text-[#0B6E66]" />
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A9691]">
          Error 404 — Trail gone cold
        </p>
        <h1
          className="mb-4 text-[36px] font-extrabold tracking-[-0.03em] text-[#3B372F] md:text-[44px]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          Even our trackers lost the scent.
        </h1>
        <p className="mb-10 max-w-[440px] text-[15px] leading-relaxed text-[#73706C]">
        This page has wandered deep into the forest — possibly spooked by a tiger. Our best naturalists searched for three days, but the trail seems to have gone cold.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-[4px] bg-[#0B6E66] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#095B54] active:bg-[#074A46]"
        >
          <ArrowLeftIcon size={16} />
          Back to base camp
        </Link>

        <div className="mt-16 flex items-end justify-center gap-3 opacity-20">
          <TreeEvergreenIcon size={24} className="text-[#0B6E66]" />
          <TreeEvergreenIcon size={38} className="text-[#0B6E66]" />
          <TreeEvergreenIcon size={52} className="text-[#0B6E66]" />
          <TreeEvergreenIcon size={38} className="text-[#0B6E66]" />
          <TreeEvergreenIcon size={24} className="text-[#0B6E66]" />
        </div>
      </main>
    </div>
  );
}
