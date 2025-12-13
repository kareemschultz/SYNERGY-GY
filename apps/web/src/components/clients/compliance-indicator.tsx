import { AlertTriangle, CheckCircle, Shield, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ComplianceIndicatorProps = {
  graCompliant: boolean;
  nisCompliant: boolean;
  amlRiskRating: "LOW" | "MEDIUM" | "HIGH";
  lastCheckDate?: string | null;
  compact?: boolean;
};

export function ComplianceIndicator({
  graCompliant,
  nisCompliant,
  amlRiskRating,
  lastCheckDate,
  compact = false,
}: ComplianceIndicatorProps) {
  const amlColors = {
    LOW: "bg-green-500",
    MEDIUM: "bg-yellow-500",
    HIGH: "bg-red-500",
  };

  const amlLabels = {
    LOW: "Low Risk",
    MEDIUM: "Medium Risk",
    HIGH: "High Risk",
  };

  const amlStyles = {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-red-100 text-red-700",
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger>
              <div
                className={`h-2.5 w-2.5 rounded-full ${graCompliant ? "bg-green-500" : "bg-red-500"}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>GRA: {graCompliant ? "Compliant" : "Non-compliant"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div
                className={`h-2.5 w-2.5 rounded-full ${nisCompliant ? "bg-green-500" : "bg-red-500"}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>NIS: {nisCompliant ? "Compliant" : "Non-compliant"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div
                className={`h-2.5 w-2.5 rounded-full ${amlColors[amlRiskRating]}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>AML: {amlLabels[amlRiskRating]}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">GRA Tax</span>
        </div>
        {graCompliant ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Compliant</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Non-compliant</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">NIS</span>
        </div>
        {nisCompliant ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Compliant</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Non-compliant</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">AML Risk</span>
        </div>
        <div
          className={`rounded-full px-2 py-0.5 font-medium text-xs ${amlStyles[amlRiskRating]}`}
        >
          {amlLabels[amlRiskRating]}
        </div>
      </div>

      {Boolean(lastCheckDate) && (
        <p className="text-muted-foreground text-xs">
          Last checked: {new Date(lastCheckDate as string).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
