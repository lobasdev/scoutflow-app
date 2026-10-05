import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center",
      className
    )}
  >
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
      <Icon className="h-7 w-7 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    )}
    {actionLabel && onAction && (
      <Button onClick={onAction} className="mt-5">
        {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
        {actionLabel}
      </Button>
    )}
    {secondaryLabel && onSecondary && (
      <Button variant="ghost" onClick={onSecondary} className="mt-2">
        {secondaryLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
