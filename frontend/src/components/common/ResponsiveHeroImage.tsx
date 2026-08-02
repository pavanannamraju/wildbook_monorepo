type ResponsiveHeroImageProps = {
  mobileSrc: string;
  tabletSrc: string;
  desktopSrc: string;
  largeSrc?: string;
  alt?: string;
  className?: string;
};

/** Art-directed hero: mobile to 767, tablet to 1023, desktop to 1535, optional large default. */
export function ResponsiveHeroImage({
  mobileSrc,
  tabletSrc,
  desktopSrc,
  largeSrc,
  alt = "",
  className = "absolute inset-0 h-full w-full select-none object-cover object-center",
}: ResponsiveHeroImageProps) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobileSrc} />
      <source media="(max-width: 1023px)" srcSet={tabletSrc} />
      {largeSrc ? <source media="(max-width: 1535px)" srcSet={desktopSrc} /> : null}
      <img src={largeSrc ?? desktopSrc} alt={alt} className={className} />
    </picture>
  );
}
