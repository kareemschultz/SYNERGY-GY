import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { client } from "@/utils/orpc";
import { WizardStep } from "../wizard-step";
import { TemplateGenerator } from "./template-generator";
import {
  type ClientOnboardingData,
  getRequiredDocumentsByServices,
  inferDocumentCategory,
} from "./types";

type ServiceWithDocuments = {
  id: string;
  name: string;
  displayName: string;
  documentRequirements: string[];
};

type StepDocumentsProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

export function StepDocuments({ data, onUpdate }: StepDocumentsProps) {
  const [servicesWithDocs, setServicesWithDocs] = useState<
    ServiceWithDocuments[]
  >([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Fetch selected services to get their document requirements
  useEffect(() => {
    async function fetchServiceDetails() {
      if (!data.selectedServiceIds || data.selectedServiceIds.length === 0) {
        setServicesWithDocs([]);
        return;
      }

      setIsLoadingServices(true);
      try {
        // Fetch all service details (use allSettled to handle individual failures)
        const servicePromises = data.selectedServiceIds.map((id) =>
          client.serviceCatalog.services.getById.query({ id })
        );
        const results = await Promise.allSettled(servicePromises);

        // Extract successful results and filter for services with document requirements
        const services = results
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<
              Awaited<(typeof servicePromises)[0]>
            > => result.status === "fulfilled"
          )
          .map((result) => result.value)
          .filter(
            (service) =>
              service.documentRequirements &&
              service.documentRequirements.length > 0
          )
          .map((service) => ({
            id: service.id,
            name: service.name,
            displayName: service.displayName,
            documentRequirements: service.documentRequirements || [],
          }));

        setServicesWithDocs(services);

        // Log any failed service lookups
        const failedResults = results.filter(
          (result) => result.status === "rejected"
        );
        if (failedResults.length > 0) {
          console.warn(
            `Failed to fetch ${failedResults.length} service(s):`,
            failedResults
          );
        }
      } catch (error) {
        console.error("Failed to fetch service details:", error);
      } finally {
        setIsLoadingServices(false);
      }
    }

    fetchServiceDetails();
  }, [data.selectedServiceIds]);

  // Combine service-based and general requirements
  const generalRequirements = getRequiredDocumentsByServices(data);
  const allGeneralDocs = Object.values(generalRequirements).flat();

  // Count total requirements
  const serviceRequiredCount = servicesWithDocs.reduce(
    (sum, service) => sum + service.documentRequirements.length,
    0
  );
  const totalRequired = allGeneralDocs.length + serviceRequiredCount;

  const uploadedCount = data.documents?.uploads.length || 0;

  const handleUpload = (
    file: File,
    _category: string,
    description: string,
    service?: string
  ) => {
    const newUpload = {
      file,
      category: inferDocumentCategory(description),
      description,
      linkedService: service,
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

  const handleTemplateGenerated = (fileName: string, content: string) => {
    // Convert generated content to a File object
    const blob = new Blob([content], { type: "text/plain" });
    const file = new File([blob], fileName, { type: "text/plain" });

    const newUpload = {
      file,
      category: inferDocumentCategory(fileName),
      description: `Generated from template: ${fileName}`,
      linkedService: undefined,
      linkedRequirement: undefined,
    };

    onUpdate({
      documents: {
        files: [...(data.documents?.files || []), file],
        uploads: [...(data.documents?.uploads || []), newUpload],
      },
    });
  };

  return (
    <WizardStep
      description="Upload required documents or generate them from templates"
      title="Documents"
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

      {/* Service-specific document requirements */}
      {isLoadingServices ? (
        <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-muted-foreground">
          <p>Loading service requirements...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {servicesWithDocs.length > 0 && (
            <>
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm">
                      Service-Specific Documents
                    </h3>
                    <p className="mt-1 text-muted-foreground text-xs">
                      The following documents are required based on your
                      selected services. Upload them now or collect them later.
                    </p>
                  </div>
                </div>
              </div>

              {servicesWithDocs.map((service) => (
                <ServiceDocumentGroup
                  key={service.id}
                  onRemove={handleRemove}
                  onUpload={handleUpload}
                  requiredDocs={service.documentRequirements}
                  serviceName={service.displayName}
                  uploads={data.documents?.uploads || []}
                />
              ))}
            </>
          )}

          {/* General/Client-type requirements */}
          {Object.keys(generalRequirements).length > 0 && (
            <>
              {servicesWithDocs.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      General Requirements
                    </span>
                  </div>
                </div>
              )}

              {Object.entries(generalRequirements).map(([category, docs]) => (
                <ServiceDocumentGroup
                  key={category}
                  onRemove={handleRemove}
                  onUpload={handleUpload}
                  requiredDocs={docs}
                  serviceName={category}
                  uploads={data.documents?.uploads || []}
                />
              ))}
            </>
          )}

          {servicesWithDocs.length === 0 &&
            Object.keys(generalRequirements).length === 0 && (
              <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-muted-foreground">
                <p>
                  No specific documents required based on current selections.
                </p>
                <p className="mt-1 text-sm">
                  You can upload general documents later from the client detail
                  page.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Template Generator */}
      {data.businesses.length > 0 && (
        <div className="mt-8">
          <TemplateGenerator
            data={data}
            onTemplateGenerated={handleTemplateGenerated}
          />
        </div>
      )}

      {/* Skip information */}
      <Alert className="mt-8 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription>
          <span className="font-medium">Optional Step:</span> You can skip
          document upload now and collect them later. After creating the client,
          you'll find a "Collect Documents" page with all requirements and
          upload capability.
        </AlertDescription>
      </Alert>
    </WizardStep>
  );
}

function ServiceDocumentGroup({
  serviceName,
  requiredDocs,
  uploads,
  onUpload,
  onRemove,
}: {
  serviceName: string;
  requiredDocs: string[];
  uploads: ClientOnboardingData["documents"]["uploads"];
  onUpload: (
    file: File,
    category: string,
    description: string,
    service: string
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-medium text-base">{serviceName}</CardTitle>
        <CardDescription>
          {requiredDocs.length} document{requiredDocs.length !== 1 ? "s" : ""}{" "}
          required
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiredDocs.map((docName) => {
          const isUploaded = uploads?.some(
            (u) =>
              u.linkedRequirement === docName && u.linkedService === serviceName
          );
          const uploadIndex = uploads?.findIndex(
            (u) =>
              u.linkedRequirement === docName && u.linkedService === serviceName
          );
          const uploadedFile =
            uploadIndex !== -1 ? uploads?.[uploadIndex] : null;

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
                {isUploaded && (
                  <p className="truncate text-muted-foreground text-xs">
                    {uploadedFile?.file.name} (
                    {(uploadedFile?.file.size || 0) / 1024 < 1024
                      ? `${((uploadedFile?.file.size || 0) / 1024).toFixed(1)} KB`
                      : `${((uploadedFile?.file.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                    )
                  </p>
                )}
              </div>

              {isUploaded ? (
                <Button
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(uploadIndex!)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative">
                  <Input
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUpload(file, "OTHER", docName, serviceName);
                      }
                      // Reset input
                      e.target.value = "";
                    }}
                    type="file"
                  />
                  <Button
                    className="pointer-events-none"
                    size="sm"
                    type="button"
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
  );
}
