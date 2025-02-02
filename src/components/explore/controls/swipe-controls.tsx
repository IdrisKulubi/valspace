"use client";

import { Button } from "@/components/ui/button";
import { Undo, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo: () => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeControls({
  onSwipeLeft,
  onSwipeRight,
  onUndo,
  className,
  disabled,
}: SwipeControlsProps) {
  return (
    <div className={cn("flex justify-center gap-6", className)}>
      <Button
        variant="ghost"
        onClick={onUndo}
        disabled={disabled}
        className={cn(
          "rounded-full h-14 w-14 bg-pink-200 dark:bg-pink-900",
          "transition-transform duration-200 hover:scale-110",
          disabled && "opacity-50 pointer-events-none"
        )}
        aria-label="Undo last swipe"
      >
        <Undo className="h-8 w-8 text-pink-600 dark:text-pink-400" />
      </Button>

      <Button
        onClick={onSwipeLeft}
        className="rounded-full h-14 w-14 bg-red-200 dark:bg-red-900"
        aria-label="Swipe left"
      >
        <X className="h-8 w-8 text-red-600 dark:text-red-400" />
      </Button>

      <Button
        onClick={onSwipeRight}
        className="rounded-full h-14 w-14 bg-green-200 dark:bg-green-900"
        aria-label="Swipe right"
      >
        <Heart className="h-8 w-8 text-green-600 dark:text-green-400" />
      </Button>
    </div>
  );
}
