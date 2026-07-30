import { XIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { ReferenceItem } from "../../api/guideProfiles";

type ReferenceMultiSelectProps = {
  title: string;
  subtitle: string;
  options: ReferenceItem[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  required?: boolean;
};

const MAX_SUGGESTIONS = 10;

export function ReferenceMultiSelect({
  title,
  subtitle,
  options,
  selectedIds,
  onChange,
  placeholder = "Search...",
  required = false,
}: ReferenceMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const optionsById = useMemo(() => {
    const map = new Map<string, ReferenceItem>();
    for (const option of options) map.set(option.id, option);
    return map;
  }, [options]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options
      .filter((option) => !selectedSet.has(option.id))
      .filter((option) => (term ? option.name.toLowerCase().includes(term) : true))
      .slice(0, MAX_SUGGESTIONS);
  }, [query, options, selectedSet]);

  function addId(id: string) {
    if (selectedSet.has(id)) return;
    onChange([...selectedIds, id]);
    setQuery("");
    setIsOpen(false);
  }

  function removeId(id: string) {
    onChange(selectedIds.filter((value) => value !== id));
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#121212]">
        {title}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </h2>
      <p className="mt-1 text-[14px] text-[#73706c]">{subtitle}</p>

      {selectedIds.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const item = optionsById.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-2 rounded-full border border-[#0b6e66] bg-[#d9efe4] px-4 py-2 text-[14px] font-medium text-[#0b6e66]"
              >
                {item ? item.name : id}
                <button
                  type="button"
                  onClick={() => removeId(id)}
                  aria-label={`Remove ${item ? item.name : id}`}
                  className="text-[#0b6e66] hover:text-[#074a46]"
                >
                  <XIcon size={14} weight="bold" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="relative mt-4">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-autocomplete="list"
          className="h-12 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28] outline-none focus:border-[#0b6e66]"
        />

        {isOpen && suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded border border-black/10 bg-white py-1 shadow-lg">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    addId(suggestion.id);
                  }}
                  className="block w-full px-4 py-2 text-left text-[15px] text-[#2f2b28] hover:bg-[#d9efe4] hover:text-[#0b6e66]"
                >
                  {suggestion.name}
                  {suggestion.description ? (
                    <span className="ml-2 text-[13px] text-[#73706c]">{suggestion.description}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
