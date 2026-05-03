"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { fetchEvent } from "@/lib/api/fetchEvent";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import type {
  ThemeAccent,
  EventTheme,
  ClubProfile,
  EventFormData,
} from "@/components/events/shared/types";
import {
  getThemeColors,
  getAccentGradient,
} from "@/components/events/shared/types";
import {
  EventEditorContext,
  type EventEditorContextValue,
} from "@/components/events/shared/EventEditorContext";
import { CheckoutContext } from "./CheckoutContext";
import { EditorToolbox } from "@/components/events/shared/EditorToolbox";
import { useAuthStore } from "@c3/auth";
import { useEventRealtime } from "@/lib/hooks/useEventRealtime";
import { useDocumentDark } from "@/lib/hooks/useDocumentDark";
import { useEventTicketing } from "@/lib/hooks/useEventTicketing";
import { useCheckoutFields } from "@/lib/hooks/useCheckoutFields";
import { useAttendeeData } from "@/lib/hooks/useAttendeeData";
import type { FieldGroup } from "@/lib/api/patchEvent";
import { createCheckoutSession } from "@/app/actions/checkout";
import { toast } from "sonner";
import { CheckoutEditor } from "./CheckoutEditor";
import { CheckoutPreview } from "./CheckoutPreview";

const ACCENT_SOLID_MAP: Record<
  Exclude<ThemeAccent, "none" | "custom">,
  string
> = {
  yellow: "#eab308",
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#22c55e",
};

function getAccentColor(
  accent: ThemeAccent,
  customHex?: string,
): string | undefined {
  if (accent === "none") return undefined;
  if (accent === "custom") return customHex || "#888888";
  return ACCENT_SOLID_MAP[accent];
}

interface CheckoutFormProps {
  eventId: string;
  mode: "edit" | "preview";
}

