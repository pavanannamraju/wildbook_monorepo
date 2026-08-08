import { XIcon } from "@phosphor-icons/react";

type FilterTagProps = {
  label: string;
  onRemove: () => void;
};

export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-3 py-1 font-['Nunito'] text-xs font-semibold"
      style={{
        borderRadius: "4px",
        backgroundColor: "rgba(11,110,102,0.08)",
        borderColor: "rgba(11,110,102,0.25)",
        color: "#0B6E66",
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-[#0B6E66]/20"
        aria-label={`Remove ${label}`}
      >
        <XIcon size={9} weight="bold" />
      </button>
    </span>
  );
}
