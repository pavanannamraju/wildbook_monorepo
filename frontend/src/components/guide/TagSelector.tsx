import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

type TagSelectorProps = {
  title: string;
  subtitle: string;
  presets: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  customPlaceholder: string;
  required?: boolean;
};

function normalizeTag(value: string): string {
  return value.trim();
}

export function TagSelector({
  title,
  subtitle,
  presets,
  selected,
  onChange,
  customPlaceholder,
  required = false,
}: TagSelectorProps) {
  const [customValue, setCustomValue] = useState("");

  function toggleTag(tag: string) {
    const key = tag.toLowerCase();
    if (selected.some((item) => item.toLowerCase() === key)) {
      onChange(selected.filter((item) => item.toLowerCase() !== key));
      return;
    }
    onChange([...selected, tag]);
  }

  function addCustomTag() {
    const cleaned = normalizeTag(customValue);
    if (!cleaned) {
      return;
    }
    const key = cleaned.toLowerCase();
    if (selected.some((item) => item.toLowerCase() === key)) {
      setCustomValue("");
      return;
    }
    onChange([...selected, cleaned]);
    setCustomValue("");
  }

  function removeTag(tag: string) {
    const key = tag.toLowerCase();
    onChange(selected.filter((item) => item.toLowerCase() !== key));
  }

  const presetKeys = new Set(presets.map((preset) => preset.toLowerCase()));
  const customSelected = selected.filter((item) => !presetKeys.has(item.toLowerCase()));

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#121212]">
        {title}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </h2>
      <p className="mt-1 text-[14px] text-[#73706c]">{subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {presets.map((tag) => {
          const isSelected = selected.some((item) => item.toLowerCase() === tag.toLowerCase());
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
        <input
          type="text"
          value={customValue}
          onChange={(event) => setCustomValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomTag();
            }
          }}
          placeholder={customPlaceholder}
          className="h-12 flex-1 rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28] outline-none focus:border-[#0b6e66]"
        />
        <button
          type="button"
          onClick={addCustomTag}
          aria-label="Add custom tag"
          className="flex h-12 w-12 items-center justify-center rounded border border-black/12 bg-white text-[#2f2b28] hover:bg-black/3"
        >
          <PlusIcon size={20} />
        </button>
      </div>
    </section>
  );
}
