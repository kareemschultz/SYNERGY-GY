import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/use-impersonation";

export function ImpersonationBanner() {
  const { isImpersonating, endImpersonation } = useImpersonation();
  const clientName = sessionStorage.getItem("impersonated_client_name");

  if (!isImpersonating()) return null;

  return (
    <div className="border-amber-300 border-b bg-amber-100 px-4 py-2 dark:border-amber-800 dark:bg-amber-900/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-amber-900 dark:text-amber-200">
            Viewing portal as {clientName || "Client"}
          </span>
        </div>
        <Button
          className="border-amber-200 bg-white/50 hover:bg-white/80 dark:border-amber-800 dark:bg-black/50 dark:hover:bg-black/80"
          onClick={endImpersonation}
          size="sm"
          variant="outline"
        >
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}
