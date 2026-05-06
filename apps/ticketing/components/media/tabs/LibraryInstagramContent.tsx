"use client";

import { Loader2, Instagram, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useInstagramPosts } from "@/lib/hooks/dashboard/media/useInstagramPosts";

interface LibraryInstagramContentProps {
  selected: Set<string>;
  onSelect: (url: string) => void;
  clubId: string | null;
  clubsLoading: boolean;
}

export function LibraryInstagramContent({
  selected,
  onSelect,
  clubId,
  clubsLoading,
}: LibraryInstagramContentProps) {
  const { posts, isLoading: instagramLoading } = useInstagramPosts(clubId);
  if (instagramLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clubId && !clubsLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Instagram className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          You are not an admin of any clubs.
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Instagram className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-muted-foreground">
            No Instagram posts found
          </p>
          <p className="text-sm text-muted-foreground/60">
            Images from your club&apos;s Instagram posts will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 pb-3">
        <p className="text-sm text-muted-foreground">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-[50vh] overflow-y-auto pr-1">
        {posts.flatMap((post) =>
          post.images.map((imageUrl) => {
            const isSelected = selected.has(imageUrl);
            return (
              <div
                key={imageUrl}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/30",
                )}
                onClick={() => onSelect(imageUrl)}
                title={post.caption || undefined}
              >
                <Image
                  src={imageUrl}
                  alt={post.caption || "Instagram image"}
                  fill
                  className="object-cover"
                  sizes="150px"
                />

                {isSelected && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>
    </>
  );
}
