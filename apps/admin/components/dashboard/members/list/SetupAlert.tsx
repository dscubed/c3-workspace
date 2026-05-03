import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function SetupAlert() {
  return (
    <div className="flex gap-3 p-4 rounded-lg border border-orange-300 bg-orange-50">
      <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-orange-900">
          No DKIM setup detected
        </p>
        <p className="text-sm text-orange-800 mt-1">
          Your club doesn&apos;t have a membership configuration set up yet.
          Configure your DKIM settings to enable students to verify their
          memberships.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 border-orange-300 hover:bg-orange-100"
          onClick={() => {
            const trigger = document.querySelector(
              '[value="dkim"]',
            ) as HTMLButtonElement;
            trigger?.click();
          }}
        >
          Set Up DKIM
        </Button>
      </div>
    </div>
  );
}
