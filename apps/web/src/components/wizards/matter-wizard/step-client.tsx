import { ClientSelector } from "@/components/clients/client-selector";
import { Label } from "@/components/ui/label";
import { WizardStep, WizardStepSection } from "../wizard-step";
import type { MatterWizardData } from "./types";

type StepClientProps = {
  data: MatterWizardData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MatterWizardData>) => void;
};

export function StepClient({ data, errors, onUpdate }: StepClientProps) {
  return (
    <WizardStep
      description="Choose the client this matter is for. You can search by name or browse by business affiliation."
      title="Select Client"
    >
      <WizardStepSection>
        <div className="space-y-2">
          <Label>Client *</Label>
          <ClientSelector
            onChange={(clientId, client) => {
              onUpdate({
                clientId,
                clientName: client.displayName,
              });
            }}
            placeholder="Search for a client..."
            value={data.clientId || null}
          />
          {errors.clientId ? (
            <p className="text-destructive text-sm">{errors.clientId}</p>
          ) : null}
          <p className="text-muted-foreground text-sm">
            Clients are grouped by business affiliation (GCMC, KAJ, or Both).
          </p>
        </div>
      </WizardStepSection>
    </WizardStep>
  );
}
