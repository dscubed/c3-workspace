"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type {
  EventFormData,
  CarouselImage,
  ClubProfile,
  EventTheme,
} from "@/components/events/shared/types";
import {
  DEFAULT_THEME,
  getThemeColors,
  getAccentGradient,
} from "@/components/events/shared/types";
import { FIELD_TO_GROUP } from "@/lib/schemas/event";
import type { SectionData } from "@/components/events/sections/types";
import type { FetchedEventData } from "@/lib/api/fetchEvent";
import { useDocumentDark } from "./useDocumentDark";

interface UseEventFormStateOptions {
  /** Fetched event data (edit mode). Individual fields are derived from this. */
  data?: FetchedEventData;
}

/** Core form-data state: form fields, images, sections, hosts, theme. */
export function useEventFormState({ data }: UseEventFormStateOptions) {
  const initialData = data?.formData;
  const existingImages = data?.existingImages;
  const initialCarouselImages = data?.carouselImages;
  const initialHostsData = data?.hostsData;
  const initialSections = data?.sections;

  /* ── Form data ── */
  const [form, setForm] = useState<EventFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    timezone:
      initialData?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    venues:
      initialData?.venues && initialData.venues.length > 0
        ? initialData.venues
        : [
            {
              id: crypto.randomUUID(),
              type: "tba" as const,
              location: { displayName: "", address: "" },
            },
          ],
    occurrences: initialData?.occurrences ?? [],
    category: initialData?.category ?? "",
    tags: initialData?.tags ?? [],
    hostIds: initialData?.hostIds ?? [],
    imageUrls: [], // always derived from carouselImages — see below
    pricing: initialData?.pricing ?? [],
    eventCapacity: initialData?.eventCapacity ?? null,
    links: initialData?.links ?? [],
    theme: initialData?.theme ?? { ...DEFAULT_THEME },
  });

  const [hostsData, setHostsData] = useState<ClubProfile[]>(
    initialHostsData ?? [],
  );
  const [sections, setSections] = useState<SectionData[]>(
    initialSections ?? [],
  );

  /* ── Images ── */
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(
    () =>
      initialCarouselImages ??
      (existingImages ?? []).map((url, i) => ({
        id: `existing-${i}`,
        url,
      })),
  );

  /* ── Theme ── */
  /**
   * `setTheme` writes directly into form.theme — no separate state, no useEffect.
   * Callers that also need to mark the field dirty (e.g. EventForm) should call
   * markDirty("theme") after setTheme.
   */
  const setTheme = (t: EventTheme) =>
    setForm((prev) => ({ ...prev, theme: t }));

  /* ── imageUrls derived from carouselImages (no useEffect needed) ── */
  const imageUrls = carouselImages
    .filter((i) => i.url && !i.uploading)
    .map((i) => i.url);

  // Merge derived imageUrls into form so consumers always get a consistent view.
  const formWithImages: EventFormData = { ...form, imageUrls };

  /* ── Derived theme values ── */
  const colors = useMemo(
    () => getThemeColors(form.theme.mode),
    [form.theme.mode],
  );
  const isDark = colors.isDark;
  useDocumentDark(isDark);

  const accentGradient = useMemo(
    () => getAccentGradient(form.theme.accent, isDark, form.theme.accentCustom),
    [form.theme.accent, form.theme.accentCustom, isDark],
  );

  /* ── Refs for auto-save to read latest state without closures ── */
  const formRef = useRef<EventFormData>(formWithImages);
  const carouselImagesRef = useRef<CarouselImage[]>(carouselImages);
  const sectionsRef = useRef<SectionData[]>(sections);

  // Keep refs in sync after every render so auto-save callbacks always
  // read the latest state without stale closures.
  useEffect(() => {
    formRef.current = formWithImages;
    carouselImagesRef.current = carouselImages;
    sectionsRef.current = sections;
  });

  return {
    form: formWithImages,
    setForm,
    hostsData,
    setHostsData,
    sections,
    setSections,
    carouselImages,
    setCarouselImages,
    theme: form.theme,
    setTheme,
    colors,
    isDark,
    accentGradient,
    FIELD_TO_GROUP,
    formRef,
    carouselImagesRef,
    sectionsRef,
  };
}
