import { useInstagramMedia } from "@/lib/hooks/dashboard/media/useInstagramMedia";
import { useState } from "react";
import { MediaGridSkeleton } from "../MediaGridSkeleton";
import { MediaTabBar } from "../MediaTabBar";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { IgLightbox } from "./IgLightbox";

export function InstagramTabContent({
  effectiveClubId,
}: {
  effectiveClubId: string | null;
}) {
  const { images, isLoading } = useInstagramMedia(effectiveClubId);
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <MediaTabBar />

      {isLoading ? (
        <MediaGridSkeleton />
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p className="text-sm">No Instagram media</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((item, i) => (
            <div
              key={`${item.post_id}-${i}`}
              onClick={() => setLightbox(i)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:border-gray-300 transition-all"
            >
              <Image
                src={item.image_url}
                alt="Instagram"
                fill
                className="object-cover hover:scale-105 transition-transform"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <IgLightbox
          items={images}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
