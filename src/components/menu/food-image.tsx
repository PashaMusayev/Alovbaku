import Image from "next/image";

interface Props {
  src: string | null;
  alt: string;
  /** Emoji shown on the placeholder until a real photo is uploaded. */
  fallbackIcon: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  muted?: boolean;
}

/** Every food image is 4:3, cropped with object-cover to fill the full card width. */
export function FoodImage({ src, alt, fallbackIcon, sizes, priority, className = "", muted }: Props) {
  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden bg-coal-800 ${muted ? "grayscale" : ""} ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_50%_100%,#ff5a1f55_0%,#8c1a1433_35%,transparent_70%),linear-gradient(160deg,#2b2420,#151211)]"
        >
          <span aria-hidden className="text-[clamp(2.5rem,12vw,4.5rem)] drop-shadow-[0_6px_18px_rgba(255,90,31,0.45)]">
            {fallbackIcon}
          </span>
        </div>
      )}
    </div>
  );
}
