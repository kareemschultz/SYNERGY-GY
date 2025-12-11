/**
 * Template Placeholder Definitions
 *
 * Available placeholders for document templates organized by source
 */

export interface PlaceholderDefinition {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "currency";
  source: "client" | "matter" | "staff" | "business" | "date" | "custom";
  description?: string;
}

export const CLIENT_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    key: "client.displayName",
    label: "Client Name",
    type: "text",
    source: "client",
    description: "Full name or business name of the client",
  },
  {
    key: "client.email",
    label: "Client Email",
    type: "text",
    source: "client",
    description: "Client's email address",
  },
  {
    key: "client.phone",
    label: "Client Phone",
    type: "text",
    source: "client",
    description: "Client's phone number",
  },
  {
    key: "client.address",
    label: "Client Address",
    type: "text",
    source: "client",
    description: "Client's physical address",
  },
  {
    key: "client.tin",
    label: "Client TIN",
    type: "text",
    source: "client",
    description: "Tax Identification Number",
  },
  {
    key: "client.idNumber",
    label: "Client ID Number",
    type: "text",
    source: "client",
    description: "National ID or passport number",
  },
  {
    key: "client.clientType",
    label: "Client Type",
    type: "text",
    source: "client",
    description: "Type of client (Individual, Corporation, etc.)",
  },
];

export const MATTER_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    key: "matter.referenceNumber",
    label: "Matter Reference",
    type: "text",
    source: "matter",
    description: "Unique reference number for the matter",
  },
  {
    key: "matter.title",
    label: "Matter Title",
    type: "text",
    source: "matter",
    description: "Title or description of the matter",
  },
  {
    key: "matter.description",
    label: "Matter Description",
    type: "text",
    source: "matter",
    description: "Detailed description of the matter",
  },
  {
    key: "matter.serviceType",
    label: "Service Type",
    type: "text",
    source: "matter",
    description: "Type of service being provided",
  },
  {
    key: "matter.status",
    label: "Matter Status",
    type: "text",
    source: "matter",
    description: "Current status of the matter",
  },
];

export const STAFF_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    key: "staff.user.name",
    label: "Staff Name",
    type: "text",
    source: "staff",
    description: "Name of the staff member creating the document",
  },
  {
    key: "staff.user.email",
    label: "Staff Email",
    type: "text",
    source: "staff",
    description: "Email address of the staff member",
  },
  {
    key: "staff.jobTitle",
    label: "Staff Job Title",
    type: "text",
    source: "staff",
    description: "Job title of the staff member",
  },
  {
    key: "staff.phone",
    label: "Staff Phone",
    type: "text",
    source: "staff",
    description: "Phone number of the staff member",
  },
];

export const BUSINESS_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    key: "business.GCMC.name",
    label: "GCMC Name",
    type: "text",
    source: "business",
    description: "Green Crescent Management Consultancy",
  },
  {
    key: "business.GCMC.address",
    label: "GCMC Address",
    type: "text",
    source: "business",
    description: "GCMC physical address",
  },
  {
    key: "business.GCMC.phone",
    label: "GCMC Phone",
    type: "text",
    source: "business",
    description: "GCMC contact phone number",
  },
  {
    key: "business.GCMC.email",
    label: "GCMC Email",
    type: "text",
    source: "business",
    description: "GCMC contact email",
  },
  {
    key: "business.KAJ.name",
    label: "KAJ Name",
    type: "text",
    source: "business",
    description: "Kareem Abdul-Jabar Tax & Accounting Services",
  },
  {
    key: "business.KAJ.address",
    label: "KAJ Address",
    type: "text",
    source: "business",
    description: "KAJ physical address",
  },
  {
    key: "business.KAJ.phone",
    label: "KAJ Phone",
    type: "text",
    source: "business",
    description: "KAJ contact phone number",
  },
  {
    key: "business.KAJ.email",
    label: "KAJ Email",
    type: "text",
    source: "business",
    description: "KAJ contact email",
  },
];

export const DATE_PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    key: "date.today",
    label: "Today's Date",
    type: "date",
    source: "date",
    description: "Current date (YYYY-MM-DD format)",
  },
  {
    key: "date.todayFormatted",
    label: "Today's Date (Formatted)",
    type: "date",
    source: "date",
    description: "Current date in long format (e.g., January 1, 2024)",
  },
];

export const ALL_PLACEHOLDERS = [
  ...CLIENT_PLACEHOLDERS,
  ...MATTER_PLACEHOLDERS,
  ...STAFF_PLACEHOLDERS,
  ...BUSINESS_PLACEHOLDERS,
  ...DATE_PLACEHOLDERS,
];

export const PLACEHOLDER_GROUPS = [
  { label: "Client Information", placeholders: CLIENT_PLACEHOLDERS },
  { label: "Matter Information", placeholders: MATTER_PLACEHOLDERS },
  { label: "Staff Information", placeholders: STAFF_PLACEHOLDERS },
  { label: "Business Information", placeholders: BUSINESS_PLACEHOLDERS },
  { label: "Date & Time", placeholders: DATE_PLACEHOLDERS },
];
