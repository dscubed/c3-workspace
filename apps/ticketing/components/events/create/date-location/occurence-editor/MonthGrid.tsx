"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import type { OccurrenceFormData } from "../../../shared/types";
import { formatChipLabel } from "../occurrenceUtils";

interface MonthGridProps {
  month: Date;
  occurrencesByDate: Map<string, OccurrenceFormData[]>;
  selectedDate: string | null;
  editingId: string | null;
  onDayClick: (dateStr: string) => void;
  onOccurrenceClick: (occ: OccurrenceFormData) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthGrid({
  month,
  occurrencesByDate,
  selectedDate,
  editingId,
  onDayClick,
  onOccurrenceClick,
}: MonthGridProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [month]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [days]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, month);
            const today = isToday(day);
            const dayOccs = occurrencesByDate.get(dateStr) ?? [];
            const isSelected = selectedDate === dateStr;
            const hasEditingOcc = editingId
              ? dayOccs.some((o) => o.id === editingId)
              : false;

            return (
              <div
                key={dateStr}
                role="button"
                tabIndex={0}
                onClick={() => onDayClick(dateStr)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDayClick(dateStr);
                  }
                }}
                className={`relative min-h-18 cursor-pointer border-r p-1 text-left transition-colors last:border-r-0
                  ${!inMonth ? "bg-muted/30 text-muted-foreground/40" : ""}
                  ${isSelected ? "bg-accent/50" : "hover:bg-muted/50"}
                  ${hasEditingOcc ? "ring-2 ring-inset ring-primary" : ""}
                `}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs
                    ${today ? "bg-primary font-semibold text-primary-foreground" : ""}
                    ${!inMonth ? "opacity-40" : ""}
                  `}
                >
                  {day.getDate()}
                </span>

                {dayOccs.length > 0 && (
                  <div className="mt-0.5 flex flex-col gap-px">
                    {dayOccs.slice(0, 2).map((occ) => (
                      <div
                        key={occ.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOccurrenceClick(occ);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            onOccurrenceClick(occ);
                          }
                        }}
                        className={`cursor-pointer truncate rounded px-1 py-0.5 text-[10px] leading-tight transition-colors
                          ${
                            occ.id === editingId
                              ? "bg-primary text-primary-foreground"
                              : "bg-foreground/80 text-background hover:bg-foreground"
                          }
                        `}
                      >
                        {formatChipLabel(occ)}
                      </div>
                    ))}
                    {dayOccs.length > 2 && (
                      <span className="px-1 text-[10px] text-muted-foreground">
                        +{dayOccs.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
