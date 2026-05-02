"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { mockCurrentUser } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Club Profile */}
      <div className="rounded-lg border bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold">Club Profile</h2>
        <Separator />

        <div className="space-y-2">
          <Label htmlFor="club-name">Club Name</Label>
          <Input id="club-name" defaultValue="DS Cubed" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram Handle</Label>
          <Input id="instagram" defaultValue="@dscubed" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recorded-email">Recorded Email</Label>
          <div className="relative">
            <Input
              id="recorded-email"
              defaultValue={mockCurrentUser.email}
              readOnly
              className="pr-10 bg-gray-50 text-muted-foreground cursor-not-allowed"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          </div>
        </div>

        <Button
          onClick={() => {
            /* TODO */
          }}
        >
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 space-y-4">
        <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
        <Separator className="bg-red-200" />

        <div>
          <Button
            variant="destructive"
            onClick={() => {
              /* TODO */
            }}
          >
            Leave Club
          </Button>
          <p className="mt-2 text-sm text-red-600">
            Removing yourself as president requires another president to be
            assigned first.
          </p>
        </div>
      </div>
    </div>
  );
}
