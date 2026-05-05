"use client";

import { Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { TicketFieldPreview } from "@/components/events/checkout/TicketFieldPreview";
import { getPresetFields } from "@/lib/types/ticketing";
import { useCheckoutContext } from "./CheckoutContext";

interface TicketFormProps {
  ticketIndex: number;
}

export function TicketForm({ ticketIndex }: TicketFormProps) {
  const {
    layout,
    isDark,
    colors,
    fields,
    user,
    fillingMyData,
    getFieldValue,
    setFieldValue,
    handleBuyForMyself,
    clubName,
  } = useCheckoutContext();

  const presetFields = getPresetFields(clubName);

  return (
    <div className="space-y-8">
      <SectionWrapper
        title="Your Details"
        layout={layout}
        isDark={isDark}
        headerRight={
          user ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 text-xs",
                isDark
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-black/60 hover:text-black hover:bg-black/10",
              )}
              onClick={() => handleBuyForMyself(ticketIndex)}
              disabled={fillingMyData}
            >
              {fillingMyData ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              Autofill my details
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {presetFields.map((field) => {
            if (field.type === "yesno") {
              const val = getFieldValue(ticketIndex, field.key);
              return (
                <div key={field.key} className="space-y-1.5 sm:col-span-2">
                  <Label className={cn("text-sm font-medium", colors.text)}>
                    {field.label}
                    <span className="ml-0.5 text-red-500">*</span>
                  </Label>
                  <div className="flex gap-3">
                    {["Yes", "No"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setFieldValue(ticketIndex, field.key, opt)
                        }
                        className={cn(
                          "rounded-lg border px-5 py-2 text-sm font-medium transition-colors",
                          val === opt
                            ? isDark
                              ? "border-white bg-white text-black"
                              : "border-black bg-black text-white"
                            : cn(
                                colors.inputBg,
                                colors.inputBorder,
                                colors.text,
                              ),
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={field.key}
                className={cn(
                  "space-y-1.5",
                  field.key === "email" && "sm:col-span-2",
                )}
              >
                <Label className={cn("text-sm font-medium", colors.text)}>
                  {field.label}
                  {field.required && (
                    <span className="ml-0.5 text-red-500">*</span>
                  )}
                </Label>
                <Input
                  type={field.type}
                  placeholder={field.label}
                  className={cn(
                    colors.inputBg,
                    colors.inputBorder,
                    colors.placeholder,
                  )}
                  value={getFieldValue(ticketIndex, field.key)}
                  onChange={(e) =>
                    setFieldValue(ticketIndex, field.key, e.target.value)
                  }
                />
              </div>
            );
          })}
        </div>
      </SectionWrapper>

      {fields.length > 0 && (
        <SectionWrapper title="Additional Info" layout={layout} isDark={isDark}>
          <div className="space-y-4">
            {fields.map((field) => (
              <TicketFieldPreview
                key={field.id}
                field={field}
                colors={colors}
                value={getFieldValue(ticketIndex, field.id)}
                onChange={(val) => setFieldValue(ticketIndex, field.id, val)}
              />
            ))}
          </div>
        </SectionWrapper>
      )}
    </div>
  );
}
