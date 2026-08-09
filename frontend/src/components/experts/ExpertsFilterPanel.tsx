import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

import {
  fetchExpertFilterOptions,
  type ExpertFilterOption,
  type ExpertFilterOptions,
} from "../../api/experts";

export type ExpertsPanelFilters = {
  primaryLocationId: string | null;
  languageIds: string[];
  expertiseIds: string[];
  minRating: number | null;
};

type ExpertsFilterPanelProps = {
  open: boolean;
  value: ExpertsPanelFilters;
  onClose: () => void;
  onApply: (next: ExpertsPanelFilters) => void;
};

const EMPTY_OPTIONS: ExpertFilterOptions = {
  locations: [],
  languages: [],
  expertise: [],
};

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function PillToggle({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-3 py-1.5 font-['Nunito'] text-xs font-semibold transition-all duration-150"
      style={{
        borderRadius: "4px",
        ...(selected
          ? { backgroundColor: "#0B6E66", color: "white" }
          : {
              backgroundColor: "white",
              color: "#3B372F",
              border: "1px solid rgba(0,0,0,0.15)",
            }),
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="mb-3.5 font-['Montserrat'] text-[10px] font-bold tracking-[0.16em] uppercase"
      style={{ color: "#1B3D2C" }}
    >
      {children}
    </p>
  );
}

function PillGroup({
  options,
  selected,
  onChange,
}: {
  options: ExpertFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) {
    return <p className="font-['Nunito'] text-xs text-[#73706C]">No options available</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <PillToggle
          key={option.id}
          label={option.name}
          selected={selected.includes(option.id)}
          onToggle={() => onChange(toggleId(selected, option.id))}
        />
      ))}
    </div>
  );
}

