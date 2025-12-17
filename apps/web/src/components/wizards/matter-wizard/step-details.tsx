import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WizardStep, WizardStepSection } from "../wizard-step";
import type { MatterWizardData } from "./types";

type StepDetailsProps = {
  data: MatterWizardData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MatterWizardData>) => void;
};

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export function StepDetails({ data, errors, onUpdate }: StepDetailsProps) {
  return (
    <WizardStep
      description="Enter the details about this matter."
      title="Matter Details"
    >
      <WizardStepSection>
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Enter matter title"
              value={data.title}
            />
            {errors.title ? (
              <p className="text-destructive text-sm">{errors.title}</p>
            ) : null}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Additional details about this matter..."
              rows={3}
              value={data.description}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value) =>
                  onUpdate({
                    priority: value as MatterWizardData["priority"],
                  })
                }
                value={data.priority}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tax Year - optional, mainly for KAJ */}
            <div className="space-y-2">
              <Label htmlFor="taxYear">Tax Year</Label>
              <Input
                id="taxYear"
                onChange={(e) =>
                  onUpdate({
                    taxYear: e.target.value
                      ? Number.parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                placeholder="e.g., 2024"
                type="number"
                value={data.taxYear || ""}
              />
              <p className="text-muted-foreground text-xs">
                Optional. Useful for tax-related matters.
              </p>
            </div>
          </div>
        </div>
      </WizardStepSection>
    </WizardStep>
  );
}
