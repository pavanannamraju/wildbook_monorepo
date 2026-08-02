import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@phosphor-icons/react";

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

function CheckboxList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: ExpertFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-['Nunito'] font-bold text-[15px] text-[#2F2B28]">{label}</legend>
      <div className="mt-3 space-y-2">
        {options.length === 0 ? (
          <p className="font-['Nunito'] text-[14px] text-[#73706C]">No options available</p>
        ) : (
          options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-3 font-['Nunito'] text-[14px] text-[#2F2B28]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(toggleId(selected, option.id))}
                  className="mt-1 size-4 accent-[#0B6E66]"
                />
                <span>{option.name}</span>
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

export function ExpertsFilterPanel({ open, value, onClose, onApply }: ExpertsFilterPanelProps) {
  const [draft, setDraft] = useState<ExpertsPanelFilters>(value);
  const [options, setOptions] = useState<ExpertFilterOptions>(EMPTY_OPTIONS);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
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

  if (!open) return null;

  const activeCount =
    (draft.primaryLocationId ? 1 : 0) +
    draft.languageIds.length +
    draft.expertiseIds.length;

  return createPortal(
    <div className="fixed inset-0 z-1200 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close filters"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-[420px] flex-col bg-[#F6F4F0] shadow-[-8px_0_32px_rgba(47,43,40,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="experts-filter-title"
      >
        <div className="flex items-center justify-between border-b border-[#2F2B28]/10 px-6 py-5">
          <div>
            <h2
              id="experts-filter-title"
              className="font-['Nunito'] font-bold text-[16px] sm:text-[18px] md:text-[20px] text-[#2F2B28]"
            >
              Filters
            </h2>
            <p className="mt-1 font-['Nunito'] text-[13px] text-[#73706C]">
              {activeCount > 0 ? `${activeCount} selected` : "Refine the experts list"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-[#2F2B28] hover:bg-black/5"
            aria-label="Close filters"
          >
            <XIcon size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 py-6">
          {optionsError ? (
            <div className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 text-[14px] text-red-700">
              {optionsError}
            </div>
          ) : null}

          <fieldset>
            <legend className="font-['Nunito'] font-bold text-[15px] text-[#2F2B28]">Location</legend>
            <select
              value={draft.primaryLocationId ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  primaryLocationId: event.target.value || null,
                }))
              }
              disabled={isLoadingOptions}
              className="mt-3 h-12 w-full rounded-[4px] border border-[#73706C]/40 bg-white px-4 font-['Nunito'] text-[15px] text-[#2F2B28] outline-none focus:border-[#0B6E66]"
            >
              <option value="">All locations</option>
              {options.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </fieldset>

          <CheckboxList
            label="Languages"
            options={options.languages}
            selected={draft.languageIds}
            onChange={(languageIds) => setDraft((prev) => ({ ...prev, languageIds }))}
          />

          <CheckboxList
            label="Expertise"
            options={options.expertise}
            selected={draft.expertiseIds}
            onChange={(expertiseIds) => setDraft((prev) => ({ ...prev, expertiseIds }))}
          />
        </div>

        <div className="flex gap-3 border-t border-[#2F2B28]/10 px-6 py-5">
          <button
            type="button"
            onClick={() => {
              const cleared = {
                primaryLocationId: null,
                languageIds: [],
                expertiseIds: [],
                minRating: null,
              };
              setDraft(cleared);
              onApply(cleared);
              onClose();
            }}
            className="h-12 flex-1 rounded-[4px] border border-[#73706C] font-['Nunito'] font-medium text-[15px] text-[#2F2B28] hover:bg-black/5"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="h-12 flex-1 rounded-[4px] bg-[#0B6E66] font-['Nunito'] font-medium text-[15px] text-[#FAFAFA] hover:bg-[#074A46]"
          >
            Apply filters
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
