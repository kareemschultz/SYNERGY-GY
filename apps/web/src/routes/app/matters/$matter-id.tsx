import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { TimeEntriesList } from "@/components/time-tracking/time-entries-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/app/matters/$matter-id")({
  component: MatterDetailPage,
});

// Matter type for unwrapping
type MatterData = {
  id: string;
  referenceNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  business: string;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  estimatedFee: string | null;
  actualFee: string | null;
  isPaid: boolean;
  taxYear: number | null;
  createdAt: Date;
  client: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
  } | null;
  serviceType: {
    id: string;
    name: string;
    category: string | null;
  } | null;
  assignedStaff: {
    user: {
      id: string;
      name: string;
    };
  } | null;
  checklist: Array<{
    id: string;
    item: string;
    isCompleted: boolean;
    completedAt: Date | null;
    completedBy: { name: string } | null;
    sortOrder: number;
  }>;
  notes: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    createdBy: { name: string } | null;
  }>;
};

const _statusOptions = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PENDING_CLIENT", label: "Pending Client" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "COMPLETE", label: "Complete" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const _statusStyles: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-600 border-blue-200",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  PENDING_CLIENT: "bg-orange-500/10 text-orange-600 border-orange-200",
  SUBMITTED: "bg-purple-500/10 text-purple-600 border-purple-200",
  COMPLETE: "bg-green-500/10 text-green-600 border-green-200",
  CANCELLED: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const _priorityStyles: Record<string, string> = {
  LOW: "bg-gray-500/10 text-gray-600",
  NORMAL: "bg-blue-500/10 text-blue-600",
  HIGH: "bg-orange-500/10 text-orange-600",
  URGENT: "bg-red-500/10 text-red-600",
};

