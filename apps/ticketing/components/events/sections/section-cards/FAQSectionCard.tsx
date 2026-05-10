"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SortableList, SortableItem } from "@/components/ui/sortable-list";
import { Plus, Trash2, X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQItem, FAQSectionData } from "@c3/types";

const SUGGESTED_QUESTIONS = [
  "What is the Dress Code/Theme?",
  "Is this event beginner-friendly?",
  "Will there be food and drinks?",
  "Is this event wheelchair accessible?",
  "Do I have to be a member to attend?",
];

interface FAQSectionCardProps {
  data: FAQSectionData;
  onChange: (data: FAQSectionData) => void;
  showAttentionBadge?: boolean;
  isDark?: boolean;
}

export function FAQSectionCard({
  data,
  onChange,
  showAttentionBadge,
  isDark,
}: FAQSectionCardProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const updateItem = (index: number, partial: Partial<FAQItem>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...partial };
    onChange({ ...data, items });
  };

  const addItem = () => {
    onChange({ ...data, items: [...data.items, { question: "", answer: "" }] });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  const inputDark = isDark
    ? "border-neutral-600 bg-neutral-700 text-neutral-100 placeholder:text-neutral-400"
    : "";

  return (
    <div className="space-y-4">
      {!bannerDismissed && (
        <div
          className={cn(
            "relative flex items-start gap-3 rounded-md border p-3",
            isDark
              ? "border-neutral-600 bg-neutral-700/50"
              : "border-blue-200 bg-blue-50",
          )}
        >
          <Lightbulb
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              isDark ? "text-neutral-400" : "text-blue-600",
            )}
          />
          <div className="flex-1 text-sm">
            <p
              className={cn(
                "mb-2 font-medium",
                isDark ? "text-neutral-100" : "text-blue-900",
              )}
            >
              Recommended questions to add:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    if (!data.items.some((faq) => faq.question === q)) {
                      onChange({
                        ...data,
                        items: [...data.items, { question: q, answer: "" }],
                      });
                    }
                  }}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium transition-colors",
                    isDark
                      ? "bg-neutral-600 text-neutral-100 hover:bg-neutral-500"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200",
                  )}
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-opacity hover:opacity-75",
              isDark && "text-neutral-400",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <SortableList
          items={data.items}
          idPrefix="faq"
          onReorder={(items) => onChange({ ...data, items })}
          className="divide-y"
        >
          {(item, index, id) => (
            <SortableItem
              id={id}
              className="group relative flex items-start gap-2 py-2"
              gripClassName="mt-2.5"
            >
              <div className="flex-1 space-y-1.5">
                <Input
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => updateItem(index, { question: e.target.value })}
                  className={cn("h-9 font-medium", inputDark)}
                />
                <Textarea
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) => updateItem(index, { answer: e.target.value })}
                  rows={2}
                  className={cn("resize-none text-sm", inputDark)}
                />
              </div>
              {data.items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="mt-1.5 h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </SortableItem>
          )}
        </SortableList>

        <div className="relative">
          {showAttentionBadge && (
            <span className="absolute -right-1 -top-1 z-10 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className={cn(
              "w-full gap-1",
              isDark &&
                "border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white",
            )}
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>
    </div>
  );
}
