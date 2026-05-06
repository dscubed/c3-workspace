"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, User } from "lucide-react";

interface CheckinStatusPopoverProps {
  checkedIn: true;
  checkedInAt: string | null;
  checkedInByName: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CheckinStatusPopover({
  checkedInAt,
  checkedInByName,
}: CheckinStatusPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge className="bg-green-100 text-green-700 border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
          Checked In
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="size-4 text-green-600 shrink-0" />
          <span className="font-semibold text-sm">Checked In</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {checkedInAt && (
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0" />
              <span>{formatTime(checkedInAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="size-3.5 shrink-0" />
            <span>{checkedInByName ?? "Unknown"}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
