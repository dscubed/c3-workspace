"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Instagram, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useAuthStore } from "@c3/auth";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { AdminClubSelector } from "@/components/dashboard/AdminClubSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarStack } from "@/components/shared/AvatarStack";
import type { AvatarProfile } from "@/lib/types/events";

interface InstagramPost {
  id: string;
  posted_by: string;
  caption: string;
  timestamp: number | null;
  location: string | null;
  images: string[];
  collaborators: string[] | null;
  fetched_at: string;
}

interface SlugProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  slug: string;
}

function formatTs(ts: number | null) {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Lightbox ── */
function Lightbox({
  posts,
  startPost,
  startImg,
  slugToProfile,
  onClose,
}: {
  posts: InstagramPost[];
  startPost: number;
  startImg: number;
  slugToProfile: Record<string, SlugProfile>;
  onClose: () => void;
}) {
  const [postIdx, setPostIdx] = useState(startPost);
  const [imgIdx, setImgIdx] = useState(startImg);

  const post = posts[postIdx];
  const images = post.images ?? [];
  const imgCount = images.length;

  const involvedSlugs = [post.posted_by, ...(post.collaborators ?? [])];
  const clubProfiles: AvatarProfile[] = involvedSlugs
    .map((slug) => slugToProfile[slug])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      first_name: p.first_name,
      avatar_url: p.avatar_url,
    }));

  const prevImg = useCallback(() => setImgIdx((i) => Math.max(0, i - 1)), []);
  const nextImg = useCallback(
    () => setImgIdx((i) => Math.min(imgCount - 1, i + 1)),
    [imgCount],
  );
  const prevPost = useCallback(() => {
    setPostIdx((i) => Math.max(0, i - 1));
    setImgIdx(0);
  }, []);
  const nextPost = useCallback(() => {
    setPostIdx((i) => Math.min(posts.length - 1, i + 1));
    setImgIdx(0);
  }, [posts.length]);

  // Touch swipe within images
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(delta) > 40) delta < 0 ? nextImg() : prevImg();
    startX.current = null;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") imgIdx > 0 ? prevImg() : prevPost();
      if (e.key === "ArrowRight")
        imgIdx < imgCount - 1 ? nextImg() : nextPost();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [imgIdx, imgCount, onClose, prevImg, nextImg, prevPost, nextPost]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center py-12"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev post */}
      {postIdx > 0 && (
        <button
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            prevPost();
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Image area — inline-block so wrapper shrinks to actual image size, arrows sit on image */}
      <div
        className="relative"
        style={{ display: "inline-block" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[imgIdx]}
            alt={post.caption || "Instagram post"}
            style={{
              maxHeight: "60vh",
              maxWidth: "calc(100vw - 96px)",
              display: "block",
            }}
          />
        )}

        {/* Prev / next image — on the image itself */}
        {imgIdx > 0 && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
            onClick={prevImg}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {imgIdx < imgCount - 1 && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
            onClick={nextImg}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Image dots */}
        {imgCount > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post meta */}
      <div
        className="mt-3 w-full space-y-1.5"
        style={{ maxWidth: "min(512px, calc(100vw - 96px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {clubProfiles.length > 0 && (
              <AvatarStack profiles={clubProfiles} limit={3} size="sm" />
            )}
            <p className="text-white/80 text-sm font-semibold truncate">
              @{post.posted_by}
              {involvedSlugs.length > 1 && (
                <span className="text-white/50 font-normal">
                  {" "}
                  + {involvedSlugs.length - 1} other
                  {involvedSlugs.length > 2 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
        {post.caption && (
          <p className="text-white/70 text-xs line-clamp-3">{post.caption}</p>
        )}
        <div className="flex items-center gap-3 text-white/40 text-xs">
          {post.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {post.location}
            </span>
          )}
          {formatTs(post.timestamp) && <span>{formatTs(post.timestamp)}</span>}
        </div>
      </div>

      {/* Next post */}
      {postIdx < posts.length - 1 && (
        <button
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            nextPost();
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/* ── Post card ── */
function PostCard({
  post,
  slugToProfile,
  onClick,
}: {
  post: InstagramPost;
  slugToProfile: Record<string, SlugProfile>;
  onClick: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);
  const images = post.images ?? [];
  const count = images.length;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + count) % count);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % count);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(delta) > 40)
      delta < 0
        ? setIdx((i) => (i + 1) % count)
        : setIdx((i) => (i - 1 + count) % count);
    startX.current = null;
  };

  // Build avatar profiles for all clubs involved (poster + collaborators)
  const involvedSlugs = [post.posted_by, ...(post.collaborators ?? [])];
  const clubProfiles: AvatarProfile[] = involvedSlugs
    .map((slug) => slugToProfile[slug])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      first_name: p.first_name,
      avatar_url: p.avatar_url,
    }));

  return (
    <div
      className="flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-square bg-gray-100 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <Image
            src={images[idx]}
            alt={post.caption || "Instagram post"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Instagram className="h-8 w-8 text-gray-300" />
          </div>
        )}

        {count > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-0.5 hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-0.5 hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i);
                  }}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {clubProfiles.length > 0 && (
            <div className="flex items-center gap-1.5 min-w-0">
              <AvatarStack profiles={clubProfiles} limit={3} size="sm" />
              <p className="text-[11px] text-muted-foreground truncate">
                @{post.posted_by}
                {involvedSlugs.length > 1 &&
                  ` + ${involvedSlugs.length - 1} other${involvedSlugs.length > 2 ? "s" : ""}`}
              </p>
            </div>
          )}
          {count > 1 && (
            <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
              {idx + 1}/{count}
            </span>
          )}
        </div>
        {post.caption && (
          <p className="text-xs text-foreground line-clamp-2">{post.caption}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {post.location && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {post.location}
            </p>
          )}
          {formatTs(post.timestamp) && (
            <p className="text-[10px] text-muted-foreground">
              {formatTs(post.timestamp)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InstagramPage() {
  const { user, isOrganisation } = useAuthStore();
  const isOrg = isOrganisation();
  const {
    clubs,
    selectedClubId,
    setSelectedClubId,
    loading: clubsLoading,
  } = useAdminClubSelector();
  const effectiveClubId = isOrg ? (user?.id ?? null) : selectedClubId;

  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [slugToProfile, setSlugToProfile] = useState<
    Record<string, SlugProfile>
  >({});
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{
    postIdx: number;
    imgIdx: number;
  } | null>(null);

  useEffect(() => {
    if (!effectiveClubId) return;
    setLoading(true);
    const params = new URLSearchParams({ club_id: effectiveClubId });
    fetch(`/api/media/instagram/posts?${params}`)
      .then((r) => r.json())
      .then(({ data, slugToProfile: stp }) => {
        setPosts(data || []);
        setSlugToProfile(stp || {});
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [effectiveClubId]);

  const isSpinning = clubsLoading || loading;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-2">
          <h1 className="text-2xl font-bold">Instagram</h1>
          {posts.length > 0 && (
            <span className="text-sm text-muted-foreground pb-1">
              ({posts.length} posts)
            </span>
          )}
        </div>
        {!isOrg && (
          <AdminClubSelector
            clubs={clubs}
            selectedClubId={selectedClubId}
            onSelect={setSelectedClubId}
          />
        )}
      </div>

      {isSpinning ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-gray-200 overflow-hidden"
            >
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Instagram className="h-10 w-10 opacity-30" />
            <p className="text-sm">No Instagram posts found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              slugToProfile={slugToProfile}
              onClick={() => setLightbox({ postIdx: i, imgIdx: 0 })}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          posts={posts}
          startPost={lightbox.postIdx}
          startImg={lightbox.imgIdx}
          slugToProfile={slugToProfile}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
