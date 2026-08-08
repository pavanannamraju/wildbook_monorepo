import {
  CaretDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  dialOptionLabel,
  findDialOption,
  PHONE_DIAL_CODES,
} from "../../data/phoneDialCodes";

/** Shared trigger style for gender / location / country / DOB dropdowns. */
export const dropdownTriggerClassName =
  "relative flex w-full items-center justify-between rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 py-2.5 text-left font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors hover:border-[#B5B0AB] focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60";

export function SelectableTag({
  label,
  selected,
  onClick,
  disabled,
  variant = "interest",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: "interest" | "language";
}) {
  if (variant === "language") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`flex items-center justify-between rounded-[8px] px-4 py-2.5 font-['Nunito'] text-sm font-semibold transition-all disabled:opacity-60 ${
          selected
            ? "bg-[#D4CFC8] text-[#2F2B28]"
            : "bg-[#E8E2DC] text-[#3B372F] hover:bg-[#DDD7D0]"
        }`}
      >
        {label}
        {selected ? <CheckIcon size={14} className="ml-2 shrink-0 text-[#0B6E66]" /> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-[8px] px-3 py-2 font-['Nunito'] text-sm font-semibold transition-all disabled:opacity-60 ${
        selected
          ? "bg-[#9BCDB2] text-[#2F2B28]"
          : "bg-[#9BCDB2]/50 text-[#3B372F] hover:bg-[#9BCDB2]/70"
      }`}
    >
      {selected ? <CheckIcon size={13} className="shrink-0" /> : null}
      {label}
    </button>
  );
}

export function AddCustomValue({
  placeholder,
  disabled,
  suggestions,
  onAdd,
}: {
  placeholder: string;
  disabled?: boolean;
  suggestions?: readonly string[];
  onAdd: (value: string) => boolean;
}) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const term = value.trim().toLowerCase();
    return suggestions.filter((option) => term === "" || option.toLowerCase().includes(term));
  }, [suggestions, value]);

  function commit(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned || disabled) return;
    const added = onAdd(cleaned);
    if (added) {
      setValue("");
      setIsOpen(false);
      setHighlightedIndex(0);
    }
  }

  function commitHighlightedOrTyped() {
    if (filteredSuggestions.length > 0) {
      const candidate = filteredSuggestions[Math.min(highlightedIndex, filteredSuggestions.length - 1)];
      if (candidate) {
        commit(candidate);
        return;
      }
    }
    commit(value);
  }

  return (
    <div className="mt-4 flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          role={suggestions ? "combobox" : undefined}
          aria-expanded={suggestions ? isOpen && filteredSuggestions.length > 0 : undefined}
          aria-autocomplete={suggestions ? "list" : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (suggestions) setIsOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filteredSuggestions.length > 0) {
              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((index) =>
                Math.min(index + 1, Math.max(filteredSuggestions.length - 1, 0)),
              );
              return;
            }
            if (event.key === "ArrowUp" && filteredSuggestions.length > 0) {
              event.preventDefault();
              setHighlightedIndex((index) => Math.max(index - 1, 0));
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              commitHighlightedOrTyped();
              return;
            }
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className="h-11 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60"
        />
        {suggestions && isOpen && filteredSuggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[6px] border border-[#E3DDD8] bg-white py-1 shadow-lg">
            {filteredSuggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commit(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`block w-full px-3 py-2 text-left font-['Nunito'] text-sm ${
                    index === highlightedIndex
                      ? "bg-[#E0F0EC] text-[#0B6E66]"
                      : "text-[#2F2B28] hover:bg-[#F6F4F1]"
                  }`}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || value.trim().length === 0}
        onClick={() => commitHighlightedOrTyped()}
        aria-label="Add custom value"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-[#D7D2CC] bg-white text-[#3B372F] transition-colors hover:bg-[#F6F4F1] disabled:opacity-50"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}

export function PrimaryBtn({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[4px] bg-[#0B6E66] px-4 py-2.5 font-['Nunito'] text-sm font-semibold text-white transition-colors hover:bg-[#095B54] active:bg-[#074A46] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SecondaryBtn({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      to={href}
      className={`inline-flex items-center gap-2 rounded-[4px] border border-[#0B6E66] bg-white px-3 py-2 font-['Nunito'] text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] active:bg-[#9BCDB2]/30 ${className}`}
    >
      {children}
    </Link>
  );
}

