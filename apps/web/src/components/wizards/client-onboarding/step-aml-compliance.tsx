import { AlertTriangle, Info, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  WizardStep,
  WizardStepFields,
  WizardStepSection,
} from "../wizard-step";
import type { ClientOnboardingData } from "./types";

type StepAmlComplianceProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
  onFieldBlur?: (fieldName: string) => void;
};

const SOURCE_OF_FUNDS = [
  { value: "EMPLOYMENT", label: "Employment Salary" },
  { value: "BUSINESS", label: "Business Income" },
  { value: "INVESTMENTS", label: "Investment Returns" },
  { value: "INHERITANCE", label: "Inheritance" },
  { value: "GIFT", label: "Gift" },
  { value: "SAVINGS", label: "Personal Savings" },
  { value: "LOAN", label: "Loan/Credit" },
  { value: "OTHER", label: "Other" },
];

const PEP_CATEGORIES = [
  { value: "HEAD_OF_STATE", label: "Head of State/Government" },
  { value: "GOVERNMENT_OFFICIAL", label: "Senior Government Official" },
  { value: "JUDICIAL_OFFICIAL", label: "Judicial Official" },
  { value: "MILITARY_OFFICIAL", label: "Senior Military Official" },
  {
    value: "STATE_OWNED_EXECUTIVE",
    label: "State-Owned Enterprise Executive",
  },
  { value: "POLITICAL_PARTY_OFFICIAL", label: "Political Party Official" },
  {
    value: "INTERNATIONAL_ORGANIZATION",
    label: "International Organization Executive",
  },
  { value: "FAMILY_MEMBER", label: "Family Member of PEP" },
  { value: "CLOSE_ASSOCIATE", label: "Close Associate of PEP" },
];

