import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDotsIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { dropdownTriggerClassName } from "./AccountFormControls";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const CAL_YEAR_CHUNK = 12;

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function BirthDatePicker({
  value,
  onChange,
  disabled,
  max = todayIsoDate(),
  invalid = false,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  max?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [calView, setCalView] = useState<"day" | "month" | "year">("day");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const maxParsed = parseIsoDate(max) ?? parseIsoDate(todayIsoDate())!;
  const selected = parseIsoDate(value);
  const minYear = maxParsed.year - 120;

  const [nav, setNav] = useState({
    year: selected?.year ?? maxParsed.year,
    month: selected?.month ?? maxParsed.month,
  });

  useEffect(() => {
    if (!open) return;
    setCalView("day");
    if (selected) {
      setNav({ year: selected.year, month: selected.month });
    } else {
      setNav({ year: maxParsed.year, month: maxParsed.month });
    }
  }, [open, selected?.year, selected?.month, maxParsed.year, maxParsed.month]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const yearBase = Math.floor(nav.year / CAL_YEAR_CHUNK) * CAL_YEAR_CHUNK;
  const isNextYearChunkDisabled = yearBase + CAL_YEAR_CHUNK > maxParsed.year;
  const isPrevYearChunkDisabled = yearBase - CAL_YEAR_CHUNK < minYear;
  const isNextNavYearDisabled = nav.year >= maxParsed.year;
  const isPrevNavYearDisabled = nav.year <= minYear;

  const firstWeekday = new Date(nav.year, nav.month - 1, 1).getDay();
  const totalDays = daysInMonth(nav.year, nav.month);
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  const isNextMonthDisabled =
    nav.year > maxParsed.year || (nav.year === maxParsed.year && nav.month >= maxParsed.month);
  const isPrevMonthDisabled =
    nav.year < minYear || (nav.year === minYear && nav.month <= 1);

  function prevMonth() {
    setNav((current) =>
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { ...current, month: current.month - 1 },
    );
  }

  function nextMonth() {
    setNav((current) => {
      const next =
        current.month === 12
          ? { year: current.year + 1, month: 1 }
          : { ...current, month: current.month + 1 };
      if (next.year > maxParsed.year || (next.year === maxParsed.year && next.month > maxParsed.month)) {
        return current;
      }
      return next;
    });
  }

  function isFutureDay(day: number): boolean {
    return toIsoDate(nav.year, nav.month, day) > max;
  }

  function isDaySelected(day: number): boolean {
    return Boolean(
      selected && selected.year === nav.year && selected.month === nav.month && selected.day === day,
    );
  }

  const arrowBtn = (disabledArrow: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors ${
      disabledArrow ? "cursor-not-allowed text-[#D7D2CC]" : "text-[#73706C] hover:bg-[#F6F4F1]"
    }`;
  const headerBtn =
    "font-['Nunito'] text-[13px] font-semibold text-[#3B372F] transition-colors hover:text-[#0B6E66]";

  const displayValue = selected
    ? new Date(selected.year, selected.month - 1, selected.day).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="account-dob"
        disabled={disabled}
        aria-invalid={invalid}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${dropdownTriggerClassName} ${
          invalid ? "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDotsIcon size={14} className="shrink-0 text-[#9A9691]" />
          <span className={`truncate ${displayValue ? "text-[#2F2B28]" : "text-[#9A9691]"}`}>
            {displayValue || "Select date…"}
          </span>
        </span>
        <CaretDownIcon size={12} className="shrink-0 text-[#9A9691]" />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-[272px] select-none rounded-[6px] border border-[#E3DDD8] bg-white p-3 shadow-lg">
          {calView === "year" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isPrevYearChunkDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year - CAL_YEAR_CHUNK }))}
                  className={arrowBtn(isPrevYearChunkDisabled)}
                  aria-label="Previous years"
                >
                  <ArrowLeftIcon size={13} />
                </button>
                <button type="button" onClick={() => setCalView("day")} className={headerBtn}>
                  {yearBase}–{yearBase + CAL_YEAR_CHUNK - 1}
                </button>
                <button
                  type="button"
                  disabled={isNextYearChunkDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year + CAL_YEAR_CHUNK }))}
                  className={arrowBtn(isNextYearChunkDisabled)}
                  aria-label="Next years"
                >
                  <ArrowRightIcon size={13} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: CAL_YEAR_CHUNK }, (_, index) => yearBase + index).map((year) => {
                  const isFutureYear = year > maxParsed.year || year < minYear;
                  const isSelectedYear = selected?.year === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={isFutureYear}
                      onClick={() => {
                        setNav((current) => ({ ...current, year }));
                        setCalView("month");
                      }}
                      className={`rounded-[6px] py-2.5 font-['Nunito'] text-[12px] font-medium transition-colors ${
                        isSelectedYear
                          ? "bg-[#0B6E66] text-white"
                          : isFutureYear
                            ? "cursor-not-allowed text-[#D7D2CC]"
                            : year === maxParsed.year
                              ? "font-bold text-[#0B6E66] hover:bg-[#E8F4F2]"
                              : "text-[#3B372F] hover:bg-[#E8F4F2] hover:text-[#0B6E66]"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {calView === "month" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isPrevNavYearDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year - 1 }))}
                  className={arrowBtn(isPrevNavYearDisabled)}
                  aria-label="Previous year"
                >
                  <ArrowLeftIcon size={13} />
                </button>
                <button type="button" onClick={() => setCalView("year")} className={headerBtn}>
                  {nav.year}
                </button>
                <button
                  type="button"
                  disabled={isNextNavYearDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year + 1 }))}
                  className={arrowBtn(isNextNavYearDisabled)}
                  aria-label="Next year"
                >
                  <ArrowRightIcon size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {MONTH_LABELS.map((label, index) => {
                  const month = index + 1;
                  const isFutureMonth =
                    nav.year > maxParsed.year ||
                    (nav.year === maxParsed.year && month > maxParsed.month) ||
                    nav.year < minYear;
                  const isSelectedMonth = selected?.year === nav.year && selected?.month === month;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={isFutureMonth}
                      onClick={() => {
                        setNav((current) => ({ ...current, month }));
                        setCalView("day");
                      }}
                      className={`rounded-[6px] py-2.5 font-['Nunito'] text-[12px] font-medium transition-colors ${
                        isSelectedMonth
                          ? "bg-[#0B6E66] text-white"
                          : isFutureMonth
                            ? "cursor-not-allowed text-[#D7D2CC]"
                            : "text-[#3B372F] hover:bg-[#E8F4F2] hover:text-[#0B6E66]"
                      }`}
                    >
                      {label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {calView === "day" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isPrevMonthDisabled}
                  onClick={prevMonth}
                  className={arrowBtn(isPrevMonthDisabled)}
                  aria-label="Previous month"
                >
                  <ArrowLeftIcon size={13} />
                </button>
                <button type="button" onClick={() => setCalView("year")} className={headerBtn}>
                  {MONTH_LABELS[nav.month - 1]} {nav.year}
                </button>
                <button
                  type="button"
                  disabled={isNextMonthDisabled}
                  onClick={nextMonth}
                  className={arrowBtn(isNextMonthDisabled)}
                  aria-label="Next month"
                >
                  <ArrowRightIcon size={13} />
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 text-center">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="font-['Nunito'] text-[10px] font-semibold text-[#9A9691]">
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {cells.map((day, index) => {
                  if (day === null) return <span key={`empty-${index}`} />;
                  const future = isFutureDay(day);
                  const selectedDay = isDaySelected(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={future}
                      onClick={() => {
                        onChange(toIsoDate(nav.year, nav.month, day));
                        setOpen(false);
                      }}
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full font-['Nunito'] text-[12px] font-medium transition-colors ${
                        selectedDay
                          ? "bg-[#0B6E66] text-white"
                          : future
                            ? "cursor-not-allowed text-[#D7D2CC]"
                            : "text-[#3B372F] hover:bg-[#E8F4F2] hover:text-[#0B6E66]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
