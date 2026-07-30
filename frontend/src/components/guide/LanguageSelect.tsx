import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type LanguageSelectProps = {
  title: string;
  subtitle: string;
  presets: readonly string[];
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  required?: boolean;
};

const MAX_SUGGESTIONS = 8;

export function LanguageSelect({
  title,
  subtitle,
  presets,
  options,
  selected,
  onChange,
  placeholder = "Add other language...",
  required = false,
}: LanguageSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedKeys = useMemo(
    () => new Set(selected.map((item) => item.toLowerCase())),
    [selected],
  );
  const presetKeys = useMemo(
    () => new Set(presets.map((item) => item.toLowerCase())),
    [presets],
  );

  // Languages chosen via autocomplete (i.e. not part of the preset tag row).
  const customSelected = useMemo(
    () => selected.filter((item) => !presetKeys.has(item.toLowerCase())),
    [selected, presetKeys],
  );

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options
      .filter(
        (option) =>
          !presetKeys.has(option.toLowerCase()) &&
          !selectedKeys.has(option.toLowerCase()) &&
          (term === "" || option.toLowerCase().includes(term)),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [query, options, presetKeys, selectedKeys]);

  function toggleTag(tag: string) {
    const key = tag.toLowerCase();
    if (selectedKeys.has(key)) {
      onChange(selected.filter((item) => item.toLowerCase() !== key));
      return;
    }
    onChange([...selected, tag]);
  }

  function removeTag(tag: string) {
    const key = tag.toLowerCase();
    onChange(selected.filter((item) => item.toLowerCase() !== key));
  }

  function addLanguage(language: string) {
    const cleaned = language.trim();
    if (!cleaned || selectedKeys.has(cleaned.toLowerCase())) {
      setQuery("");
      setIsOpen(false);
      return;
    }
    onChange([...selected, cleaned]);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(0);
  }

  function commitHighlighted() {
    if (suggestions.length === 0) {
      return;
    }
    const safeIndex = Math.min(highlightedIndex, suggestions.length - 1);
    const candidate = suggestions[safeIndex];
    if (candidate) {
      addLanguage(candidate);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((index) => Math.min(index + 1, Math.max(suggestions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      // Only commit an explicit suggestion — never auto-add the raw typed text.
      event.preventDefault();
      commitHighlighted();
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#121212]">
        {title}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </h2>
      <p className="mt-1 text-[14px] text-[#73706c]">{subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {presets.map((tag) => {
          const isSelected = selectedKeys.has(tag.toLowerCase());
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${
                isSelected
                  ? "border-[#0b6e66] bg-[#d9efe4] text-[#0b6e66]"
                  : "border-black/12 bg-white text-[#4a4a4a] hover:border-black/20"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {customSelected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {customSelected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full border border-[#0b6e66] bg-[#d9efe4] px-4 py-2 text-[14px] font-medium text-[#0b6e66]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-[#0b6e66] hover:text-[#074a46]"
              >
                <XIcon size={14} weight="bold" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={isOpen && suggestions.length > 0}
            aria-autocomplete="list"
            className="h-12 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28] outline-none focus:border-[#0b6e66]"
          />

          {isOpen && suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded border border-black/10 bg-white py-1 shadow-lg">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    // Use mousedown so the option is chosen before the input blur fires.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      addLanguage(suggestion);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`block w-full px-4 py-2 text-left text-[15px] ${
                      index === highlightedIndex ? "bg-[#d9efe4] text-[#0b6e66]" : "text-[#2f2b28]"
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
          onClick={commitHighlighted}
          aria-label="Add language"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-black/12 bg-white text-[#2f2b28] hover:bg-black/3"
        >
          <PlusIcon size={20} />
        </button>
      </div>
    </section>
  );
}
