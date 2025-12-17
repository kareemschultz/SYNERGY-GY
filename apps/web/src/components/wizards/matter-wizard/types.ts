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

export type MatterDocumentUpload = {
  file: File;
  category: DocumentCategory;
  description: string;
  linkedService: string;
  linkedRequirement: string;
};

type WizardStepConfig<T> = {
  id: string;
  title: string;
  description: string;
  isOptional?: boolean;
  validate: (data: T) => Record<string, string>;
};

export type MatterWizardData = {
  // Step 1: Client
  clientId: string;
  clientName: string;

  // Step 2: Business & Service
  business: "GCMC" | "KAJ" | "";
  serviceTypeId: string;
  serviceTypeName: string;

  // Step 3: Details
  title: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  taxYear: number | undefined;

  // Step 4: Schedule & Fees
  startDate: string;
  dueDate: string;
  estimatedFee: string;

  // Step 5: Documents (optional)
  documents?: {
    files: File[];
    uploads: MatterDocumentUpload[];
  };
};

export const initialMatterData: MatterWizardData = {
  clientId: "",
  clientName: "",
  business: "",
  serviceTypeId: "",
  serviceTypeName: "",
  title: "",
  description: "",
  priority: "NORMAL",
  taxYear: undefined,
  startDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  estimatedFee: "",
};

export const matterWizardSteps: WizardStepConfig<MatterWizardData>[] = [
  {
    id: "client",
    title: "Client",
    description: "Select the client for this matter",
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.clientId) {
        errors.clientId = "Please select a client";
      }
      return errors;
    },
  },
  {
    id: "service",
    title: "Service Type",
    description: "Choose the business and service",
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.business) {
        errors.business = "Please select a business";
      }
      if (!data.serviceTypeId) {
        errors.serviceTypeId = "Please select a service type";
      }
      return errors;
    },
  },
  {
    id: "details",
    title: "Matter Details",
    description: "Enter the matter information",
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.title.trim()) {
        errors.title = "Title is required";
      }
      return errors;
    },
  },
  {
    id: "schedule",
    title: "Schedule & Fees",
    description: "Set dates and estimated fees",
    isOptional: true,
    validate: () => ({}),
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload required documents",
    isOptional: true,
    validate: () => ({}),
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm your matter details",
    validate: () => ({}),
  },
];
