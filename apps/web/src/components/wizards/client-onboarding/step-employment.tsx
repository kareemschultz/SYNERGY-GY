import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WizardStep,
  WizardStepFields,
  WizardStepSection,
} from "../wizard-step";
import type { ClientOnboardingData } from "./types";

type StepEmploymentProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
  onFieldBlur?: (fieldName: string) => void;
};

const EMPLOYMENT_STATUSES = [
  { value: "EMPLOYED", label: "Employed" },
  { value: "SELF_EMPLOYED", label: "Self-Employed" },
  { value: "UNEMPLOYED", label: "Unemployed" },
  { value: "RETIRED", label: "Retired" },
  { value: "STUDENT", label: "Student" },
] as const;

const INCOME_RANGES = [
  "Under GYD 500,000",
  "GYD 500,000 - 1,000,000",
  "GYD 1,000,000 - 2,000,000",
  "GYD 2,000,000 - 5,000,000",
  "GYD 5,000,000 - 10,000,000",
  "Over GYD 10,000,000",
  "Prefer not to say",
];

const INCOME_SOURCES = [
  { value: "EMPLOYMENT", label: "Employment Salary" },
  { value: "BUSINESS", label: "Business Income" },
  { value: "INVESTMENTS", label: "Investments" },
  { value: "RENTAL", label: "Rental Income" },
  { value: "PENSION", label: "Pension" },
  { value: "SAVINGS", label: "Savings" },
  { value: "INHERITANCE", label: "Inheritance" },
  { value: "OTHER", label: "Other" },
];

export function StepEmployment({
  data,
  errors,
  onUpdate,
}: StepEmploymentProps) {
  const employmentStatus = data.employment?.status;
  const showEmployerFields =
    employmentStatus === "EMPLOYED" || employmentStatus === "SELF_EMPLOYED";

  const handleIncomeSourceToggle = (source: string) => {
    const currentSources = data.employment?.incomeSources || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source];

    onUpdate({
      employment: {
        ...data.employment,
        incomeSources: newSources,
      },
    });
  };

  return (
    <WizardStep
      description="Provide employment and income information for verification"
      title="Employment Information"
    >
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This information helps us verify your income and comply with AML/KYC
          requirements
        </AlertDescription>
      </Alert>

      {/* Employment Status Section */}
      <WizardStepSection title="Employment Status">
        <WizardStepFields columns={2}>
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">
              Employment Status <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                onUpdate({
                  employment: {
                    ...data.employment,
                    status: value as
                      | "EMPLOYED"
                      | "SELF_EMPLOYED"
                      | "UNEMPLOYED"
                      | "RETIRED"
                      | "STUDENT",
                  },
                })
              }
              value={data.employment?.status}
            >
              <SelectTrigger id="employmentStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employmentStatus ? (
              <p className="text-destructive text-sm">
                {errors.employmentStatus}
              </p>
            ) : null}
          </div>
        </WizardStepFields>
      </WizardStepSection>

      {/* Employer Details (only if employed/self-employed) */}
      {showEmployerFields ? (
        <WizardStepSection className="mt-6" title="Employer Details">
          <WizardStepFields columns={2}>
            <div className="space-y-2">
              <Label htmlFor="employerName">
                {employmentStatus === "SELF_EMPLOYED"
                  ? "Business Name"
                  : "Employer Name"}
              </Label>
              <Input
                id="employerName"
                onChange={(e) =>
                  onUpdate({
                    employment: {
                      ...data.employment,
                      employerName: e.target.value,
                    },
                  })
                }
                placeholder={
                  employmentStatus === "SELF_EMPLOYED"
                    ? "Your business name"
                    : "Company/organization name"
                }
                value={data.employment?.employerName || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title/Position</Label>
              <Input
                id="jobTitle"
                onChange={(e) =>
                  onUpdate({
                    employment: {
                      ...data.employment,
                      jobTitle: e.target.value,
                    },
                  })
                }
                placeholder="e.g., Manager, Consultant"
                value={data.employment?.jobTitle || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry/Sector</Label>
              <Input
                id="industry"
                onChange={(e) =>
                  onUpdate({
                    employment: {
                      ...data.employment,
                      industry: e.target.value,
                    },
                  })
                }
                placeholder="e.g., Finance, Healthcare"
                value={data.employment?.industry || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentStartDate">Start Date</Label>
              <Input
                id="employmentStartDate"
                onChange={(e) =>
                  onUpdate({
                    employment: {
                      ...data.employment,
                      employmentStartDate: e.target.value,
                    },
                  })
                }
                type="date"
                value={data.employment?.employmentStartDate || ""}
              />
            </div>
          </WizardStepFields>
        </WizardStepSection>
      ) : null}

      {/* Income Information */}
      <WizardStepSection className="mt-6" title="Income Information">
        <WizardStepFields columns={1}>
          <div className="space-y-2">
            <Label htmlFor="annualIncomeRange">Annual Income Range</Label>
            <Select
              onValueChange={(value) =>
                onUpdate({
                  employment: {
                    ...data.employment,
                    annualIncomeRange: value,
                  },
                })
              }
              value={data.employment?.annualIncomeRange}
            >
              <SelectTrigger id="annualIncomeRange">
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </WizardStepFields>

        <div className="mt-4 space-y-3">
          <Label>Sources of Income (Select all that apply)</Label>
          <div className="grid grid-cols-2 gap-3">
            {INCOME_SOURCES.map((source) => (
              <div className="flex items-center space-x-2" key={source.value}>
                <Checkbox
                  checked={data.employment?.incomeSources?.includes(
                    source.value
                  )}
                  id={`income-source-${source.value}`}
                  onCheckedChange={() => handleIncomeSourceToggle(source.value)}
                />
                <Label
                  className="cursor-pointer font-normal"
                  htmlFor={`income-source-${source.value}`}
                >
                  {source.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </WizardStepSection>

      {/* Employer Contact (optional) */}
      {showEmployerFields ? (
        <WizardStepSection className="mt-6" title="Employer Contact (Optional)">
          <WizardStepFields columns={2}>
            <div className="space-y-2">
              <Label htmlFor="employerAddress">Employer Address</Label>
              <Input
                id="employerAddress"
                onChange={(e) =>
                  onUpdate({
                    employment: {
                      ...data.employment,
                      employerAddress: e.target.value,
                    },
                  })
                }
                placeholder="Street address"
                value={data.employment?.employerAddress || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employerPhone">Employer Phone</Label>
              <Input
                id="employerPhone"
                onChange={(e) =>
                  onUpdate({
                    employment: {
                      ...data.employment,
                      employerPhone: e.target.value,
                    },
                  })
                }
                placeholder="592-XXX-XXXX"
                type="tel"
                value={data.employment?.employerPhone || ""}
              />
            </div>
          </WizardStepFields>
        </WizardStepSection>
      ) : null}
    </WizardStep>
  );
}
