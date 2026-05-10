"use client";

import { useMemo } from "react";
import { ImageCarousel } from "../create/image/ImageCarousel";
import { ImageCarouselPreview } from "../preview/ImageCarouselPreview";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

interface EventImageFieldProps {
  onEditClick?: () => void;
}

export function EventImageField({ onEditClick }: EventImageFieldProps) {
  const { viewMode } = useEventEditor();
  const { carouselImages } = useEventForm();
  const urls = useMemo(
    () => carouselImages.filter((i) => i.url && !i.uploading).map((i) => i.url),
    [carouselImages],
  );

  if (viewMode === "preview") {
    return <ImageCarouselPreview value={urls} />;
  }

  return (
    <ImageCarousel
      images={carouselImages}
      onEditClick={onEditClick ?? (() => {})}
    />
  );
}
