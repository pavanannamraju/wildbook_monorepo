import { UserIcon } from "@phosphor-icons/react";

type ExpertAvatarProps = {
  src: string | null;
  alt: string;
  imgClassName?: string;
  iconSize?: number;
  lazy?: boolean;
};

/**
 * Renders an expert's photo, falling back to a neutral user avatar when no
 * photo is available (e.g. a guide profile created without uploading one).
 * The wrapping element supplies sizing/background; this only fills it.
 */
export function ExpertAvatar({
  src,
  alt,
  imgClassName = "h-full w-full object-cover",
  iconSize = 64,
  lazy = false,
}: ExpertAvatarProps) {
  if (src) {
    return <img src={src} alt={alt} className={imgClassName} loading={lazy ? "lazy" : undefined} />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <UserIcon size={iconSize} weight="fill" className="text-[#b9b4ad]" aria-label={alt} />
    </div>
  );
}
