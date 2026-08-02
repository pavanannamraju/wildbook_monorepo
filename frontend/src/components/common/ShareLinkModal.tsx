import { useEffect, useMemo, useState } from "react";
import { CheckIcon, CopyIcon, XIcon } from "@phosphor-icons/react";

type ShareLinkModalProps = {
  isOpen: boolean;
  title?: string;
  path: string;
  onClose: () => void;
};

export function ShareLinkModal({ isOpen, title = "Share link", path, onClose }: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const fullLink = useMemo(() => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [path]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!isOpen) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/45 p-4">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close share modal" />
      <div className="relative z-1 w-full max-w-[560px] rounded-xl bg-[#FBF9F6] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-[#2F2B28]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#4f4b47] hover:bg-black/5"
            aria-label="Close share modal"
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={fullLink}
            className="h-11 w-full rounded border border-[#d9d3cd] bg-[#f3eee9] px-3 text-[13px] text-[#2F2B28]"
          />
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded bg-[#0B6E66] px-3 text-[13px] text-white hover:bg-[#08554f]"
          >
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            <span className="inline-grid place-items-center">
              <span className="invisible col-start-1 row-start-1" aria-hidden="true">
                Copied
              </span>
              <span className="col-start-1 row-start-1">{copied ? "Copied" : "Copy"}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