export function StepAmlCompliance({
  data,
  errors,
  onUpdate,
}: StepAmlComplianceProps) {
  const handleSourceToggle = (source: string) => {
    const currentSources = data.amlCompliance?.sourceOfFunds || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source];

    onUpdate({
      amlCompliance: {
        ...data.amlCompliance,
        sourceOfFunds: newSources,
      },
    });
  };

  // Calculate estimated risk level for display
  const getEstimatedRisk = () => {
    let risk = "LOW";

    if (data.amlCompliance?.isPep) {
      risk = "HIGH";
    } else if (
      data.clientType === "INVESTOR" ||
      data.clientType === "FOREIGN_NATIONAL"
    ) {
      risk = "MEDIUM";
    }

    return risk;
  };

  const riskLevel = getEstimatedRisk();

  const getRiskVariant = (level: string) => {
    if (level === "HIGH") {
      return "destructive";
    }
    if (level === "MEDIUM") {
      return "default";
    }
    return "secondary";
  };

  return (
    <WizardStep
      description="Anti-Money Laundering (AML) and Know Your Customer (KYC) compliance"
      title="AML/KYC Compliance"
    >
      {/* Compliance Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>CFATF Compliance Required</AlertTitle>
        <AlertDescription>
          This information is required under CFATF (Caribbean Financial Action
          Task Force) Recommendations for AML/KYC compliance. All responses will
          be kept confidential.
        </AlertDescription>
      </Alert>

      {/* Source of Funds Section */}
      <WizardStepSection className="mt-6" title="Source of Funds">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Select all sources of funds that apply to you
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-3">
          {SOURCE_OF_FUNDS.map((source) => (
            <div className="flex items-center space-x-2" key={source.value}>
              <Checkbox
                checked={data.amlCompliance?.sourceOfFunds?.includes(
                  source.value
                )}
                id={`source-${source.value}`}
                onCheckedChange={() => handleSourceToggle(source.value)}
              />
              <Label
                className="cursor-pointer font-normal"
                htmlFor={`source-${source.value}`}
              >
                {source.label}
              </Label>
            </div>
          ))}
        </div>

        {data.amlCompliance?.sourceOfFunds?.includes("OTHER") ||
        data.amlCompliance?.sourceOfFunds?.includes("BUSINESS") ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="sourceOfFundsDetails">
              Additional Details{" "}
              {data.amlCompliance?.sourceOfFunds?.includes("OTHER") ? (
                <span className="text-destructive">*</span>
              ) : null}
            </Label>
            <Textarea
              id="sourceOfFundsDetails"
              onChange={(e) =>
                onUpdate({
                  amlCompliance: {
                    ...data.amlCompliance,
                    sourceOfFundsDetails: e.target.value,
                  },
                })
              }
              placeholder="Please provide details about your source of funds"
              rows={3}
              value={data.amlCompliance?.sourceOfFundsDetails || ""}
            />
          </div>
        ) : null}

        {errors.sourceOfFunds ? (
          <p className="mt-2 text-destructive text-sm">
            {errors.sourceOfFunds}
          </p>
        ) : null}
      </WizardStepSection>

      {/* PEP Declaration Section */}
      <WizardStepSection
        className="mt-6"
        title="Politically Exposed Person (PEP) Declaration"
      >
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.amlCompliance?.isPep}
              id="isPep"
              onCheckedChange={(checked) =>
                onUpdate({
                  amlCompliance: {
                    ...data.amlCompliance,
                    isPep: checked === true,
                  },
                })
              }
            />
            <div className="flex-1">
              <Label className="cursor-pointer font-medium" htmlFor="isPep">
                I am a Politically Exposed Person (PEP) or a family member/close
                associate of a PEP
              </Label>
              <p className="mt-1 text-muted-foreground text-sm">
                A PEP is an individual who holds or has held a prominent public
                function, such as a head of state, senior government official,
                judicial or military official, or senior executive of a
                state-owned corporation.
              </p>
            </div>
          </div>

          {data.amlCompliance?.isPep ? (
            <div className="space-y-4 border-t pt-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Enhanced Due Diligence Required</AlertTitle>
                <AlertDescription>
                  As a PEP, your application will require additional review and
                  verification. This is a standard compliance procedure.
                </AlertDescription>
              </Alert>

              <WizardStepFields columns={1}>
                <div className="space-y-2">
                  <Label htmlFor="pepCategory">
                    PEP Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      onUpdate({
                        amlCompliance: {
                          ...data.amlCompliance,
                          pepCategory: value as
                            | "HEAD_OF_STATE"
                            | "GOVERNMENT_OFFICIAL"
                            | "JUDICIAL_OFFICIAL"
                            | "MILITARY_OFFICIAL"
                            | "STATE_OWNED_EXECUTIVE"
                            | "POLITICAL_PARTY_OFFICIAL"
                            | "INTERNATIONAL_ORGANIZATION"
                            | "FAMILY_MEMBER"
                            | "CLOSE_ASSOCIATE",
                        },
                      })
                    }
                    value={data.amlCompliance?.pepCategory}
                  >
                    <SelectTrigger id="pepCategory">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PEP_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pepPosition">
                    Position/Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pepPosition"
                    onChange={(e) =>
                      onUpdate({
                        amlCompliance: {
                          ...data.amlCompliance,
                          pepPosition: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Minister, Judge, General"
                    value={data.amlCompliance?.pepPosition || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pepJurisdiction">
                    Jurisdiction/Country{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pepJurisdiction"
                    onChange={(e) =>
                      onUpdate({
                        amlCompliance: {
                          ...data.amlCompliance,
                          pepJurisdiction: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Guyana, United States"
                    value={data.amlCompliance?.pepJurisdiction || ""}
                  />
                </div>
              </WizardStepFields>
            </div>
          ) : null}
        </div>
      </WizardStepSection>

      {/* Sanctions Screening Consent */}
      <WizardStepSection className="mt-6" title="Sanctions Screening Consent">
        <div className="rounded-lg border p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={data.amlCompliance?.sanctionsScreeningConsent}
              id="sanctionsScreeningConsent"
              onCheckedChange={(checked) =>
                onUpdate({
                  amlCompliance: {
                    ...data.amlCompliance,
                    sanctionsScreeningConsent: checked === true,
                  },
                })
              }
            />
            <div className="flex-1">
              <Label
                className="cursor-pointer font-medium"
                htmlFor="sanctionsScreeningConsent"
              >
                I consent to sanctions list screening{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="mt-1 text-muted-foreground text-sm">
                Your information will be automatically screened against
                international sanctions lists (OFAC, UN, EU) as required by law.
                This is a standard compliance procedure.
              </p>
            </div>
          </div>
        </div>

        {errors.sanctionsScreeningConsent ? (
          <p className="mt-2 text-destructive text-sm">
            {errors.sanctionsScreeningConsent}
          </p>
        ) : null}
      </WizardStepSection>

      {/* Risk Assessment Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Preliminary Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Risk Level:</span>
            <Badge variant={getRiskVariant(riskLevel)}>{riskLevel}</Badge>
          </div>
          <p className="mt-3 text-muted-foreground text-sm">
            This is a preliminary assessment. Final risk rating will be
            determined after submission and may require additional documentation
            or verification.
          </p>
          {riskLevel === "HIGH" ? (
            <Alert className="mt-3" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your application will require enhanced due diligence and manager
                approval. Processing may take 3-5 business days.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </WizardStep>
  );
}
