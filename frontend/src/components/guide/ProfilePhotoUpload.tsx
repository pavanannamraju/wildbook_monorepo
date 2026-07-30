import { CameraIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ProfilePhotoValue = {
  contentType: string;
  base64: string;
  previewUrl: string;
};

type ProfilePhotoUploadProps = {
  value: ProfilePhotoValue | null;
  onChange: (next: ProfilePhotoValue | null) => void;
  onError: (message: string | null) => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export function ProfilePhotoUpload({ value, onChange, onError }: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      onError("Profile photo must be JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      onError("Profile photo must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    onError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const [, base64] = dataUrl.split(",", 2);
      if (!base64) {
        throw new Error("Invalid image encoding.");
      }
      onChange({
        contentType: file.type,
        base64,
        previewUrl: dataUrl,
      });
    } catch {
      onError("Could not read the selected image. Please try another file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-[16px] font-medium text-[#323232]">
        <CameraIcon size={18} className="text-[#73706c]" />
        Profile photo
      </label>
      <div className="flex items-center gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8e6e1]">
          {value ? (
            <img src={value.previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <CameraIcon size={32} className="text-[#9a9690]" />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded border border-[#0b6e66] px-4 py-2.5 text-[15px] font-medium text-[#0b6e66] disabled:opacity-60"
          >
            <UploadSimpleIcon size={18} />
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
          <p className="mt-2 text-[13px] text-[#73706c]">JPG, PNG or WebP · max 5 MB</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
