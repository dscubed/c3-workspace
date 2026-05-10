"use client";

import { Fragment, useMemo } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── SortableList ── */

interface SortableListProps<T> {
  items: T[];
  idPrefix: string;
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, id: string) => React.ReactNode;
  className?: string;
}

export function SortableList<T>({
  items,
  idPrefix,
  onReorder,
  children,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemIds = useMemo(
    () => items.map((_, i) => `${idPrefix}-${i}`),
    [items, idPrefix],
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(active.id as string);
    const newIndex = itemIds.indexOf(over.id as string);
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, i) => (
            <Fragment key={itemIds[i]}>
              {children(item, i, itemIds[i])}
            </Fragment>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/* ── SortableItem ── */

interface SortableItemProps {
  id: string;
  className?: string;
  gripClassName?: string;
  children: React.ReactNode;
}

export function SortableItem({
  id,
  className,
  gripClassName,
  children,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={className}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          "cursor-grab touch-none active:cursor-grabbing",
          gripClassName,
        )}
      >
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </button>
      {children}
    </div>
  );
}
