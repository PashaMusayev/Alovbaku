import Image from "next/image";
import clsx from "clsx";
import type { FoodArt as FoodArtKind } from "@/lib/types";
import { FoodArt } from "./FoodArt";

/** Every menu image is rendered at a fixed 4:3 ratio with object-cover. */
export function FoodImage({
  src,
  art,
  alt,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  className,
}: {
  src: string | null;
  art: FoodArtKind;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("relative aspect-[4/3] overflow-hidden bg-coal-700", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <FoodArt kind={art} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
