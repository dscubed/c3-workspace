"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { format, addMonths, parseISO } from "date-fns";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { OccurrenceFormData, Venue } from "../../../shared/types";
import {
  type Frequency,
  type OccFormState,
  EMPTY_FORM,
  buildRepeatOccurrences,
} from "../occurrenceUtils";
import { MonthGrid } from "./MonthGrid";
import { OccurrenceList } from "./OccurrenceList";
import { VenuePicker } from "./VenuePicker";

type FocusedDateField = "startDate" | "endDate" | "repeatUntil" | null;

interface OccurrenceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrences: OccurrenceFormData[];
  timezone: string;
  venues: Venue[];
  onChange: (occurrences: OccurrenceFormData[]) => void;
}

export function OccurrenceEditor({
  open,
  onOpenChange,
  occurrences,
  venues,
  onChange,
}: OccurrenceEditorProps) {
  const [local, setLocal] = useState<OccurrenceFormData[]>(occurrences);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  // null = idle, "add" = adding new, string = editing by ID
  const [panelMode, setPanelMode] = useState<null | "add" | string>(null);
  const [form, setForm] = useState<OccFormState>(EMPTY_FORM);
  const focusedDateField = useRef<FocusedDateField>(null);

  const editingId =
    panelMode !== null && panelMode !== "add" ? panelMode : null;

  const patchForm = useCallback(
    (patch: Partial<OccFormState>) =>
      setForm((prev) => ({ ...prev, ...patch })),
    [],
  );

  const resetPanel = useCallback(() => {
    setPanelMode(null);
    setForm(EMPTY_FORM);
  }, []);

  const openAddPanel = useCallback(
    (dateStr?: string) => {
      setPanelMode("add");
      setForm({
        ...EMPTY_FORM,
        startDate: dateStr ?? "",
        venueIds: venues.length === 1 ? [venues[0].id] : [],
      });
    },
    [venues],
  );

  const openEditPanel = useCallback((occ: OccurrenceFormData) => {
    setPanelMode(occ.id);
    setForm({
      name: occ.name ?? "",
      startDate: occ.startDate,
      startTime: occ.startTime,
      endDate: occ.endDate,
      endTime: occ.endTime,
      frequency: "once",
      repeatUntil: "",
      venueIds: occ.venueIds ?? [],
    });
    try {
      setCurrentMonth(parseISO(occ.startDate));
    } catch {
      // ignore invalid date
    }
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setLocal(occurrences);
        resetPanel();
        setCurrentMonth(new Date());
      }
      onOpenChange(isOpen);
    },
    [occurrences, onOpenChange, resetPanel],
  );

  const dateOccMap = useMemo(() => {
    const map = new Map<string, OccurrenceFormData[]>();
    for (const o of local) {
      const existing = map.get(o.startDate) ?? [];
      existing.push(o);
      map.set(o.startDate, existing);
    }
    return map;
  }, [local]);

  const prevMonth = useCallback(
    () => setCurrentMonth((m) => addMonths(m, -1)),
    [],
  );
  const nextMonth = useCallback(
    () => setCurrentMonth((m) => addMonths(m, 1)),
    [],
  );

  // Small delay so blur fires before calendar mousedown steals focus
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onDateFieldFocus(field: FocusedDateField) {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    focusedDateField.current = field;
  }

  function onDateFieldBlur() {
    blurTimeout.current = setTimeout(() => {
      focusedDateField.current = null;
    }, 200);
  }

  function handleDayClick(dateStr: string) {
    const focused = focusedDateField.current;

    if (focused === "startDate") {
      patchForm({
        startDate: dateStr,
        ...(form.endDate && form.endDate < dateStr ? { endDate: dateStr } : {}),
      });
      return;
    }
    if (focused === "endDate") {
      patchForm({
        endDate: dateStr < form.startDate ? form.startDate : dateStr,
      });
      return;
    }
    if (focused === "repeatUntil") {
      patchForm({ repeatUntil: dateStr });
      return;
    }

    const dayOccs = dateOccMap.get(dateStr);
    if (dayOccs && dayOccs.length > 0) {
      if (dayOccs.length === 1) {
        openEditPanel(dayOccs[0]);
      } else {
        openAddPanel(dateStr);
      }
    } else {
      openAddPanel(dateStr);
    }
  }

  function handleAdd() {
    if (!form.startDate) return;
    const newOccs =
      form.frequency === "once"
        ? [
            {
              id: crypto.randomUUID(),
              name: form.name.trim() || undefined,
              startDate: form.startDate,
              startTime: form.startTime,
              endDate: form.endDate,
              endTime: form.endTime,
              venueIds: form.venueIds.length > 0 ? form.venueIds : undefined,
            },
          ]
        : buildRepeatOccurrences(form);
    setLocal((prev) => [...prev, ...newOccs]);
    resetPanel();
  }

  function handleUpdate() {
    if (!editingId || !form.startDate) return;
    setLocal((prev) =>
      prev.map((o) =>
        o.id === editingId
          ? {
              ...o,
              name: form.name.trim() || undefined,
              startDate: form.startDate,
              startTime: form.startTime,
              endDate: form.endDate,
              endTime: form.endTime,
              venueIds: form.venueIds.length > 0 ? form.venueIds : undefined,
            }
          : o,
      ),
    );
    resetPanel();
  }

  function handleDelete() {
    if (!editingId) return;
    setLocal((prev) => prev.filter((o) => o.id !== editingId));
    resetPanel();
  }

  function handleSave() {
    onChange(local);
    onOpenChange(false);
  }

  const nonTbaVenues = venues.filter((v) => v.type !== "tba");

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Manage occurrences"
      className="sm:max-w-5xl"
    >
      <div className="flex max-h-[80vh] flex-col gap-4 sm:flex-row sm:gap-0">
        {/* ═══ LEFT: Calendar ═══ */}
        <div className="min-w-0 flex-1 overflow-y-auto sm:border-r sm:pr-0">
          <div className="flex items-center justify-between px-2 pb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-md p-1.5 transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-md p-1.5 transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <MonthGrid
            month={currentMonth}
            occurrencesByDate={dateOccMap}
            selectedDate={form.startDate || null}
            editingId={editingId}
            onDayClick={handleDayClick}
            onOccurrenceClick={openEditPanel}
          />
        </div>

        {/* ═══ RIGHT: Panel ═══ */}
        <div className="w-full shrink-0 space-y-4 overflow-y-auto border-t pt-4 sm:w-80 sm:border-t-0 sm:pl-5 sm:pt-0">
          {panelMode === null ? (
            <OccurrenceList
              occurrences={local}
              venues={venues}
              onSelect={openEditPanel}
              onAdd={() => openAddPanel()}
            />
          ) : (
            <>
              <h3 className="text-sm font-semibold">
                {editingId ? "Edit occurrence" : "Add occurrences"}
              </h3>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <Label className="text-xs">
                    Name{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Pitch Day, Competition Day 1"
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                  />
                </div>

                {/* Start */}
                <div>
                  <Label className="text-xs">
                    Start from <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      type="date"
                      value={form.startDate}
                      onFocus={() => onDateFieldFocus("startDate")}
                      onBlur={onDateFieldBlur}
                      onChange={(e) =>
                        patchForm({
                          startDate: e.target.value,
                          ...(form.endDate && form.endDate < e.target.value
                            ? { endDate: e.target.value }
                            : {}),
                        })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => patchForm({ startTime: e.target.value })}
                      placeholder="Optional"
                      className="w-28"
                    />
                  </div>
                </div>

                {/* End */}
                <div>
                  <Label className="text-xs">End at</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      type="date"
                      value={form.endDate}
                      min={form.startDate}
                      onFocus={() => onDateFieldFocus("endDate")}
                      onBlur={onDateFieldBlur}
                      onChange={(e) => patchForm({ endDate: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => patchForm({ endTime: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>

                {/* Frequency — add mode only */}
                {!editingId && (
                  <>
                    <div>
                      <Label className="text-xs">
                        How often will this time slot occur?
                      </Label>
                      <Tabs
                        value={form.frequency}
                        onValueChange={(v) =>
                          patchForm({ frequency: v as Frequency })
                        }
                        className="mt-1"
                      >
                        <TabsList className="w-full">
                          {(
                            ["once", "daily", "weekly", "monthly"] as const
                          ).map((f) => (
                            <TabsTrigger
                              key={f}
                              value={f}
                              className="flex-1 capitalize text-xs"
                            >
                              {f}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>

                    {form.frequency !== "once" && (
                      <div>
                        <Label className="text-xs">
                          Repeat until{" "}
                          <span className="font-normal text-muted-foreground">
                            (click a date on the calendar)
                          </span>
                        </Label>
                        <Input
                          type="date"
                          value={form.repeatUntil}
                          min={form.startDate}
                          onFocus={() => onDateFieldFocus("repeatUntil")}
                          onBlur={onDateFieldBlur}
                          onChange={(e) =>
                            patchForm({ repeatUntil: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Venue picker */}
                {nonTbaVenues.length > 0 && (
                  <div>
                    <Label className="text-xs">Venue(s)</Label>
                    <div className="mt-1">
                      <VenuePicker
                        venues={nonTbaVenues}
                        selectedIds={form.venueIds}
                        onChange={(ids) => patchForm({ venueIds: ids })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPanel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {editingId ? (
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={!form.startDate}
                    className="flex-1"
                  >
                    Update
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={!form.startDate}
                    className="flex-1"
                  >
                    Add
                  </Button>
                )}
              </div>

              {editingId && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete occurrence
                </Button>
              )}
            </>
          )}

          {/* Footer — always visible */}
          <div className="mt-auto flex justify-end gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
