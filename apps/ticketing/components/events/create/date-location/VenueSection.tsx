"use client";

import { useState, useCallback } from "react";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VenueCard } from "./VenueCard";
import { AddVenuePanel } from "./AddVenuePanel";
import type { LocationType, Venue } from "../../shared/types";
import { useEventForm } from "../../shared/EventFormContext";

export function VenueSection() {
  const { form, setForm, markDirty } = useEventForm();
  const { venues } = form;

  const [addingVenue, setAddingVenue] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

  const editingVenue = editingVenueId
    ? (venues.find((v) => v.id === editingVenueId) ?? null)
    : null;

  const onVenuesChange = useCallback(
    (updated: Venue[]) => {
      setForm((prev) => ({ ...prev, venues: updated }));
      markDirty("event", "location");
    },
    [setForm, markDirty],
  );

  const handleAddVenue = useCallback(
    (venue: Venue) => {
      let updated: Venue[] = editingVenueId
        ? venues.map((v) => (v.id === venue.id ? venue : v))
        : [...venues, venue];

      if (venue.type !== "tba") {
        updated = updated.filter((v) => v.type !== "tba" || v.id === venue.id);
      }

      onVenuesChange(updated);
      setAddingVenue(false);
      setEditingVenueId(null);
    },
    [editingVenueId, venues, onVenuesChange],
  );

  const handleRemoveVenue = useCallback(
    (id: string) => {
      let updated = venues.filter((v) => v.id !== id);
      if (updated.length === 0) {
        updated = [
          {
            id: crypto.randomUUID(),
            type: "tba" as LocationType,
            location: { displayName: "", address: "" },
          },
        ];
      }
      // Remove venue refs from occurrences in the same setForm call
      setForm((prev) => ({
        ...prev,
        venues: updated,
        occurrences: prev.occurrences.map((occ) =>
          occ.venueIds?.includes(id)
            ? { ...occ, venueIds: occ.venueIds.filter((vid) => vid !== id) }
            : occ,
        ),
      }));
      markDirty("event", "location");
    },
    [venues, setForm, markDirty],
  );

  const handleEditVenue = useCallback((id: string) => {
    setEditingVenueId(id);
    setAddingVenue(true);
  }, []);

  const handleCancelVenue = useCallback(() => {
    setAddingVenue(false);
    setEditingVenueId(null);
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        Venues
      </h3>

      {venues.length > 0 && (
        <div className="space-y-1.5">
          {venues.map((v) => (
            <VenueCard
              key={v.id}
              venue={v}
              onEdit={() => handleEditVenue(v.id)}
              onRemove={() => handleRemoveVenue(v.id)}
            />
          ))}
        </div>
      )}

      {addingVenue ? (
        <AddVenuePanel
          onAdd={handleAddVenue}
          onCancel={handleCancelVenue}
          editingVenue={editingVenue}
          hideTba={venues.some((v) => v.type !== "tba")}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingVenueId(null);
            setAddingVenue(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add venue
        </Button>
      )}

      {venues.length === 0 && !addingVenue && (
        <p className="text-xs text-muted-foreground">
          Add at least one venue for your event.
        </p>
      )}
    </div>
  );
}
