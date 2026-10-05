import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SwipeAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onAction: () => void;
}

interface SwipeableActionRowProps {
  children: React.ReactNode;
  startAction: SwipeAction;
  endAction: SwipeAction;
  disabled?: boolean;
}

const LIMIT = 88;
const TRIGGER = 54;

export function SwipeableActionRow({ children, startAction, endAction, disabled }: SwipeableActionRowProps) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const finish = () => {
    if (!dragging) return;
    if (offset >= TRIGGER) startAction.onAction();
    if (offset <= -TRIGGER) endAction.onAction();
    start.current = null;
    setDragging(false);
    setOffset(0);
  };

  const StartIcon = startAction.icon;
  const EndIcon = endAction.icon;

  return (
    <div className="relative overflow-hidden rounded-lg md:overflow-visible">
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-start bg-primary/15 pl-4 text-primary md:hidden" aria-hidden="true">
        <StartIcon className="h-5 w-5" />
      </div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-secondary pr-4 text-secondary-foreground md:hidden" aria-hidden="true">
        <EndIcon className="h-5 w-5" />
      </div>
      <div
        className={cn("relative z-10 touch-pan-y bg-background md:transform-none", !dragging && "transition-transform duration-200")}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(event) => {
          if (disabled) return;
          const touch = event.touches[0];
          if (touch) start.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (!start.current || !touch || disabled) return;
          const dx = touch.clientX - start.current.x;
          const dy = touch.clientY - start.current.y;
          if (Math.abs(dy) > Math.abs(dx)) return;
          setDragging(true);
          setOffset(Math.max(-LIMIT, Math.min(LIMIT, dx)));
        }}
        onTouchEnd={finish}
        onTouchCancel={finish}
      >{children}</div>
      <div className="sr-only">
        <Button onClick={startAction.onAction}>{startAction.label}</Button>
        <Button onClick={endAction.onAction}>{endAction.label}</Button>
      </div>
    </div>
  );
}