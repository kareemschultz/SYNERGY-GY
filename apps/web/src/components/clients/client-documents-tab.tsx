import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { TemplateGeneratorDialog } from "@/components/documents/template-generator-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";

interface ClientDocumentsTabProps {
  clientId: string;
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const [view, setView] = useState("service");

  const { data: progress } =
    client.clientServices.getFulfillmentProgress.useQuery({ clientId });
  const { data: services } = client.clientServices.getByClient.useQuery({
    clientId,
  });
  const { data: allDocuments } = client.documents.getByClient.useQuery({
    clientId,
  });

  return (
    <div className="space-y-6">
      {/* Progress & Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Document Fulfillment</CardTitle>
              <CardDescription>
                Required documents for selected services
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <TemplateGeneratorDialog
                clientId={clientId}
                trigger={
                  <Button size="sm" variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                }
              />
              <Button asChild size="sm">
                <Link to={`/app/clients/${clientId}/documents/collect`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload / Collect
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {progress
                  ? Math.round(
                      (progress.uploaded / (progress.total || 1)) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <Progress
              className="h-2"
              value={
                progress ? (progress.uploaded / (progress.total || 1)) * 100 : 0
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Tabs className="w-[400px]" onValueChange={setView} value={view}>
          <TabsList>
            <TabsTrigger value="service">By Service</TabsTrigger>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="expiring">Expiring</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "service" && (
        <div className="grid gap-6">
          {services?.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <CardTitle className="text-base">
                    {service.serviceName}
                  </CardTitle>
                  <Badge
                    variant={
                      service.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {service.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.requiredDocuments.map((req: string) => {
                  const upload = service.uploadedDocuments.find(
                    (u: any) => u.requirementName === req
                  );
                  return (
                    <div
                      className="flex items-center justify-between rounded-lg border bg-muted/10 p-3"
                      key={req}
                    >
                      <div className="flex items-center gap-3">
                        {upload ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="font-medium text-sm">{req}</span>
                      </div>
                      {upload ? (
                        <Button asChild size="sm" variant="ghost">
                          <a
                            href={`/api/download/${upload.documentId}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Missing
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
          {services?.length === 0 && (
            <div className="rounded-lg border-2 border-dashed py-12 text-center text-muted-foreground">
              No services selected for this client.
            </div>
          )}
        </div>
      )}

      {view === "all" && (
        <div className="rounded-md border">
          <div className="grid gap-4 p-4">
            {allDocuments?.map((doc) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                key={doc.id}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500/50" />
                  <div>
                    <p className="font-medium">{doc.originalName}</p>
                    <p className="text-muted-foreground text-xs">
                      {doc.category} • {(doc.fileSize / 1024).toFixed(1)} KB •{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button asChild size="icon" variant="ghost">
                  <a
                    href={`/api/download/${doc.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
            {allDocuments?.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No documents found.
              </div>
            )}
          </div>
        </div>
      )}

      {view === "expiring" && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Feature coming soon: Expiration tracking.
        </div>
      )}
    </div>
  );
}
