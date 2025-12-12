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
import {
  type ClientOnboardingData,
  getRequiredDocumentsByServices,
  inferDocumentCategory,
} from "./types";

type StepDocumentsProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

export function StepDocuments({ data, onUpdate }: StepDocumentsProps) {
  const requirements = getRequiredDocumentsByServices(data);
  const allRequirements = Object.values(requirements).flat();
  const uploadedCount = data.documents?.uploads.length || 0;
  const totalRequired = allRequirements.length;

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

  return (
    <WizardStep
      description="Upload required documents based on selected services (optional)"
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

      <div className="space-y-6">
        {Object.entries(requirements).map(([service, docs]) => (
          <ServiceDocumentGroup
            key={service}
            onRemove={handleRemove}
            onUpload={handleUpload}
            requiredDocs={docs}
            serviceName={service}
            uploads={data.documents?.uploads || []}
          />
        ))}

        {Object.keys(requirements).length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-muted-foreground">
            <p>No specific documents required based on current selections.</p>
            <p className="mt-1 text-sm">
              You can still upload general documents later.
            </p>
          </div>
        )}
      </div>

      {/* Prominent skip button */}
      <Alert className="mt-8 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription>
          You can skip this step and upload these documents later from the
          client detail page.
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
          {requiredDocs.length} documents required
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
