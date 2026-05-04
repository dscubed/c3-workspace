"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import type { DragEndEvent, useSensors } from "@dnd-kit/core";
import type {
  TicketingFieldDraft,
  TicketingFieldType,
} from "@/lib/types/ticketing";
import type {
  ThemeColors,
  ThemeLayout,
  TicketTier,
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
import {
  EventFormContext,
  type EventFormContextValue,
} from "@/components/events/shared/EventFormContext";
import {
  EventCollabContext,
  type EventCollabContextValue,
} from "@/components/events/shared/EventCollabContext";
import { useAuthStore } from "@c3/auth";
import { useEventRealtime } from "@/lib/hooks/useEventRealtime";
import { useDocumentDark } from "@/lib/hooks/useDocumentDark";
import { useEventTicketing } from "@/lib/hooks/useEventTicketing";
import { useCheckoutFields } from "@/lib/hooks/useCheckoutFields";
import { useAttendeeData } from "@/lib/hooks/useAttendeeData";
import { fetchEvent } from "@/lib/api/fetchEvent";
import { createCheckoutSession } from "@/app/actions/checkout";
import { toast } from "sonner";
import useSWR from "swr";
import type { FieldGroup } from "@/lib/api/patchEvent";

/* ── Accent helpers ── */

const ACCENT_SOLID_MAP: Record<
  Exclude<EventTheme["accent"], "none" | "custom">,
  string
> = {
  yellow: "#eab308",
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#22c55e",
};

function getAccentColor(
  accent: EventTheme["accent"],
  customHex?: string,
): string | undefined {
  if (accent === "none") return undefined;
  if (accent === "custom") return customHex || "#888888";
  return ACCENT_SOLID_MAP[accent];
}

/* ── Context value ── */

export interface CheckoutContextValue {
  /* page-level */
  eventId: string;
  isLoading: boolean;
  isEditing: boolean;
  previewMode: boolean;
  setPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  eventName: string | null;
  /* theme */
  layout: ThemeLayout;
  theme: EventTheme;
  isDark: boolean;
  colors: ThemeColors;
  accentColor: string | undefined;
  accentGradient: string | undefined;
  solidBg: string | undefined;
  /* ticketing */
  ticketingEnabled: boolean;
  ticketingChanging: boolean;
  handleEnableTicketing: () => void;
  pricingCount: number;
  /* checkout fields (editor) */
  fields: TicketingFieldDraft[];
  addField: (type: TicketingFieldType) => void;
  updateField: (id: string, updated: TicketingFieldDraft) => void;
  removeField: (id: string) => void;
  dndSensors: ReturnType<typeof useSensors>;
  fieldIds: string[];
  handleFieldDragEnd: (event: DragEndEvent) => void;
  /* attendee data (preview) */
  user: { id: string; email?: string | undefined } | null;
  fillingMyData: boolean;
  getFieldValue: (ticketIndex: number, fieldKey: string) => string;
  setFieldValue: (ticketIndex: number, fieldKey: string, value: string) => void;
  handleBuyForMyself: (ticketIndex: number) => void;
  /* ticket selection */
  pricing: TicketTier[];
  selectedTier: TicketTier | null;
  effectiveSelectedTierId: string;
  setSelectedTierId: (id: string) => void;
  thumbnailUrl: string | null;
  quantity: number;
  setQuantity: (update: number | ((q: number) => number)) => void;
  activeTicketTab: string;
  setActiveTicketTab: (tab: string) => void;
  /* actions */
  handlePaymentStart: () => Promise<void>;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckoutContext(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx)
    throw new Error(
      "useCheckoutContext must be used within <CheckoutContext.Provider>",
    );
  return ctx;
}

export { CheckoutContext };

/* ── Provider ── */

interface CheckoutProviderProps {
  eventId: string;
  mode: "edit" | "preview";
  children: React.ReactNode;
}

export function CheckoutProvider({
  eventId,
  mode,
  children,
}: CheckoutProviderProps) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [previewMode, setPreviewMode] = useState(mode === "preview");
  const isEditing = !previewMode;

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
    attendeeData,
    user,
    getFieldValue,
    setFieldValue,
    handleBuyForMyself,
    fillingMyData,
  } = useAttendeeData();

  /* ── Load event data ── */
  const {
    data: eventData,
    mutate: mutateEvent,
    isLoading,
  } = useSWR(`/api/events/${eventId}`, () => fetchEvent(eventId), {
    revalidateOnFocus: false,
    onError: () => {
      toast.error("Failed to load event");
      router.push("/");
    },
  });

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

  /* ── Derived theme values ── */
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
  const solidBg =
    theme.layout === "card" && theme.bgColor ? theme.bgColor : undefined;

  /* ── Derived ticket values ── */
  const pricing = eventData?.formData.pricing ?? [];
  const defaultTierId = pricing[0]?.id ?? "";
  const effectiveSelectedTierId = selectedTierId || defaultTierId;
  const selectedTier =
    pricing.find((t) => t.id === effectiveSelectedTierId) ?? pricing[0] ?? null;
  const thumbnailUrl =
    eventData?.carouselImages?.[0]?.url ??
    eventData?.formData.imageUrls?.[0] ??
    null;

  /* ── Payment ── */
  const handlePaymentStart = useCallback(async () => {
    const tmpPriceId = "price_1THfJ6Gxt5610wKLTu9axFmL";
    await createCheckoutSession(
      eventId,
      tmpPriceId,
      attendeeData,
      fields,
      quantity,
    );
  }, [eventId, attendeeData, fields, quantity]);

  /* ── Checkout context value ── */
  const checkoutValue: CheckoutContextValue = useMemo(
    () => ({
      eventId,
      isLoading,
      isEditing,
      previewMode,
      setPreviewMode,
      eventName: eventData?.formData.name ?? null,
      layout: theme.layout,
      theme,
      isDark,
      colors,
      accentColor,
      accentGradient,
      solidBg,
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
      handlePaymentStart,
    }),
    [
      eventId,
      isLoading,
      isEditing,
      previewMode,
      eventData?.formData.name,
      theme,
      isDark,
      colors,
      accentColor,
      accentGradient,
      solidBg,
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
      handlePaymentStart,
    ],
  );

  /* ── Editor/form/collab context stubs (edit mode only, consumed by EditorToolbox) ── */
  const editorContextValue: EventEditorContextValue | null = useMemo(() => {
    if (mode !== "edit" || !eventData) return null;
    return {
      eventId,
      mode: "edit",
      initialUrlSlug: null,
      isVisitorPreview: false,
      previewMode,
      setPreviewMode,
      viewMode: previewMode ? ("preview" as const) : ("edit" as const),
      isEditing,
      theme,
      setTheme: () => {},
      colors,
      isDark,
      hasName: !!eventData.formData.name,
      isAutoSaving: savingFields,
      lastSavedAt,
      draftSaved: true,
      eventStatus: (eventData.status ?? "draft") as
        | "draft"
        | "published"
        | "archived",
      savingPublish: false,
      handleBack: () => router.replace(`/events/${eventId}/edit`),
      handlePublish: () => {},
      handleUnpublish: () => {},
      ticketingEnabled,
      ticketingChanging,
      enableTicketing: handleEnableTicketing,
      disableTicketing: handleDisableTicketing,
      openPricingModalRef: { current: () => {} },
      checklistRefsRef: { current: {} },
    };
  }, [
    mode,
    eventId,
    previewMode,
    isEditing,
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
  ]);

  const formContextValue: EventFormContextValue | null = useMemo(() => {
    if (mode !== "edit" || !eventData) return null;
    const noop = () => {};
    const noopAsync = async () => {};
    return {
      form: eventData.formData as EventFormData,
      setForm: noop as never,
      updateField: noop,
      carouselImages: eventData.carouselImages ?? [],
      updateImages: noop,
      setCarouselImages: noop as never,
      hostsData: [],
      setHostsData: noop as never,
      creatorProfile: (profile ?? {}) as ClubProfile,
      sections: [],
      setSections: noop as never,
      theme,
      setTheme: noop,
      colors,
      isDark,
      accentGradient,
      markDirty: noop,
      flush: noopAsync,
      broadcastRef: { current: noop },
      draftSaved: true,
      isAutoSaving: savingFields,
      lastSavedAt,
    };
  }, [
    mode,
    eventData,
    profile,
    savingFields,
    lastSavedAt,
    theme,
    colors,
    isDark,
    accentGradient,
  ]);

  const collabContextValue: EventCollabContextValue | null = useMemo(() => {
    if (mode !== "edit") return null;
    return {
      collaborators,
      getFieldLock: () => ({ locked: false }),
      handleFieldFocus: () => {},
      handleFieldBlur: () => {},
      clearFocus: () => {},
    };
  }, [mode, collaborators]);

  const wrapped = (
    <CheckoutContext.Provider value={checkoutValue}>
      {children}
    </CheckoutContext.Provider>
  );

  if (editorContextValue && formContextValue && collabContextValue) {
    return (
      <EventEditorContext.Provider value={editorContextValue}>
        <EventCollabContext.Provider value={collabContextValue}>
          <EventFormContext.Provider value={formContextValue}>
            {wrapped}
          </EventFormContext.Provider>
        </EventCollabContext.Provider>
      </EventEditorContext.Provider>
    );
  }

  return wrapped;
}
