import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WizardStep, WizardStepSection } from "../wizard-step";
import type { MatterWizardData } from "./types";

type StepReviewProps = {
  data: MatterWizardData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MatterWizardData>) => void;
};

const priorityLabels: Record<string, { label: string; className: string }> = {
  LOW: {
    label: "Low",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
  NORMAL: {
    label: "Normal",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
};

export function StepReview({ data }: StepReviewProps) {
  const priority = priorityLabels[data.priority] || priorityLabels.NORMAL;

  return (
    <WizardStep
      description="Review the matter details before creating."
      icon={<CheckCircle className="h-6 w-6" />}
      title="Review & Confirm"
    >
      <WizardStepSection>
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Client */}
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground text-sm">
                Client
              </p>
              <p className="text-lg">{data.clientName || "Not selected"}</p>
            </div>

            {/* Business & Service */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground text-sm">
                  Business
                </p>
                <div>
                  {data.business ? (
                    <Badge
                      className={
                        data.business === "GCMC"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-blue-500/10 text-blue-600"
                      }
                      variant="outline"
                    >
                      {data.business}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Not selected</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground text-sm">
                  Service Type
                </p>
                <p>{data.serviceTypeName || "Not selected"}</p>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <p className="font-medium text-muted-foreground text-sm">Title</p>
              <p className="text-lg">{data.title || "Not entered"}</p>
            </div>

            {data.description ? (
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground text-sm">
                  Description
                </p>
                <p className="text-sm">{data.description}</p>
              </div>
            ) : null}

            {/* Priority & Tax Year */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground text-sm">
                  Priority
                </p>
                <Badge className={priority.className} variant="outline">
                  {priority.label}
                </Badge>
              </div>
              {data.taxYear ? (
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground text-sm">
                    Tax Year
                  </p>
                  <p>{data.taxYear}</p>
                </div>
              ) : null}
            </div>

            {/* Schedule */}
            {data.startDate || data.dueDate ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.startDate ? (
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Start Date
                    </p>
                    <p>{new Date(data.startDate).toLocaleDateString()}</p>
                  </div>
                ) : null}
                {data.dueDate ? (
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Due Date
                    </p>
                    <p>{new Date(data.dueDate).toLocaleDateString()}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Fee */}
            {data.estimatedFee ? (
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground text-sm">
                  Estimated Fee
                </p>
                <p className="font-semibold text-lg">
                  ${Number(data.estimatedFee).toLocaleString()} GYD
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </WizardStepSection>
    </WizardStep>
  );
}
