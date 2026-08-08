import { PencilSimpleIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AvatarType, AvatarUpdateInput } from "../../api/auth";
import { AvatarCropper } from "../common/AvatarCropper";
import { UserAvatar } from "../common/UserAvatar";
import {
  PRESET_AVATARS,
  resolvePresetAvatarSrc,
  resolveUserAvatarSrc,
} from "../../data/presetAvatars";
import { PrimaryBtn } from "./AccountFormControls";

/** Custom profile photos are cropped to a square — UserAvatar shows them in a circle. */
const AVATAR_CROP_ASPECT_RATIO = 1;

export function AccountAvatarModal({
  open,
  onClose,
  displayName,
  initials,
  avatarType,
  avatarKey,
  avatarUrl,
  avatarSourceUrl,
  saving,
  saveError,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  initials: string;
  avatarType: AvatarType | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  avatarSourceUrl: string | null;
  saving: boolean;
  saveError: string | null;
  onSave: (payload: AvatarUpdateInput) => Promise<void>;
}) {
  const [pendingPresetKey, setPendingPresetKey] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<
    { kind: "file"; file: File } | { kind: "url"; url: string } | null
  >(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const customPhotoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setPendingPresetKey(avatarType === "preset" ? avatarKey : null);
    setCropSource(null);
    setLocalError(null);
  }, [open, avatarType, avatarKey]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const profileAvatarSrc = resolveUserAvatarSrc({
    avatarType,
    avatarKey,
    avatarUrl,
  });
  const pendingPresetSrc = resolvePresetAvatarSrc(pendingPresetKey);
  const avatarPreviewSrc = pendingPresetSrc ?? profileAvatarSrc;
  const avatarPreviewOverflowTop = pendingPresetKey !== null || avatarType === "preset";
  const presetSelectionChanged =
    pendingPresetKey !== null && !(avatarType === "preset" && avatarKey === pendingPresetKey);
  const displayError = localError ?? saveError;

  function handlePhotoFileSelected(file: File | null) {
    if (customPhotoInputRef.current) {
      customPhotoInputRef.current.value = "";
    }
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose an image file.");
      return;
    }
    setLocalError(null);
    setPendingPresetKey(null);
    setCropSource({ kind: "file", file });
  }

  function openAdjustCrop() {
    const url = avatarSourceUrl ?? avatarUrl;
    if (!url) return;
    setLocalError(null);
    setPendingPresetKey(null);
    setCropSource({ kind: "url", url });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-1200 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-photo-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close edit photo dialog"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div className="relative z-1 flex max-h-[90svh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-[#F8F6F3] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#E3DDD8] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A9691]">
              Profile
            </p>
            <h2
              id="edit-photo-title"
              className="mt-1 text-[18px] font-extrabold tracking-[-0.02em] text-[#3B372F] sm:text-[20px]"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              {cropSource ? "Crop photo" : "Edit photo"}
            </h2>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => onClose()}
            className="rounded-full p-2 text-[#9A9691] transition-colors hover:bg-[#E8E2DC] hover:text-[#3B372F] disabled:opacity-50"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className={`overflow-y-auto ${cropSource ? "px-4 py-4 sm:px-5 sm:py-5" : "px-5 py-5"}`}>
          {cropSource ? (
            <AvatarCropper
              file={cropSource.kind === "file" ? cropSource.file : undefined}
              sourceUrl={cropSource.kind === "url" ? cropSource.url : undefined}
              aspectRatio={AVATAR_CROP_ASPECT_RATIO}
              saving={saving}
              onCancel={() => setCropSource(null)}
              onSave={({ croppedDataUri, sourceDataUri }) =>
                void onSave({
                  avatar_type: "custom",
                  avatar_url: croppedDataUri,
                  avatar_source_url: sourceDataUri,
                })
              }
            />
          ) : (
            <>
              <div className="mb-5 flex justify-center">
                <UserAvatar
                  initials={initials}
                  imageUrl={avatarPreviewSrc}
                  large
                  ring
                  overflowTop={avatarPreviewOverflowTop}
                  alt={displayName}
                />
              </div>

              {avatarType === "custom" && (avatarSourceUrl || avatarUrl) ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={openAdjustCrop}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#0B6E66]/40 bg-white px-4 py-3 text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] disabled:opacity-60"
                >
                  <PencilSimpleIcon size={16} />
                  Adjust crop
                </button>
              ) : null}

              <button
                type="button"
                disabled={saving}
                onClick={() => customPhotoInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-[#0B6E66]/40 bg-white px-4 py-3 text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] disabled:opacity-60"
              >
                <UploadSimpleIcon size={16} />
                {avatarType === "custom" ? "Upload new photo" : "Upload photo"}
              </button>

              <p className="mt-5 mb-3 text-center text-xs font-semibold text-[#9A9691]">
                or choose a wildlife avatar
              </p>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {PRESET_AVATARS.map((avatar) => {
                  const selected =
                    pendingPresetKey !== null
                      ? pendingPresetKey === avatar.key
                      : avatarType === "preset" && avatarKey === avatar.key;
                  return (
                    <button
                      key={avatar.key}
                      type="button"
                      disabled={saving}
                      title={avatar.label}
                      aria-label={`Select ${avatar.label} avatar`}
                      aria-pressed={selected}
                      data-avatar-type="preset"
                      data-avatar-key={avatar.key}
                      onClick={() => setPendingPresetKey(avatar.key)}
                      className={`mx-auto overflow-visible rounded-full p-0.5 transition-transform hover:scale-105 disabled:opacity-60 ${
                        selected ? "ring-2 ring-[#0B6E66] ring-offset-2" : ""
                      }`}
                    >
                      <UserAvatar
                        initials={avatar.label.slice(0, 2)}
                        imageUrl={avatar.src}
                        alt={avatar.label}
                        overflowTop
                        ring
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E3DDD8] pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onClose()}
                  className="rounded-[4px] border border-[#D7D2CC] bg-white px-4 py-2.5 text-sm font-semibold text-[#3B372F] transition-colors hover:bg-[#F6F4F1] disabled:opacity-50"
                >
                  Cancel
                </button>
                <PrimaryBtn
                  disabled={saving || !presetSelectionChanged}
                  onClick={() => {
                    if (!pendingPresetKey) return;
                    void onSave({
                      avatar_type: "preset",
                      avatar_key: pendingPresetKey,
                    });
                  }}
                >
                  {saving ? "Saving…" : "Save avatar"}
                </PrimaryBtn>
              </div>
            </>
          )}

          <input
            ref={customPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handlePhotoFileSelected(event.target.files?.[0] ?? null)}
          />

          {displayError ? (
            <p className="mt-4 text-center text-xs text-[#C94A45]">{displayError}</p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
