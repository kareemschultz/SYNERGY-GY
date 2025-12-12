import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="mt-1 max-w-sm text-muted-foreground">{description}</p>
        {action ? (
          <Button className="mt-6" onClick={action.onClick}>
            <Plus className="mr-2 size-4" />
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
