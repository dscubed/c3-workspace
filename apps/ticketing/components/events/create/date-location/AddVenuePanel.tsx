"use client";

import { useState, useCallback } from "react";
import { Globe, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LocationPicker } from "./LocationPicker";
import type { LocationData, LocationType, Venue } from "../../shared/types";

interface AddVenuePanelProps {
  onAdd: (venue: Venue) => void;
  onCancel: () => void;
  editingVenue?: Venue | null;
  /** Hide the TBA tab when real venues already exist */
  hideTba?: boolean;
}

export function AddVenuePanel({
  onAdd,
  onCancel,
  editingVenue,
  hideTba,
}: AddVenuePanelProps) {
  const [venueType, setVenueType] = useState<LocationType>(
    editingVenue?.type === "tba" && hideTba
      ? "physical"
      : (editingVenue?.type ?? "physical"),
  );
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>(
    editingVenue?.location ?? { displayName: "", address: "" },
  );
  const [onlineLink, setOnlineLink] = useState(editingVenue?.onlineLink ?? "");

  const handleConfirm = useCallback(() => {
    const venue: Venue = {
      id: editingVenue?.id ?? crypto.randomUUID(),
      type: venueType,
      location: locationData,
      onlineLink: venueType === "online" ? onlineLink : undefined,
    };
    onAdd(venue);
  }, [editingVenue, venueType, locationData, onlineLink, onAdd]);

  const canConfirm =
    venueType === "tba"
      ? true
      : venueType === "online"
        ? !!onlineLink.trim()
        : !!locationData.displayName.trim();

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">
          {editingVenue ? "Edit venue" : "Add venue"}
        </Label>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Tabs
        value={venueType}
        onValueChange={(v) => setVenueType(v as LocationType)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="physical" className="flex-1 text-xs">
            Physical
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 text-xs">
            Custom
          </TabsTrigger>
          <TabsTrigger value="online" className="flex-1 text-xs">
            Online
          </TabsTrigger>
          {!hideTba && (
            <TabsTrigger value="tba" className="flex-1 text-xs">
              TBA
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="physical" className="mt-3 space-y-2">
          {locationData.displayName ? (
            <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {locationData.displayName}
                </p>
                {locationData.address && (
                  <p className="truncate text-xs text-muted-foreground">
                    {locationData.address}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocationPickerOpen(true)}
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocationPickerOpen(true)}
            >
              <MapPin className="mr-1.5 h-3.5 w-3.5" />
              Search location
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Search for an address or paste a Google Maps link.
          </p>
        </TabsContent>

        <TabsContent value="custom" className="mt-3 space-y-3">
          <div>
            <Label className="text-xs">Venue name</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Town Hall Room 3"
              value={locationData.displayName}
              onChange={(e) =>
                setLocationData({
                  ...locationData,
                  displayName: e.target.value,
                  lat: undefined,
                  lon: undefined,
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Address (optional)</Label>
            <Input
              className="mt-1"
              placeholder="e.g. 123 Main St, Sydney"
              value={locationData.address}
              onChange={(e) =>
                setLocationData({
                  ...locationData,
                  address: e.target.value,
                  lat: undefined,
                  lon: undefined,
                })
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="online" className="mt-3 space-y-3">
          <div>
            <Label className="text-xs">Meeting link</Label>
            <div className="mt-1 flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="e.g. https://zoom.us/j/123456789"
                value={onlineLink}
                onChange={(e) => setOnlineLink(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tba" className="mt-3">
          <p className="text-sm text-muted-foreground">
            Location will be announced later.
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={!canConfirm}>
          {editingVenue ? "Update" : "Add"}
        </Button>
      </div>

      <LocationPicker
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        value={locationData}
        onChange={(loc) => {
          setLocationData(loc);
          setLocationPickerOpen(false);
        }}
      />
    </div>
  );
}
