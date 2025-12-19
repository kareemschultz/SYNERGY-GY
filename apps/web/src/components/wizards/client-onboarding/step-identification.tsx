import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WizardStep,
  WizardStepFields,
  WizardStepSection,
} from "../wizard-step";
import { type ClientOnboardingData, isIndividualType } from "./types";

type StepIdentificationProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

export function StepIdentification({
  data,
  errors,
  onUpdate,
}: StepIdentificationProps) {
  const isIndividual = isIndividualType(data.clientType);
  const isForeignNational = data.clientType === "FOREIGN_NATIONAL";

  return (
    <WizardStep
      description="These numbers help with tax filings and compliance services"
      title="Identification Numbers"
    >
      <Alert className="mb-6">
        <Info className="size-4" />
        <AlertDescription>
          This step is optional. You can add these details later if you don't
          have them now. However, they will be required for tax and compliance
          services.
        </AlertDescription>
      </Alert>

      <WizardStepSection title="Tax Identification">
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="tinNumber">TIN Number</Label>
            <Input
              id="tinNumber"
              onChange={(e) => onUpdate({ tinNumber: e.target.value })}
              placeholder="Tax Identification Number"
              value={data.tinNumber}
            />
            <p className="text-muted-foreground text-xs">
              Required for KAJ tax services
            </p>
          </div>

          {Boolean(isIndividual) && !isForeignNational ? (
            <div className="space-y-2">
              <Label htmlFor="nisNumber">NIS Number</Label>
              <Input
                id="nisNumber"
                onChange={(e) => onUpdate({ nisNumber: e.target.value })}
                placeholder="National Insurance Number"
                value={data.nisNumber}
              />
              <p className="text-muted-foreground text-xs">
                Required for NIS and PAYE services
              </p>
            </div>
          ) : null}
        </WizardStepFields>
      </WizardStepSection>

      <WizardStepSection className="mt-6" title="Personal Identification">
        <WizardStepFields columns={2}>
          {Boolean(isIndividual) && !isForeignNational ? (
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                onChange={(e) => onUpdate({ nationalId: e.target.value })}
                placeholder="Guyana National ID Number"
                value={data.nationalId}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="passportNumber">
              Passport Number
              {isForeignNational ? (
                <span className="text-destructive"> *</span>
              ) : null}
            </Label>
            <Input
              aria-invalid={!!errors.passportNumber}
              id="passportNumber"
              onChange={(e) => onUpdate({ passportNumber: e.target.value })}
              placeholder="Passport Number"
              value={data.passportNumber}
            />
            {isForeignNational ? (
              <p className="text-muted-foreground text-xs">
                Required for immigration services
              </p>
            ) : null}
            {errors.passportNumber ? (
              <p className="text-destructive text-sm">
                {errors.passportNumber}
              </p>
            ) : null}
          </div>
        </WizardStepFields>
      </WizardStepSection>

      {isForeignNational ? (
        <Alert className="mt-6" variant="default">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Additional documents will be required for immigration services
            including police clearance, medical certificate, and employment
            contract.
          </AlertDescription>
        </Alert>
      ) : null}
    </WizardStep>
  );
}
