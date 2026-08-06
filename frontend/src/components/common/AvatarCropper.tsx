import { useEffect, useRef, useState } from "react";
import {
  centeredOffset,
  clampOffset,
  coverScale,
  offsetAfterZoom,
  scaledSize,
  visibleSourceRect,
  type Point,
  type Size,
} from "../../lib/avatarCropGeometry";

const MAX_ZOOM = 3;
const KEYBOARD_STEP_PX = 12;
const OUTPUT_SIZE_PX = 512;
const OUTPUT_JPEG_QUALITY = 0.82;
/** Long-edge cap for the retained source photo (fits MongoDB data-URI budget). */
const SOURCE_MAX_EDGE_PX = 1600;
const SOURCE_JPEG_QUALITY = 0.88;
const DEFAULT_STAGE_PX = 320;

export type AvatarCropSaveResult = {
  croppedDataUri: string;
  /** Full (possibly downscaled) photo kept so the user can re-crop later. */
  sourceDataUri: string;
};

type AvatarCropperProps = {
  /** Fresh upload from the file picker. */
  file?: File;
  /** Previously saved source (or cropped fallback) for re-editing. */
  sourceUrl?: string;
  /** Crop window width ÷ height. Use `1` for the round avatar. */
  aspectRatio?: number;
  saving: boolean;
  onCancel: () => void;
  onSave: (result: AvatarCropSaveResult) => void;
};

/**
 * Encode the loaded bitmap as a JPEG data URI, shrinking only when the long
 * edge exceeds SOURCE_MAX_EDGE_PX so we keep enough resolution to re-crop.
 */
function encodeSourceDataUri(image: HTMLImageElement): string {
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longest > SOURCE_MAX_EDGE_PX ? SOURCE_MAX_EDGE_PX / longest : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process that image.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", SOURCE_JPEG_QUALITY);
}

/**
 * Pan/zoom cropper that keeps the source photo's aspect ratio (never stretches).
 *
 * The stage is a square viewport; a circular mask shows what the round avatar
 * will keep. Tailwind Preflight's `img { max-width: 100% }` is explicitly
 * overridden so the scaled width/height stay proportional.
 */
