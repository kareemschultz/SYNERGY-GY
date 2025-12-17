import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/app/matters/$matter-id")({
  component: MatterDetailPage,
});

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
    data: matter,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => client.matters.getById({ id: matterId }),
  });

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
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ... MatterData type ... (keep existing)
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

function OverviewTab({ matter }: { matter: MatterData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Description</p>
            <p>{matter.description || "No description"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Service Type</p>
            <p>{matter.serviceType?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Assigned Staff</p>
            <p>{matter.assignedStaff?.user.name || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Estimated Fee</p>
            <p>{matter.estimatedFee ? `GYD ${matter.estimatedFee}` : "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistTab({ matter }: { matter: MatterData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        {matter.checklist.length === 0 ? (
          <p className="text-center text-muted-foreground">No checklist items</p>
        ) : (
          <ul className="space-y-2">
            {matter.checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  checked={item.isCompleted}
                  disabled
                  readOnly
                  type="checkbox"
                />
                <span className={item.isCompleted ? "line-through text-muted-foreground" : ""}>
                  {item.item}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({ matter }: { matter: MatterData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {matter.notes.length === 0 ? (
          <p className="text-center text-muted-foreground">No notes</p>
        ) : (
          <div className="space-y-4">
            {matter.notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {note.createdBy?.name || "System"} •{" "}
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.isInternal && (
                    <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                      Internal
                    </span>
                  )}
                </div>
                <p>{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsTab({ matterId }: { matterId: string }) {
  const { data: documents, isLoading } = useQuery(
    orpc.documents.getByMatter.queryOptions({
      input: { matterId },
    })
  );

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
            {documents.map((doc) => (
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ... OverviewTab ... (keep existing)
// ... ChecklistTab ... (keep existing)
// ... NotesTab ... (keep existing)

function _InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-medium text-muted-foreground text-sm">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
