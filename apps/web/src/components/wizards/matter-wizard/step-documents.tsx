import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { WizardStep } from "../wizard-step";

// DocumentCategory matches the database enum
type DocumentCategory =
  | "IDENTITY"
  | "TAX"
  | "FINANCIAL"
  | "LEGAL"
  | "IMMIGRATION"
  | "BUSINESS"
  | "CORRESPONDENCE"
  | "TRAINING"
  | "OTHER";

import type { MatterWizardData } from "./types";

type StepDocumentsProps = {
  data: MatterWizardData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MatterWizardData>) => void;
};

/**
 * Infer document category from document name for automatic categorization
 */
function inferDocumentCategory(documentName: string): DocumentCategory {
  const lower = documentName.toLowerCase();

  // Identification documents
  if (
    lower.includes("passport") ||
    lower.includes("national id") ||
    lower.includes("birth certificate") ||
    lower.includes("id card") ||
    lower.includes("driver") ||
    lower.includes("photo id")
  ) {
    return "IDENTITY";
  }

  // Tax-related documents
  if (
    lower.includes("tin") ||
    lower.includes("tax return") ||
    lower.includes("tax clearance") ||
    lower.includes("paye") ||
    lower.includes("vat") ||
    lower.includes("itr") ||
    lower.includes("gra") ||
    lower.includes("tax compliance")
  ) {
    return "TAX";
  }

  // NIS documents
  if (
    lower.includes("nis") ||
    lower.includes("national insurance") ||
    lower.includes("social security")
  ) {
    return "OTHER";
  }

  // Financial documents
  if (
    lower.includes("bank statement") ||
    lower.includes("financial statement") ||
    lower.includes("income statement") ||
    lower.includes("balance sheet") ||
    lower.includes("cash flow") ||
    lower.includes("payslip") ||
    lower.includes("salary") ||
    lower.includes("proof of income")
  ) {
    return "FINANCIAL";
  }

  // Immigration documents
  if (
    lower.includes("work permit") ||
    lower.includes("visa") ||
    lower.includes("citizenship") ||
    lower.includes("immigration") ||
    lower.includes("residence") ||
    lower.includes("travel")
  ) {
    return "IMMIGRATION";
  }

  // Certificates
  if (
    lower.includes("certificate") ||
    lower.includes("registration") ||
    lower.includes("incorporation") ||
    lower.includes("compliance")
  ) {
    return "BUSINESS";
  }

  // Agreements
  if (
    lower.includes("agreement") ||
    lower.includes("contract") ||
    lower.includes("affidavit") ||
    lower.includes("deed") ||
    lower.includes("will") ||
    lower.includes("power of attorney")
  ) {
    return "LEGAL";
  }

  // Correspondence
  if (
    lower.includes("letter") ||
    lower.includes("email") ||
    lower.includes("correspondence") ||
    lower.includes("notice") ||
    lower.includes("communication")
  ) {
    return "CORRESPONDENCE";
  }

  return "OTHER";
}

/**
 * Get document requirements based on the selected service type
 */
function getDocumentRequirementsByService(serviceTypeName: string): string[] {
  const serviceLower = serviceTypeName.toLowerCase();

  // Tax services
  if (
    serviceLower.includes("individual tax") ||
    serviceLower.includes("personal tax")
  ) {
    return [
      "Valid Passport or National ID",
      "TIN Certificate",
      "Bank Statements (12 months)",
      "Employment Letters",
      "Salary Slips",
      "Previous Year Tax Returns",
    ];
  }

  if (
    serviceLower.includes("corporate tax") ||
    serviceLower.includes("business tax")
  ) {
    return [
      "Certificate of Incorporation",
      "TIN Certificate",
      "Business Registration",
      "Financial Statements",
      "Bank Statements (12 months)",
      "Previous Year Tax Returns",
      "Shareholder Information",
    ];
  }

  if (serviceLower.includes("self-employed")) {
    return [
      "Valid Passport or National ID",
      "TIN Certificate",
      "Business Registration (if applicable)",
      "Bank Statements (12 months)",
      "Income Records/Invoices",
      "Expense Receipts",
    ];
  }

  // Compliance
  if (
    serviceLower.includes("compliance") ||
    serviceLower.includes("clearance")
  ) {
    return [
      "TIN Certificate",
      "Tax Returns (last 2 years)",
      "Bank Statements",
      "Business Registration",
    ];
  }

  // PAYE services
  if (serviceLower.includes("paye")) {
    return [
      "TIN Certificate",
      "Employee List",
      "Salary Records",
      "NIS Registration",
    ];
  }

  // NIS services
  if (serviceLower.includes("nis")) {
    return [
      "NIS Registration Certificate",
      "Employee Records",
      "Contribution Schedules",
      "Bank Statements",
    ];
  }

  // Financial statements
  if (
    serviceLower.includes("statement") ||
    serviceLower.includes("financial")
  ) {
    return [
      "Bank Statements (12 months)",
      "Income Records",
      "Expense Records",
      "Business Registration",
    ];
  }

  // Audit services
  if (serviceLower.includes("audit")) {
    return [
      "Financial Statements",
      "Bank Statements",
      "Business Registration",
      "Board Resolutions",
      "Previous Audit Reports",
    ];
  }

  // Work permit services
  if (serviceLower.includes("work permit")) {
    return [
      "Valid Passport (6+ months validity)",
      "Passport Photos (2)",
      "CV/Resume",
      "Educational Certificates",
      "Professional Certificates",
      "Police Clearance (home country)",
      "Medical Certificate",
      "Employment Contract",
      "Company Registration (employer)",
    ];
  }

  // Citizenship
  if (serviceLower.includes("citizenship")) {
    return [
      "Valid Passport",
      "Birth Certificate",
      "Marriage Certificate (if applicable)",
      "Proof of Residence (5+ years)",
      "Police Clearance",
      "Tax Compliance Certificate",
      "Character References",
    ];
  }

  // Business registration
  if (
    serviceLower.includes("incorporation") ||
    serviceLower.includes("company registration")
  ) {
    return [
      "Proposed Company Name",
      "Director IDs",
      "Shareholder IDs",
      "Registered Address Proof",
      "Articles of Incorporation Draft",
    ];
  }

  if (
    serviceLower.includes("business registration") ||
    serviceLower.includes("sole proprietor")
  ) {
    return ["Valid ID", "Business Name Proposal", "Business Address Proof"];
  }

  // NPO/Co-op
  if (serviceLower.includes("npo") || serviceLower.includes("non-profit")) {
    return [
      "Constitution/Bylaws Draft",
      "Executive Member IDs",
      "Registered Address Proof",
      "Mission Statement",
    ];
  }

  if (serviceLower.includes("cooperative") || serviceLower.includes("co-op")) {
    return [
      "Cooperative Bylaws",
      "Member List",
      "Executive Committee IDs",
      "Registered Address Proof",
    ];
  }

  // Paralegal services
  if (serviceLower.includes("affidavit")) {
    return ["Valid ID", "Supporting Documents", "Draft Statement"];
  }

  if (serviceLower.includes("agreement") || serviceLower.includes("contract")) {
    return ["Party IDs", "Terms Outline", "Property Documents (if applicable)"];
  }

  if (serviceLower.includes("will")) {
    return [
      "Valid ID",
      "Beneficiary Information",
      "Asset List",
      "Executor Details",
    ];
  }

  // Training services
  if (serviceLower.includes("training")) {
    return [
      "Participant List",
      "Company Registration (for corporate training)",
      "Contact Information",
    ];
  }

  // Consulting/Proposals
  if (
    serviceLower.includes("proposal") ||
    serviceLower.includes("consulting")
  ) {
    return [
      "Business Plan Draft",
      "Financial Projections",
      "Supporting Documents",
    ];
  }

  // Default - general documents
  return ["Valid ID (Passport or National ID)", "Supporting Documents"];
}

