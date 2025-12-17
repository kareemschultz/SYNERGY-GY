import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, FileText, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

export const Route = createFileRoute(
  "/app/clients/$client-id/documents/collect"
)({
  component: ClientDocumentCollectionPage,
});

function ClientDocumentCollectionPage() {
  const { "client-id": clientId } = Route.useParams();

  const { data: services, refetch: refetchServices } = useQuery({
    queryKey: ["clientServices", "getByClient", clientId],
    queryFn: () => client.clientServices.getByClient({ clientId }),
  });
  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ["clientServices", "getFulfillmentProgress", clientId],
    queryFn: () => client.clientServices.getFulfillmentProgress({ clientId }),
  });

  const refetch = () => {
    refetchServices();
    refetchProgress();
  };

  if (!(services && progress)) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients", href: "/app/clients" },
          { label: "Client Details", href: `/app/clients/${clientId}` },
          { label: "Collect Documents" },
        ]}
        description={`${progress.uploaded} of ${progress.total} documents uploaded`}
        title="Collect Required Documents"
      />

      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Progress</span>
          <span>
            {Math.round((progress.uploaded / (progress.total || 1)) * 100)}%
          </span>
        </div>
        <Progress
          className="h-2"
          value={(progress.uploaded / (progress.total || 1)) * 100}
        />
      </div>

      <div className="grid gap-6">
        {services.map((service) => (
          <ServiceDocumentCollectionCard
            key={service.id}
            onDocumentUploaded={refetch}
            service={service}
          />
        ))}

        {services.length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
            <p>No active service selections found for this client.</p>
            <p className="mt-1 text-sm">
              Add services to the client to see document requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceDocumentCollectionCard({
  service,
  onDocumentUploaded,
}: {
  service: any;
  onDocumentUploaded: () => void;
}) {
  // Mock logic for now as we don't have the full type of 'service' here easily without importing from DB or API
  // Assuming service has: serviceName, requiredDocuments (string[]), uploadedDocuments (object[])

  const requiredDocs = service.requiredDocuments || [];
  const uploads = service.uploadedDocuments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service.serviceName}</CardTitle>
        <CardDescription>
          {uploads.length} of {requiredDocs.length} documents provided
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiredDocs.map((reqName: string) => {
          const isUploaded = uploads.some(
            (u: any) => u.requirementName === reqName
          );
          const upload = uploads.find(
            (u: any) => u.requirementName === reqName
          );

          return (
            <div
              className="flex items-center gap-4 rounded-lg border p-3"
              key={reqName}
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
                <p className="truncate font-medium text-sm">{reqName}</p>
                {isUploaded && (
                  <p className="truncate text-muted-foreground text-xs">
                    Uploaded on{" "}
                    {new Date(upload.uploadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {isUploaded ? (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`/api/download/${upload.documentId}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View
                  </a>
                </Button>
              ) : (
                <Button size="sm" variant="outline">
                  <Upload className="mr-2 h-3 w-3" />
                  Upload
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
