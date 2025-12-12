import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  WizardStep,
  WizardStepFields,
  WizardStepSection,
} from "../wizard-step";
import type { ClientOnboardingData } from "./types";

type StepContactProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

export function StepContact({ data, errors, onUpdate }: StepContactProps) {
  return (
    <WizardStep
      description="Provide contact details for the client"
      title="Contact Information"
    >
      <WizardStepSection title="Primary Contact">
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              aria-invalid={!!errors.email}
              id="email"
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="client@example.com"
              type="email"
              value={data.email}
            />
            {errors.email ? (
              <p className="text-destructive text-sm">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="592-XXX-XXXX"
              type="tel"
              value={data.phone}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternatePhone">Alternate Phone</Label>
            <Input
              id="alternatePhone"
              onChange={(e) => onUpdate({ alternatePhone: e.target.value })}
              placeholder="592-XXX-XXXX"
              type="tel"
              value={data.alternatePhone}
            />
          </div>
        </WizardStepFields>

        {errors.contact ? (
          <p className="mt-2 text-destructive text-sm">{errors.contact}</p>
        ) : null}
      </WizardStepSection>

      <WizardStepSection className="mt-6" title="Address">
        <WizardStepFields columns={1}>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Textarea
              id="address"
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Enter street address"
              rows={2}
              value={data.address}
            />
          </div>
        </WizardStepFields>

        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="city">City/Town</Label>
            <Input
              id="city"
              onChange={(e) => onUpdate({ city: e.target.value })}
              placeholder="e.g., Georgetown"
              value={data.city}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              onChange={(e) => onUpdate({ country: e.target.value })}
              value={data.country}
            />
          </div>
        </WizardStepFields>
      </WizardStepSection>
    </WizardStep>
  );
}
