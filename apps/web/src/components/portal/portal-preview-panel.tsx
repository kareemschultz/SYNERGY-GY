import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { orpc } from "@/utils/orpc";

type PortalPreviewPanelProps = {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PortalPreviewPanel({
  clientId,
  open,
  onOpenChange,
}: PortalPreviewPanelProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startImpersonationMutation =
    orpc.portal.impersonation.start.useMutation();

  const handleOpen = async () => {
    if (!open) {
      return;
    }

    setIsLoading(true);
    try {
      // Start a temporary impersonation session for preview
      const { token } = await startImpersonationMutation.mutateAsync({
        clientId,
        reason: "Staff previewing portal",
      });

      // We pass the token in URL, assuming the portal app can consume it to init session
      // This requires the portal app to check query params on load
      setUrl(`/portal?token=${token}&preview=true`);
    } catch (error: any) {
      toast.error(`Failed to start preview: ${error.message}`);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger load when opened
  if (open && !url && !isLoading) {
    handleOpen();
  }

  // Reset when closed
  if (!open && url) {
    setUrl(null);
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex w-[90%] flex-col p-0 sm:max-w-[800px]"
        side="right"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
          <SheetTitle>Portal Preview</SheetTitle>
          {url && (
            <Button asChild size="sm" variant="ghost">
              <a href={url} rel="noreferrer" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </a>
            </Button>
          )}
        </SheetHeader>
        <div className="relative flex-1 bg-muted/20">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : url ? (
            <iframe
              className="h-full w-full border-0"
              src={url}
              title="Portal Preview"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
