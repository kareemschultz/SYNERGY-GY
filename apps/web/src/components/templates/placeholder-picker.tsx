import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PLACEHOLDER_GROUPS } from "@/lib/template-placeholders";

interface PlaceholderPickerProps {
  onSelectPlaceholder: (key: string) => void;
}

export function PlaceholderPicker({
  onSelectPlaceholder,
}: PlaceholderPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Insert Placeholder
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <div className="mb-2">
          <h4 className="font-semibold text-sm">Insert Placeholder</h4>
          <p className="text-muted-foreground text-xs">
            Click to insert a placeholder into your template
          </p>
        </div>
        <Separator className="my-2" />
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {PLACEHOLDER_GROUPS.map((group) => (
              <div key={group.label}>
                <h5 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
                  {group.label}
                </h5>
                <div className="space-y-1">
                  {group.placeholders.map((placeholder) => (
                    <button
                      className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                      key={placeholder.key}
                      onClick={() => {
                        onSelectPlaceholder(placeholder.key);
                      }}
                      type="button"
                    >
                      <div className="font-medium">{placeholder.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {`{{${placeholder.key}}}`}
                      </div>
                      {placeholder.description && (
                        <div className="mt-1 text-muted-foreground text-xs">
                          {placeholder.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