export default function CheckoutForm({ eventId, mode }: CheckoutFormProps) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [previewMode, setPreviewMode] = useState(mode === "preview");
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  /* ── Ticket selection ── */
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [quantity, _setQuantity] = useState(1);
  const [activeTicketTab, setActiveTicketTab] = useState("ticket-0");

  const setQuantity = useCallback(
    (update: number | ((q: number) => number)) => {
      _setQuantity(update);
      setActiveTicketTab("ticket-0");
    },
    [],
  );

  /* ── Attendee data ── */
  const {
    user,
    attendeeData,
    getFieldValue,
    setFieldValue,
    handleBuyForMyself,
    fillingMyData,
  } = useAttendeeData();

  console.log(attendeeData);
  const isEditing = !previewMode;

  /* ── Load event data via SWR ── */
  const { data: eventData, mutate: mutateEvent, isLoading } = useSWR(
    `/api/events/${eventId}`,
    () => fetchEvent(eventId),
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error("Failed to load event");
        router.push("/");
      },
    },
  );

  /* ── Realtime sync ── */
  const onRemoteChange = useCallback(
    (groups: FieldGroup[]) => {
      if (groups.length > 0) mutateEvent();
    },
    [mutateEvent],
  );

  const { broadcast, collaborators } = useEventRealtime({
    eventId,
    userId: profile?.id,
    userName: profile?.first_name ?? undefined,
    enabled: mode === "edit" && !!profile?.id,
    onRemoteChange,
  });

  /* ── Ticketing ── */
  const {
    ticketingEnabled,
    ticketingChanging,
    enableTicketing: handleEnableTicketing,
    disableTicketing: handleDisableTicketing,
  } = useEventTicketing({
    eventId,
    initialEnabled: eventData?.ticketingEnabled ?? false,
    pricingCount: eventData?.formData.pricing?.length ?? 0,
  });

  /* ── Checkout fields ── */
  const {
    fields,
    addField,
    updateField,
    removeField,
    savingFields,
    lastSavedAt,
    flushFields,
    dndSensors,
    fieldIds,
    handleFieldDragEnd,
  } = useCheckoutFields({ eventId, mode, broadcast });

  /* ── Derived values ── */
  const defaultTierId = eventData?.formData.pricing?.[0]?.id ?? "";
  const effectiveSelectedTierId = selectedTierId || defaultTierId;

  const theme: EventTheme = useMemo(
    () =>
      eventData?.formData.theme ?? {
        mode: "adaptive" as const,
        layout: "card" as const,
        accent: "none" as const,
      },
    [eventData?.formData.theme],
  );
  const colors = useMemo(() => getThemeColors(theme.mode), [theme.mode]);
  const isDark = colors.isDark;
  useDocumentDark(isDark);
  const accentColor = getAccentColor(theme.accent, theme.accentCustom);
  const accentGradient = useMemo(
    () => getAccentGradient(theme.accent, isDark, theme.accentCustom),
    [theme.accent, theme.accentCustom, isDark],
  );

  const pricing = eventData?.formData.pricing ?? [];
  const thumbnailUrl =
    eventData?.carouselImages?.[0]?.url ??
    eventData?.formData.imageUrls?.[0] ??
    null;
  const selectedTier =
    pricing.find((t) => t.id === effectiveSelectedTierId) ?? pricing[0] ?? null;

  /* ── Editor context (edit mode only) ── */
  const editorContext: EventEditorContextValue | null = useMemo(() => {
    if (mode !== "edit" || !eventData) return null;
    return {
      eventId,
      mode: "edit",
      initialUrlSlug: null,
      previewMode,
      setPreviewMode,
      viewMode: previewMode ? ("preview" as const) : ("edit" as const),
      isEditing: !previewMode,
      toolbarCollapsed,
      setToolbarCollapsed,
      markDirty: () => {},
      flush: flushFields,
      isAutoSaving: savingFields,
      lastSavedAt,
      eventStatus: (eventData.status ?? "draft") as
        | "draft"
        | "published"
        | "archived",
      savingPublish: false,
      draftSaved: true,
      ticketingEnabled,
      ticketingChanging,
      handleBack: () => router.replace(`/events/${eventId}/edit`),
      handlePublish: () => {},
      handleUnpublish: () => {},
      enableTicketing: handleEnableTicketing,
      disableTicketing: handleDisableTicketing,
      theme,
      setTheme: () => {},
      setThemeOpen: () => {},
      colors,
      isDark,
      hasName: !!eventData.formData.name,
      form: eventData.formData as EventFormData,
      setForm: () => {},
      updateField: () => {},
      carouselImages: eventData.carouselImages ?? [],
      hostsData: [],
      setHostsData: () => {},
      creatorProfile: (profile ?? {}) as ClubProfile,
      collaborators,
      getFieldLock: () => ({ locked: false }),
      handleFieldFocus: () => {},
      handleFieldBlur: () => {},
    };
  }, [
    mode,
    eventId,
    previewMode,
    toolbarCollapsed,
    flushFields,
    savingFields,
    lastSavedAt,
    ticketingEnabled,
    ticketingChanging,
    handleEnableTicketing,
    handleDisableTicketing,
    router,
    theme,
    colors,
    isDark,
    eventData,
    profile,
    collaborators,
  ]);

  /* ── Checkout context (always provided) ── */
  const checkoutContext = useMemo(
    () => ({
      layout: theme.layout,
      isDark,
      colors,
      accentColor,
      ticketingEnabled,
      ticketingChanging,
      handleEnableTicketing,
      pricingCount: pricing.length,
      fields,
      addField,
      updateField,
      removeField,
      dndSensors,
      fieldIds,
      handleFieldDragEnd,
      user,
      fillingMyData,
      getFieldValue,
      setFieldValue,
      handleBuyForMyself,
      pricing,
      selectedTier,
      effectiveSelectedTierId,
      setSelectedTierId,
      thumbnailUrl,
      quantity,
      setQuantity,
      activeTicketTab,
      setActiveTicketTab,
    }),
    [
      theme.layout,
      isDark,
      colors,
      accentColor,
      ticketingEnabled,
      ticketingChanging,
      handleEnableTicketing,
      pricing,
      fields,
      addField,
      updateField,
      removeField,
      dndSensors,
      fieldIds,
      handleFieldDragEnd,
      user,
      fillingMyData,
      getFieldValue,
      setFieldValue,
      handleBuyForMyself,
      selectedTier,
      effectiveSelectedTierId,
      thumbnailUrl,
      quantity,
      setQuantity,
      activeTicketTab,
      setActiveTicketTab,
    ],
  );

  if (isLoading || !eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pageBgClass = colors.pageBg;
  const pageTextClass = colors.text;
  const solidBg =
    theme.layout === "card" && theme.bgColor ? theme.bgColor : undefined;

  // TODO remove this once we have dynamic price ids set up
  const tmpPriceId = "price_1THfJ6Gxt5610wKLTu9axFmL";

  const handlePaymentStart = async () => {
    await createCheckoutSession(eventId, tmpPriceId, attendeeData, fields, quantity);
  };

  const content = (
    <div
      className={cn("min-h-screen pb-12", pageBgClass, isDark && "dark")}
      style={solidBg ? { backgroundColor: solidBg } : undefined}
    >
      {mode !== "preview" && <EditorToolbox />}

      {mode === "preview" && (
        <div className="fixed top-0 left-0 right-0 z-50 px-3 py-2 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2",
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-black/60 hover:text-black hover:bg-black/10",
            )}
            onClick={() => router.push(`/events/${eventId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Button>
        </div>
      )}

      <div style={accentGradient ? { background: accentGradient } : undefined}>
        <div
          className={cn(
            "mx-auto max-w-3xl px-3 sm:px-6",
            mode === "preview" ? "py-6 sm:py-8 pt-10" : "py-6 sm:py-8",
            pageTextClass,
          )}
        >
          {mode !== "preview" && <div className="h-14" />}

          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Checkout
            </h1>
            {eventData.formData.name && (
              <p className={cn("mt-1 text-sm", colors.textMuted)}>
                {eventData.formData.name}
              </p>
            )}
          </div>

          {isEditing && <CheckoutEditor />}
          {!isEditing && <CheckoutPreview />}

          {(ticketingEnabled || mode === "preview") && (
            <div className="mt-8">
              <SectionWrapper
                title="Payment"
                layout={theme.layout}
                isDark={isDark}
              >
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CreditCard
                    className={cn("h-10 w-10 opacity-40", colors.textMuted)}
                  />
                  <div>
                    <Button onClick={handlePaymentStart}>Test Payment</Button>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const withCheckout = (
    <CheckoutContext.Provider value={checkoutContext}>
      {content}
    </CheckoutContext.Provider>
  );

  if (editorContext) {
    return (
      <EventEditorContext.Provider value={editorContext}>
        {withCheckout}
      </EventEditorContext.Provider>
    );
  }

  return withCheckout;
}
