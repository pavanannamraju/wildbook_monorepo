import { ImageSquareIcon } from "@phosphor-icons/react";

export function MyGalleryPage() {
  return (
    <div>
      <h1 className="text-[18px] font-semibold text-(--color-wildbook-text) sm:text-[20px] md:text-[22px]">My Gallery</h1>
      <p className="mt-1 text-sm text-(--color-wildbook-muted)">Photos from your trips will show up here.</p>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/15 p-12 text-center">
        <ImageSquareIcon size={40} className="text-(--color-wildbook-teal)" />
        <p className="text-sm text-(--color-wildbook-muted)">
          Your gallery is empty. This is where photos shared by guides after your experiences will appear.
        </p>
      </div>
    </div>
  );
}
