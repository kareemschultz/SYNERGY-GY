import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  onFieldBlur?: (fieldName: string) => void;
};

const CONTACT_METHODS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "IN_PERSON", label: "In Person" },
] as const;

const LANGUAGES = [
  "English",
  "Spanish",
  "Portuguese",
  "Chinese",
  "Hindi",
  "Urdu",
  "Other",
];

export function StepContact({
  data,
  errors,
  onUpdate,
  onFieldBlur,
}: StepContactProps) {
  return (
    <WizardStep
      description="Provide contact details and communication preferences"
      title="Contact Information"
    >
      {/* Primary Contact Section */}
      <WizardStepSection title="Primary Contact">
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              aria-describedby={errors.email ? "email-error" : ""}
              aria-invalid={!!errors.email}
              id="email"
              onBlur={() => onFieldBlur?.("email")}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="client@example.com"
              type="email"
              value={data.email}
            />
            {errors.email ? (
              <p
                className="text-destructive text-sm"
                id="email-error"
                role="alert"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              aria-describedby={errors.phone ? "phone-error" : ""}
              aria-invalid={!!errors.phone}
              id="phone"
              onBlur={() => onFieldBlur?.("phone")}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="592-XXX-XXXX"
              type="tel"
              value={data.phone}
            />
            {errors.phone ? (
              <p
                className="text-destructive text-sm"
                id="phone-error"
                role="alert"
              >
                {errors.phone}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternatePhone">Alternate Phone</Label>
            <Input
              id="alternatePhone"
              onBlur={() => onFieldBlur?.("alternatePhone")}
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

      {/* Communication Preferences Section */}
      <WizardStepSection className="mt-6" title="Communication Preferences">
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="preferredContactMethod">
              Preferred Contact Method
            </Label>
            <Select
              onValueChange={(value) =>
                onUpdate({
                  preferredContactMethod: value as
                    | "EMAIL"
                    | "PHONE"
                    | "WHATSAPP"
                    | "IN_PERSON",
                })
              }
              value={data.preferredContactMethod}
            >
              <SelectTrigger id="preferredContactMethod">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred Language</Label>
            <Select
              onValueChange={(value) => onUpdate({ preferredLanguage: value })}
              value={data.preferredLanguage}
            >
              <SelectTrigger id="preferredLanguage">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </WizardStepFields>
      </WizardStepSection>

      {/* Address Section */}
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

      {/* Emergency Contact Section */}
      <WizardStepSection className="mt-6" title="Emergency Contact (Optional)">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Provide emergency contact information for urgent situations
          </AlertDescription>
        </Alert>

        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              onChange={(e) =>
                onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    name: e.target.value,
                  },
                })
              }
              placeholder="Full name"
              value={data.emergencyContact?.name || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Relationship</Label>
            <Input
              id="emergencyContactRelationship"
              onChange={(e) =>
                onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    relationship: e.target.value,
                  },
                })
              }
              placeholder="e.g., Spouse, Parent"
              value={data.emergencyContact?.relationship || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Phone Number</Label>
            <Input
              id="emergencyContactPhone"
              onChange={(e) =>
                onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    phone: e.target.value,
                  },
                })
              }
              placeholder="592-XXX-XXXX"
              type="tel"
              value={data.emergencyContact?.phone || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactEmail">Email</Label>
            <Input
              id="emergencyContactEmail"
              onChange={(e) =>
                onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    email: e.target.value,
                  },
                })
              }
              placeholder="contact@example.com"
              type="email"
              value={data.emergencyContact?.email || ""}
            />
          </div>
        </WizardStepFields>
      </WizardStepSection>

      {/* Next of Kin Section */}
      <WizardStepSection className="mt-6" title="Next of Kin (Optional)">
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="nextOfKinName">Full Name</Label>
            <Input
              id="nextOfKinName"
              onChange={(e) =>
                onUpdate({
                  nextOfKin: {
                    ...data.nextOfKin,
                    name: e.target.value,
                  },
                })
              }
              placeholder="Full name"
              value={data.nextOfKin?.name || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextOfKinRelationship">Relationship</Label>
            <Input
              id="nextOfKinRelationship"
              onChange={(e) =>
                onUpdate({
                  nextOfKin: {
                    ...data.nextOfKin,
                    relationship: e.target.value,
                  },
                })
              }
              placeholder="e.g., Child, Sibling"
              value={data.nextOfKin?.relationship || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextOfKinPhone">Phone Number</Label>
            <Input
              id="nextOfKinPhone"
              onChange={(e) =>
                onUpdate({
                  nextOfKin: {
                    ...data.nextOfKin,
                    phone: e.target.value,
                  },
                })
              }
              placeholder="592-XXX-XXXX"
              type="tel"
              value={data.nextOfKin?.phone || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextOfKinAddress">Address</Label>
            <Input
              id="nextOfKinAddress"
              onChange={(e) =>
                onUpdate({
                  nextOfKin: {
                    ...data.nextOfKin,
                    address: e.target.value,
                  },
                })
              }
              placeholder="Street address"
              value={data.nextOfKin?.address || ""}
            />
          </div>
        </WizardStepFields>
      </WizardStepSection>
    </WizardStep>
  );
}
