import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Loader2,
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
import { unwrapOrpc } from "@/utils/orpc-response";

// Types for document data
type FulfillmentProgress = {
  total: number;
  uploaded: number;
};

type ServiceDocument = {
  id: string;
  serviceName: string;
  status: string;
  requiredDocuments: string[];
  uploadedDocuments: Array<{ requirementName: string; documentId: string }>;
};

type DocumentItem = {
  id: string;
  originalName: string;
  category: string;
  fileSize: number;
  createdAt: string;
  expirationDate?: string;
  client?: { id: string } | null;
};

type ClientDocumentsTabProps = {
  clientId: string;
};

// Helper to calculate days until expiration
function getDaysUntilExpiration(expirationDate: string): number {
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// Helper to get urgency level
function getExpirationUrgency(daysUntil: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  icon: typeof AlertTriangle;
} {
  if (daysUntil <= 0) {
    return {
      color: "text-red-700",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      label: "Expired",
      icon: AlertCircle,
    };
  }
  if (daysUntil <= 7) {
    return {
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      label: "Critical",
      icon: AlertTriangle,
    };
  }
  if (daysUntil <= 30) {
    return {
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      label: "Warning",
      icon: Clock,
    };
  }
  return {
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    label: "Upcoming",
    icon: Calendar,
  };
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const [view, setView] = useState("service");

  const { data: progressRaw } = useQuery({
    queryKey: ["clientServices", "getFulfillmentProgress", clientId],
    queryFn: () => client.clientServices.getFulfillmentProgress({ clientId }),
  });
  const progress = unwrapOrpc<FulfillmentProgress>(progressRaw);

  const { data: servicesRaw } = useQuery({
    queryKey: ["clientServices", "getByClient", clientId],
    queryFn: () => client.clientServices.getByClient({ clientId }),
  });
  const services = unwrapOrpc<ServiceDocument[]>(servicesRaw);

  const { data: allDocumentsRaw } = useQuery({
    queryKey: ["documents", "getByClient", clientId],
    queryFn: () => client.documents.getByClient({ clientId }),
  });
  const allDocuments = unwrapOrpc<DocumentItem[]>(allDocumentsRaw);

  const { data: expiringDocumentsRaw, isLoading: expiringLoading } = useQuery({
    queryKey: ["documents", "getExpiring", 90],
    queryFn: () => client.documents.getExpiring({ daysAhead: 90 }),
    enabled: view === "expiring",
  });
  const expiringDocuments = unwrapOrpc<DocumentItem[]>(expiringDocumentsRaw);

  // Filter expiring documents for this client
  const clientExpiringDocs = expiringDocuments?.filter(
    (doc) => doc.client?.id === clientId
  );

  // Helper function to format days until expiration
  const formatDaysUntil = (daysUntil: number | null): string => {
    if (daysUntil === null) {
      return "N/A";
    }
    if (daysUntil <= 0) {
      return "Expired";
    }
    return `${daysUntil} days`;
  };

  // Render function for expiring documents view
  const renderExpiringContent = () => {
    if (expiringLoading) {
      return (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading expiring documents...
        </div>
      );
    }

    if (!clientExpiringDocs || clientExpiringDocs.length === 0) {
      return (
        <div className="rounded-lg border-2 border-dashed py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-muted-foreground">
            No documents expiring soon
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            Documents with expiration dates within the next 90 days will appear
            here
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-3 gap-4">
          {/* Expired */}
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700 text-sm">
                  Expired
                </span>
              </div>
              <p className="mt-1 font-bold text-2xl text-red-700">
                {
                  clientExpiringDocs.filter(
                    (d) =>
                      Boolean(d.expirationDate) &&
                      getDaysUntilExpiration(d.expirationDate ?? "") <= 0
                  ).length
                }
              </p>
            </CardContent>
          </Card>
          {/* Critical (1-7 days) */}
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-700 text-sm">
                  Critical (7 days)
                </span>
              </div>
              <p className="mt-1 font-bold text-2xl text-amber-700">
                {
                  clientExpiringDocs.filter((d) => {
                    if (!d.expirationDate) {
                      return false;
                    }
                    const days = getDaysUntilExpiration(d.expirationDate);
                    return days > 0 && days <= 7;
                  }).length
                }
              </p>
            </CardContent>
          </Card>
          {/* Warning (8-30 days) */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700 text-sm">
                  Upcoming (30 days)
                </span>
              </div>
              <p className="mt-1 font-bold text-2xl text-blue-700">
                {
                  clientExpiringDocs.filter((d) => {
                    if (!d.expirationDate) {
                      return false;
                    }
                    const days = getDaysUntilExpiration(d.expirationDate);
                    return days > 7 && days <= 30;
                  }).length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <div className="grid gap-3 p-4">
            {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Rendering expiring documents requires conditional styling based on urgency level, expiration status, and multiple display properties */}
            {clientExpiringDocs.map((doc) => {
              const daysUntil = doc.expirationDate
                ? getDaysUntilExpiration(doc.expirationDate)
                : null;
              const urgency =
                daysUntil !== null ? getExpirationUrgency(daysUntil) : null;
              const UrgencyIcon = urgency?.icon || Calendar;

              return (
                <div
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${urgency?.bgColor || ""} ${urgency?.borderColor || ""}`}
                  key={doc.id}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${urgency?.bgColor || "bg-gray-100"}`}
                    >
                      <UrgencyIcon
                        className={`h-5 w-5 ${urgency?.color || "text-gray-500"}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{doc.originalName}</p>
                      <p className="text-muted-foreground text-sm">
                        {doc.category} •{" "}
                        {doc.expirationDate
                          ? new Date(doc.expirationDate).toLocaleDateString()
                          : "No expiration set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        urgency
                          ? `${urgency.bgColor} ${urgency.color} border-current`
                          : ""
                      }
                      variant="outline"
                    >
                      {formatDaysUntil(daysUntil)}
                    </Badge>
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
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

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
                    (u: { requirementName: string; documentId: string }) =>
                      u.requirementName === req
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
          {services?.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed py-12 text-center text-muted-foreground">
              No services selected for this client.
            </div>
          ) : null}
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
            {allDocuments?.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No documents found.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {view === "expiring" && (
        <div className="space-y-4">{renderExpiringContent()}</div>
      )}
    </div>
  );
}