export function StepDocuments({ data, onUpdate }: StepDocumentsProps) {
  const requirements = getDocumentRequirementsByService(data.serviceTypeName);
  const uploadedCount = data.documents?.uploads?.length || 0;
  const totalRequired = requirements.length;

  const handleUpload = (file: File, description: string) => {
    const newUpload = {
      file,
      category: inferDocumentCategory(description),
      description,
      linkedService: data.serviceTypeName,
      linkedRequirement: description,
    };

    onUpdate({
      documents: {
        files: [...(data.documents?.files || []), file],
        uploads: [...(data.documents?.uploads || []), newUpload],
      },
    });
  };

  const handleRemove = (index: number) => {
    const newUploads = [...(data.documents?.uploads || [])];
    const newFiles = [...(data.documents?.files || [])];

    newUploads.splice(index, 1);
    newFiles.splice(index, 1);

    onUpdate({
      documents: {
        files: newFiles,
        uploads: newUploads,
      },
    });
  };

  return (
    <WizardStep
      description="Upload required documents for this matter (optional)"
      title="Upload Documents"
    >
      {/* Document fulfillment progress */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Document Completion</span>
          <span className="text-muted-foreground">
            {uploadedCount} of {totalRequired} required
          </span>
        </div>
        <Progress
          className="h-2"
          value={totalRequired > 0 ? (uploadedCount / totalRequired) * 100 : 0}
        />
      </div>

      {/* Service-specific requirements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-base">
            {data.serviceTypeName || "Service Documents"}
          </CardTitle>
          <CardDescription>
            {requirements.length} documents required for this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requirements.map((docName) => {
            const isUploaded = data.documents?.uploads?.some(
              (u) => u.linkedRequirement === docName
            );
            const uploadIndex =
              data.documents?.uploads?.findIndex(
                (u) => u.linkedRequirement === docName
              ) ?? -1;
            const uploadedFile =
              uploadIndex !== -1
                ? data.documents?.uploads?.[uploadIndex]
                : null;

            return (
              <div
                className="flex items-center gap-4 rounded-lg border p-3"
                key={docName}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                    isUploaded
                      ? "border-green-200 bg-green-100 text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "border-muted-foreground/20 bg-muted text-muted-foreground"
                  )}
                >
                  {isUploaded ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{docName}</p>
                  {isUploaded && uploadedFile && (
                    <p className="truncate text-muted-foreground text-xs">
                      {uploadedFile.file.name} (
                      {(uploadedFile.file.size || 0) / 1024 < 1024
                        ? `${((uploadedFile.file.size || 0) / 1024).toFixed(1)} KB`
                        : `${((uploadedFile.file.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                      )
                    </p>
                  )}
                </div>

                {isUploaded ? (
                  <Button
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(uploadIndex)}
                    size="icon"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="relative">
                    <Input
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpload(file, docName);
                        }
                        e.target.value = "";
                      }}
                      type="file"
                    />
                    <Button
                      className="pointer-events-none"
                      size="sm"
                      variant="outline"
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      Upload
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Skip info */}
      <Alert className="mt-8 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription>
          You can skip this step and upload documents later from the matter
          detail page.
        </AlertDescription>
      </Alert>
    </WizardStep>
  );
}