export function DialCodeSelect({
  value,
  onChange,
  disabled,
  invalid = false,
}: {
  value: string;
  onChange: (dial: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const needle = query.trim().toLowerCase();
  const list = PHONE_DIAL_CODES.filter((option) => {
    if (!needle) return true;
    return (
      option.dial.toLowerCase().includes(needle) ||
      option.label.toLowerCase().includes(needle) ||
      dialOptionLabel(option).toLowerCase().includes(needle)
    );
  });

  return (
    <div ref={rootRef} className="relative w-[4.75rem] shrink-0">
      <button
        type="button"
        id="account-phone-dial"
        disabled={disabled}
        aria-invalid={invalid}
        aria-expanded={open}
        aria-label="Country code"
        title={findDialOption(value)?.label ?? value}
        onClick={() => setOpen((current) => !current)}
        className={`${dropdownTriggerClassName} px-2 ${
          invalid ? "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20" : ""
        }`}
      >
        <span className="truncate font-medium tabular-nums">{value}</span>
        <CaretDownIcon size={11} className="shrink-0 text-[#9A9691]" />
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 w-[min(18rem,calc(100vw-3rem))] overflow-hidden rounded-[6px] border border-[#E3DDD8] bg-white shadow-lg">
          <div className="border-b border-[#E3DDD8] p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code…"
              className="h-9 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm outline-none focus:border-[#0B6E66]"
            />
          </div>
          <ul className="max-h-[220px] overflow-y-auto py-1">
            {list.length === 0 ? (
              <li className="px-3 py-2 font-['Nunito'] text-sm text-[#73706C]">No matches.</li>
            ) : (
              list.map((option) => {
                const selected = option.dial === value;
                return (
                  <li key={`${option.dial}-${option.label}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.dial);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-[4px] px-3 py-2 font-['Nunito'] text-sm font-medium transition-colors hover:bg-[#F6F4F1] ${
                        selected ? "text-[#0B6E66]" : "text-[#2F2B28]"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="tabular-nums">{option.dial}</span>
                        <span className="text-[#73706C]"> · {option.label}</span>
                      </span>
                      {selected ? <CheckIcon size={13} className="shrink-0 text-[#0B6E66]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function AccountSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  searchable = false,
  invalid = false,
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder: string;
  disabled?: boolean;
  searchable?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const optionsWithValue =
    value && !(options as readonly string[]).includes(value) ? [value, ...options] : [...options];
  const list = searchable
    ? optionsWithValue.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))
    : optionsWithValue;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-invalid={invalid}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${dropdownTriggerClassName} ${
          invalid ? "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {searchable ? <MagnifyingGlassIcon size={13} className="shrink-0 text-[#9A9691]" /> : null}
          <span className={`truncate ${value ? "text-[#2F2B28]" : "text-[#9A9691]"}`}>
            {value || placeholder}
          </span>
        </span>
        <CaretDownIcon size={12} className="shrink-0 text-[#9A9691]" />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[6px] border border-[#E3DDD8] bg-white shadow-lg">
          {searchable ? (
            <div className="border-b border-[#E3DDD8] p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                className="h-9 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm outline-none focus:border-[#0B6E66]"
              />
            </div>
          ) : null}
          <ul className={`max-h-[200px] overflow-y-auto ${searchable ? "py-1" : "p-1.5"}`}>
            {list.length === 0 ? (
              <li className="px-3 py-2 font-['Nunito'] text-sm text-[#73706C]">No options found.</li>
            ) : (
              list.map((option) => {
                const selected = option === value;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between rounded-[4px] px-3 py-2 font-['Nunito'] text-sm font-medium transition-colors hover:bg-[#F6F4F1] ${
                        selected ? "text-[#0B6E66]" : "text-[#2F2B28]"
                      }`}
                    >
                      {option}
                      {selected ? <CheckIcon size={13} className="shrink-0 text-[#0B6E66]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