export function AvatarCropper({
  file,
  sourceUrl,
  aspectRatio = 1,
  saving,
  onCancel,
  onSave,
}: AvatarCropperProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(DEFAULT_STAGE_PX);
  const frameHeight = stageWidth;
  const frameWidth = Math.max(1, Math.round(stageWidth * aspectRatio));

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; from: Point; origin: Point } | null>(null);
  // When re-editing an already-saved source, keep that URI instead of re-encoding.
  const retainedSourceUrl = useRef<string | null>(sourceUrl ?? null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (!width) return;
      setStageWidth(Math.max(200, Math.floor(width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    const loading = new Image();
    loading.onload = () => {
      setImage(loading);
      setError(null);
      setZoom(1);
      setOffset(
        centeredOffset(
          { width: frameWidth, height: frameHeight },
          scaledSize(
            { width: loading.naturalWidth, height: loading.naturalHeight },
            coverScale(
              { width: frameWidth, height: frameHeight },
              { width: loading.naturalWidth, height: loading.naturalHeight },
            ),
          ),
        ),
      );
    };
    loading.onerror = () => {
      setImage(null);
      setError("Could not read that image.");
    };

    if (file) {
      retainedSourceUrl.current = null;
      objectUrl = URL.createObjectURL(file);
      loading.src = objectUrl;
    } else if (sourceUrl) {
      retainedSourceUrl.current = sourceUrl;
      loading.src = sourceUrl;
    } else {
      setError("No photo to crop.");
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // frame size at load time is fine as a starting centre; resize is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, sourceUrl]);

  const frame: Size = { width: frameWidth, height: frameHeight };
  const source: Size | null = image
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : null;
  const scale = source ? coverScale(frame, source) * zoom : 1;
  const displayed = source ? scaledSize(source, scale) : { width: 0, height: 0 };
  const cropDiameter = Math.min(frameWidth, frameHeight);

  useEffect(() => {
    if (!source) return;
    setOffset((current) => clampOffset(current, frame, displayed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameWidth, frameHeight]);

  function pan(next: Point) {
    setOffset(clampOffset(next, frame, displayed));
  }

  function changeZoom(nextZoom: number) {
    if (!source) return;
    const nextDisplayed = scaledSize(source, coverScale(frame, source) * nextZoom);
    setZoom(nextZoom);
    setOffset(clampOffset(offsetAfterZoom(offset, frame, nextZoom / zoom), frame, nextDisplayed));
  }

  function handleSave() {
    if (!image) return;
    const rect = visibleSourceRect(frame, offset, scale);
    const canvas = document.createElement("canvas");
    canvas.height = OUTPUT_SIZE_PX;
    canvas.width = Math.round(OUTPUT_SIZE_PX * aspectRatio);
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Could not process that image.");
      return;
    }
    context.drawImage(
      image,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    try {
      const croppedDataUri = canvas.toDataURL("image/jpeg", OUTPUT_JPEG_QUALITY);
      const sourceDataUri = retainedSourceUrl.current ?? encodeSourceDataUri(image);
      onSave({ croppedDataUri, sourceDataUri });
    } catch {
      setError("Could not process that image.");
    }
  }

  return (
    <div>
      <div
        ref={stageRef}
        role="group"
        aria-label="Drag to reposition your photo inside the crop circle"
        tabIndex={0}
        className="relative mx-auto aspect-square w-full touch-none overflow-hidden rounded-xl bg-[#1C1A18] outline-none focus-visible:ring-2 focus-visible:ring-[#0B6E66]"
        style={{ cursor: image ? "grab" : "default" }}
        onPointerDown={(event) => {
          if (!image) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            from: { x: event.clientX, y: event.clientY },
            origin: offset,
          };
          event.currentTarget.style.cursor = "grabbing";
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          pan({
            x: drag.origin.x + (event.clientX - drag.from.x),
            y: drag.origin.y + (event.clientY - drag.from.y),
          });
        }}
        onPointerUp={(event) => {
          dragRef.current = null;
          event.currentTarget.style.cursor = image ? "grab" : "default";
        }}
        onPointerCancel={(event) => {
          dragRef.current = null;
          event.currentTarget.style.cursor = image ? "grab" : "default";
        }}
        onKeyDown={(event) => {
          const nudges: Record<string, Point> = {
            ArrowLeft: { x: -KEYBOARD_STEP_PX, y: 0 },
            ArrowRight: { x: KEYBOARD_STEP_PX, y: 0 },
            ArrowUp: { x: 0, y: -KEYBOARD_STEP_PX },
            ArrowDown: { x: 0, y: KEYBOARD_STEP_PX },
          };
          const nudge = nudges[event.key];
          if (!nudge) return;
          event.preventDefault();
          pan({ x: offset.x + nudge.x, y: offset.y + nudge.y });
        }}
      >
        {image ? (
          <img
            src={image.src}
            alt=""
            draggable={false}
            // Tailwind Preflight sets max-width:100% on img; without max-w-none
            // the browser shrinks width but keeps our height → vertical stretch.
            className="pointer-events-none absolute left-0 top-0 max-h-none max-w-none select-none"
            style={{
              width: displayed.width,
              height: displayed.height,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/60">
            {error ?? "Loading photo…"}
          </div>
        )}

        {image ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle ${cropDiameter / 2}px at 50% 50%, transparent ${cropDiameter / 2 - 1}px, rgba(0,0,0,0.55) ${cropDiameter / 2}px)`,
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
              style={{ width: cropDiameter, height: cropDiameter }}
            />
          </>
        ) : null}
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-[#73706C]">
        Drag to reposition. Everything inside the circle becomes your avatar — the photo keeps its
        original proportions.
      </p>

      <label className="mt-4 flex items-center gap-3">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A9691]">
          Zoom
        </span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!image || saving}
          onChange={(event) => changeZoom(Number(event.target.value))}
          className="h-1.5 flex-1 accent-[#0B6E66]"
        />
      </label>

      {error && image ? <p className="mt-3 text-center text-xs text-[#C94A45]">{error}</p> : null}

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-[4px] border border-[#D7D2CC] bg-white px-4 py-2.5 text-sm font-semibold text-[#3B372F] transition-colors hover:bg-[#F6F4F1] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!image || saving}
          onClick={handleSave}
          className="rounded-[4px] bg-[#0B6E66] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#095B54] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save photo"}
        </button>
      </div>
    </div>
  );
}
