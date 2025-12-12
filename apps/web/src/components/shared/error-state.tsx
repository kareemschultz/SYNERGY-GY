import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ErrorStateProps = {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function ErrorState({
  icon: Icon = AlertCircle,
  title = "Something went wrong",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <Card className={`border-destructive/50 ${className ?? ""}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <Icon className="size-6 text-destructive" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        {message ? (
          <p className="mt-1 max-w-sm text-muted-foreground">{message}</p>
        ) : null}
        {action ? (
          <Button className="mt-4" onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