function MatterDetailPage() {
  const { "matter-id": matterId } = Route.useParams();

  const {
    data: matterRaw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => client.matters.getById({ id: matterId }),
  });

  // Unwrap oRPC response envelope (v1.12+ wraps in { json: T })
  const matter = unwrapOrpc<MatterData>(matterRaw);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !matter) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Matter not found</p>
        <Button asChild variant="outline">
          <Link to="/app/matters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matters
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link to="/app/matters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Matters", href: "/app/matters" },
          { label: matter.referenceNumber },
        ]}
        description={matter.title}
        title={matter.referenceNumber}
      />

      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checklist">
                Checklist ({matter.checklist?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notes ({matter.notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="time">
                <Clock className="mr-1 h-4 w-4" />
                Time
              </TabsTrigger>
            </TabsList>

            <TabsContent className="mt-6" value="overview">
              <OverviewTab matter={matter} />
            </TabsContent>

            <TabsContent className="mt-6" value="checklist">
              <ChecklistTab matter={matter} />
            </TabsContent>

            <TabsContent className="mt-6" value="notes">
              <NotesTab matter={matter} />
            </TabsContent>

            <TabsContent className="mt-6" value="documents">
              <DocumentsTab matterId={matter.id} />
            </TabsContent>

            <TabsContent className="mt-6" value="time">
              <TimeEntriesList
                matterId={matter.id}
                matterReference={matter.referenceNumber}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-600 border-blue-200",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  PENDING_CLIENT: "bg-orange-500/10 text-orange-600 border-orange-200",
  SUBMITTED: "bg-purple-500/10 text-purple-600 border-purple-200",
  COMPLETE: "bg-green-500/10 text-green-600 border-green-200",
  CANCELLED: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-gray-500/10 text-gray-600",
  NORMAL: "bg-blue-500/10 text-blue-600",
  HIGH: "bg-orange-500/10 text-orange-600",
  URGENT: "bg-red-500/10 text-red-600",
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Matter overview displays details, dates, fees, client info, and assigned staff across multiple conditional sections
function OverviewTab({ matter }: { matter: MatterData }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Matter Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Status
              </p>
              <Badge
                className={statusStyles[matter.status] || ""}
                variant="outline"
              >
                {matter.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Priority
              </p>
              <Badge
                className={priorityStyles[matter.priority] || ""}
                variant="outline"
              >
                {matter.priority}
              </Badge>
            </div>
          </div>
          {matter.description ? (
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Description
              </p>
              <p className="text-sm">{matter.description}</p>
            </div>
          ) : null}
          <div>
            <p className="mb-1 font-medium text-muted-foreground text-sm">
              Business
            </p>
            <p className="text-sm">{matter.business}</p>
          </div>
          {matter.serviceType ? (
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Service Type
              </p>
              <p className="text-sm">{matter.serviceType.name}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dates & Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {matter.startDate ? (
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Start Date
              </p>
              <p className="text-sm">
                {new Date(matter.startDate).toLocaleDateString()}
              </p>
            </div>
          ) : null}
          {matter.dueDate ? (
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Due Date
              </p>
              <p className="text-sm">
                {new Date(matter.dueDate).toLocaleDateString()}
              </p>
            </div>
          ) : null}
          {matter.estimatedFee ? (
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Estimated Fee
              </p>
              <p className="flex items-center gap-1 text-sm">
                <DollarSign className="h-4 w-4" />
                {Number(matter.estimatedFee).toLocaleString()}
              </p>
            </div>
          ) : null}
          {matter.actualFee ? (
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Actual Fee
              </p>
              <p className="flex items-center gap-1 text-sm">
                <DollarSign className="h-4 w-4" />
                {Number(matter.actualFee).toLocaleString()}
              </p>
            </div>
          ) : null}
          <div>
            <p className="mb-1 font-medium text-muted-foreground text-sm">
              Payment Status
            </p>
            <Badge variant={matter.isPaid ? "default" : "secondary"}>
              {matter.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {matter.client ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 font-medium text-muted-foreground text-sm">
                Name
              </p>
              <p className="text-sm">{matter.client.displayName}</p>
            </div>
            {matter.client.email ? (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Email
                </p>
                <p className="text-sm">{matter.client.email}</p>
              </div>
            ) : null}
            {matter.client.phone ? (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Phone
                </p>
                <p className="text-sm">{matter.client.phone}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {matter.assignedStaff ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{matter.assignedStaff.user.name}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ChecklistTab({ matter }: { matter: MatterData }) {
  const completedCount = matter.checklist.filter(
    (item) => item.isCompleted
  ).length;
  const totalCount = matter.checklist.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Checklist</CardTitle>
          <p className="mt-1 text-muted-foreground text-sm">
            {completedCount} of {totalCount} items completed
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {matter.checklist.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No checklist items for this matter.
          </p>
        ) : (
          <div className="space-y-3">
            {matter.checklist
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <div
                  className="flex items-center gap-3 rounded-lg border p-3"
                  key={item.id}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${item.isCompleted ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.item}
                    </p>
                    {item.isCompleted === true && item.completedBy !== null ? (
                      <p className="text-muted-foreground text-xs">
                        Completed by {item.completedBy.name}
                        {item.completedAt
                          ? ` on ${new Date(item.completedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({ matter }: { matter: MatterData }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notes</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {matter.notes.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No notes for this matter.
          </p>
        ) : (
          <div className="space-y-4">
            {matter.notes.map((note) => (
              <div className="rounded-lg border p-4" key={note.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {note.createdBy?.name || "Unknown"}
                  </p>
                  <div className="flex items-center gap-2">
                    {note.isInternal ? (
                      <Badge variant="secondary">Internal</Badge>
                    ) : null}
                    <span className="text-muted-foreground text-xs">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsTab({ matterId }: { matterId: string }) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", "getByMatter", matterId],
    queryFn: () => client.documents.getByMatter({ matterId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </CardHeader>
      <CardContent>
        {!documents || documents.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No documents linked to this matter.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map(
              (doc: {
                id: string;
                originalName: string;
                category: string;
                fileSize: number;
                createdAt: Date;
              }) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  key={doc.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.originalName}</p>
                      <p className="text-muted-foreground text-xs">
                        {doc.category} • {(doc.fileSize / 1024).toFixed(1)} KB •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function _InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-medium text-muted-foreground text-sm">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
