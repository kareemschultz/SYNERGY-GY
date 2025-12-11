import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type TemplatePreviewProps = {
  content: string;
  isLoading?: boolean;
};

export function TemplatePreview({ content, isLoading }: TemplatePreviewProps) {
  return (
    <div className="space-y-2">
      <Label>Preview</Label>
      <div className="rounded-md border bg-muted/50">
        <ScrollArea className="h-96">
          <div className="whitespace-pre-wrap p-4 font-serif text-sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading preview...
              </div>
              // biome-ignore lint/style/noNestedTernary: Auto-fix
            ) : content ? (
              content
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Preview will appear here</p>
                <p className="mt-2 text-xs">
                  Add content to your template to see the preview
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <p className="text-muted-foreground text-sm">
        This preview shows how the template will look with sample data. Actual
        generated documents will use real client and matter information.
      </p>
    </div>
  );
}