export function ExpertsFilterPanel({ open, value, onClose, onApply }: ExpertsFilterPanelProps) {
  const [draft, setDraft] = useState<ExpertsPanelFilters>(value);
  const [options, setOptions] = useState<ExpertFilterOptions>(EMPTY_OPTIONS);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setLocationSearch("");
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setIsLoadingOptions(true);
    setOptionsError(null);

    fetchExpertFilterOptions(controller.signal)
      .then((payload) => {
        setOptions(payload);
        setIsLoadingOptions(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setOptionsError(err instanceof Error ? err.message : "Failed to load filters.");
        setIsLoadingOptions(false);
      });

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const activeCount =
    (draft.primaryLocationId ? 1 : 0) +
    draft.languageIds.length +
    draft.expertiseIds.length;

  const filteredLocations = options.locations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase()),
  );

  const clearDraft = (): ExpertsPanelFilters => ({
    primaryLocationId: null,
    languageIds: [],
    expertiseIds: [],
    minRating: null,
  });

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="experts-filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-1200"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="experts-filter-panel"
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={
              isMobile
                ? "fixed right-0 bottom-0 left-0 z-1200 flex max-h-[82vh] flex-col overflow-hidden rounded-t-2xl"
                : "fixed top-0 right-0 z-1200 flex h-full flex-col overflow-hidden"
            }
            style={
              isMobile
                ? {
                    backgroundColor: "#F6F4F1",
                    boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                  }
                : {
                    width: "min(400px, 92vw)",
                    backgroundColor: "#F6F4F1",
                    boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
                  }
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="experts-filter-title"
          >
            <div
              className="flex items-center justify-between border-b px-6 py-5"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            >
              <div>
                <h2
                  id="experts-filter-title"
                  className="font-['Montserrat'] text-lg font-bold"
                  style={{ color: "#1B3D2C" }}
                >
                  Filters
                </h2>
                {activeCount > 0 ? (
                  <p className="mt-0.5 font-['Nunito'] text-xs" style={{ color: "#7A8C82" }}>
                    {activeCount} active
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/8"
                style={{ color: "#7A8C82" }}
                aria-label="Close filters"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-6 py-6">
              {optionsError ? (
                <div className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 font-['Nunito'] text-sm text-red-700">
                  {optionsError}
                </div>
              ) : null}

              <div>
                <SectionLabel>Skills</SectionLabel>
                {isLoadingOptions ? (
                  <p className="font-['Nunito'] text-xs text-[#73706C]">Loading…</p>
                ) : (
                  <PillGroup
                    options={options.expertise}
                    selected={draft.expertiseIds}
                    onChange={(expertiseIds) => setDraft((prev) => ({ ...prev, expertiseIds }))}
                  />
                )}
              </div>

              <div>
                <p
                  className="mb-3 font-['Montserrat'] text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: "#1B3D2C" }}
                >
                  Location
                </p>
                <div className="relative mb-2">
                  <MagnifyingGlassIcon
                    size={12}
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
                    style={{ color: "#9AA59D" }}
                  />
                  <input
                    type="text"
                    placeholder="Search locations…"
                    value={locationSearch}
                    onChange={(event) => setLocationSearch(event.target.value)}
                    disabled={isLoadingOptions}
                    className="w-full border py-2 pr-3 pl-7 font-['Nunito'] text-xs outline-none"
                    style={{
                      borderRadius: "4px",
                      borderColor: "rgba(0,0,0,0.12)",
                      backgroundColor: "white",
                      color: "#3B372F",
                    }}
                  />
                </div>
                <div className="flex max-h-[200px] flex-col overflow-y-auto">
                  {isLoadingOptions ? (
                    <p className="px-1 py-2 font-['Nunito'] text-xs text-[#73706C]">Loading…</p>
                  ) : filteredLocations.length === 0 ? (
                    <p className="px-1 py-2 font-['Nunito'] text-xs text-[#73706C]">
                      No locations found
                    </p>
                  ) : (
                    filteredLocations.map((loc) => {
                      const checked = draft.primaryLocationId === loc.id;
                      return (
                        <label
                          key={loc.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded px-1 py-2 select-none transition-colors"
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = "rgba(11,110,102,0.04)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <span
                            className="flex shrink-0 items-center justify-center transition-all"
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "3px",
                              border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                              backgroundColor: checked ? "#0B6E66" : "white",
                            }}
                            aria-hidden
                          >
                            {checked ? (
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                <path
                                  d="M1 3.5L3.5 6L8 1"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() =>
                              setDraft((prev) => ({
                                ...prev,
                                // API supports one location; toggle acts as single-select.
                                primaryLocationId: checked ? null : loc.id,
                              }))
                            }
                          />
                          <span
                            className="font-['Nunito'] text-xs"
                            style={{
                              color: checked ? "#0B6E66" : "#3B372F",
                              fontWeight: checked ? 600 : 400,
                            }}
                          >
                            {loc.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <SectionLabel>Language</SectionLabel>
                {isLoadingOptions ? (
                  <p className="font-['Nunito'] text-xs text-[#73706C]">Loading…</p>
                ) : (
                  <PillGroup
                    options={options.languages}
                    selected={draft.languageIds}
                    onChange={(languageIds) => setDraft((prev) => ({ ...prev, languageIds }))}
                  />
                )}
              </div>
            </div>

            <div
              className="flex gap-3 border-t px-6 py-5"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            >
              <button
                type="button"
                onClick={() => {
                  const cleared = clearDraft();
                  setDraft(cleared);
                  onApply(cleared);
                  onClose();
                }}
                className="h-10 flex-1 font-['Nunito'] text-sm font-semibold transition-colors"
                style={{
                  borderRadius: "4px",
                  border: "1px solid rgba(0,0,0,0.18)",
                  color: "#3B372F",
                  backgroundColor: "white",
                }}
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  onClose();
                }}
                className="h-10 flex-1 font-['Nunito'] text-sm font-semibold text-white transition-colors"
                style={{ borderRadius: "4px", backgroundColor: "#0B6E66" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "#095B54";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "#0B6E66";
                }}
              >
                Apply Filters
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
