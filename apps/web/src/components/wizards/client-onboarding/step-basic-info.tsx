import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardStep, WizardStepFields } from "../wizard-step";
import {
  type ClientOnboardingData,
  isBusinessType,
  isIndividualType,
} from "./types";

type StepBasicInfoProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
  onFieldBlur?: (fieldName: string) => void;
};

const NATIONALITIES = [
  "Guyanese",
  "American",
  "British",
  "Canadian",
  "Indian",
  "Chinese",
  "Brazilian",
  "Surinamese",
  "Trinidadian",
  "Venezuelan",
  "Other",
];

const COUNTRIES = [
  "Guyana",
  "United States",
  "United Kingdom",
  "Canada",
  "India",
  "China",
  "Brazil",
  "Suriname",
  "Trinidad and Tobago",
  "Venezuela",
  "Other",
];

export function StepBasicInfo({
  data,
  errors,
  onUpdate,
  onFieldBlur,
}: StepBasicInfoProps) {
  const isIndividual = isIndividualType(data.clientType);
  const isBusiness = isBusinessType(data.clientType);
  const isForeignNational = data.clientType === "FOREIGN_NATIONAL";

  return (
    <WizardStep
      description={
        isIndividual
          ? "Enter the individual's personal details"
          : "Enter the organization's details"
      }
      title={isIndividual ? "Personal Information" : "Organization Information"}
    >
      {isIndividual ? (
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-describedby={
                errors.firstName ? "firstName-error" : undefined
              }
              aria-invalid={!!errors.firstName}
              id="firstName"
              onBlur={() => onFieldBlur?.("firstName")}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              placeholder="Enter first name"
              value={data.firstName}
            />
            {errors.firstName ? (
              <p
                className="text-destructive text-sm"
                id="firstName-error"
                role="alert"
              >
                {errors.firstName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              aria-invalid={!!errors.lastName}
              id="lastName"
              onBlur={() => onFieldBlur?.("lastName")}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              placeholder="Enter last name"
              value={data.lastName}
            />
            {errors.lastName ? (
              <p
                className="text-destructive text-sm"
                id="lastName-error"
                role="alert"
              >
                {errors.lastName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
              type="date"
              value={data.dateOfBirth}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Select
              onValueChange={(value) => onUpdate({ nationality: value })}
              value={data.nationality}
            >
              <SelectTrigger id="nationality">
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nationality) => (
                  <SelectItem key={nationality} value={nationality}>
                    {nationality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </WizardStepFields>
      ) : null}

      {isBusiness ? (
        <WizardStepFields columns={2}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="businessName">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-describedby={
                errors.businessName ? "businessName-error" : undefined
              }
              aria-invalid={!!errors.businessName}
              id="businessName"
              onBlur={() => onFieldBlur?.("businessName")}
              onChange={(e) => onUpdate({ businessName: e.target.value })}
              placeholder="Enter business name"
              value={data.businessName}
            />
            {errors.businessName ? (
              <p
                className="text-destructive text-sm"
                id="businessName-error"
                role="alert"
              >
                {errors.businessName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              onChange={(e) => onUpdate({ registrationNumber: e.target.value })}
              placeholder="e.g., CO-12345"
              value={data.registrationNumber}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incorporationDate">Incorporation Date</Label>
            <Input
              id="incorporationDate"
              onChange={(e) => onUpdate({ incorporationDate: e.target.value })}
              type="date"
              value={data.incorporationDate}
            />
          </div>
        </WizardStepFields>
      ) : null}

      {isForeignNational ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">
            Foreign National Details
          </h4>
          <p className="mb-4 text-amber-700 text-sm dark:text-amber-300">
            Additional information required for immigration services
          </p>

          <WizardStepFields columns={2}>
            <div className="space-y-2">
              <Label htmlFor="passportCountry">
                Passport Country <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => onUpdate({ passportCountry: value })}
                value={data.passportCountry}
              >
                <SelectTrigger
                  aria-invalid={!!errors.passportCountry}
                  id="passportCountry"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter((c) => c !== "Guyana").map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.passportCountry ? (
                <p className="text-destructive text-sm">
                  {errors.passportCountry}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location</Label>
              <Select
                onValueChange={(value) => onUpdate({ currentLocation: value })}
                value={data.currentLocation}
              >
                <SelectTrigger id="currentLocation">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </WizardStepFields>
        </div>
      ) : null}
    </WizardStep>
  );
}
