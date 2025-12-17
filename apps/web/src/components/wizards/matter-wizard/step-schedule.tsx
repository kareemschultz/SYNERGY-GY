import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStep, WizardStepSection } from "../wizard-step";
import type { MatterWizardData } from "./types";

type StepScheduleProps = {
  data: MatterWizardData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MatterWizardData>) => void;
};

export function StepSchedule({ data, errors, onUpdate }: StepScheduleProps) {
  return (
    <WizardStep
      description="Set the timeline and estimated fees for this matter. This step is optional."
      title="Schedule & Fees"
    >
      <WizardStepSection title="Timeline">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              type="date"
              value={data.startDate}
            />
            <p className="text-muted-foreground text-xs">
              When work on this matter begins.
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              onChange={(e) => onUpdate({ dueDate: e.target.value })}
              type="date"
              value={data.dueDate}
            />
            <p className="text-muted-foreground text-xs">
              Target completion date for the matter.
            </p>
          </div>
        </div>
      </WizardStepSection>

      <WizardStepSection title="Estimated Fee">
        <div className="md:w-1/2">
          <div className="space-y-2">
            <Label htmlFor="estimatedFee">Estimated Fee (GYD)</Label>
            <Input
              id="estimatedFee"
              onChange={(e) => onUpdate({ estimatedFee: e.target.value })}
              placeholder="e.g., 50000"
              value={data.estimatedFee}
            />
            <p className="text-muted-foreground text-xs">
              This is an estimate. Final invoicing may differ based on actual
              work performed.
            </p>
          </div>
        </div>
      </WizardStepSection>
    </WizardStep>
  );
}
