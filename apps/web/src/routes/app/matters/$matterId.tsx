import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Circle,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/matters/$matterId")({
  component: MatterDetailPage,
});

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PENDING_CLIENT", label: "Pending Client" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "COMPLETE", label: "Complete" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

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

function MatterDetailPage() {
  const { matterId } = Route.useParams();

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
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface MatterData {
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
}

function OverviewTab({ matter }: { matter: MatterData }) {
  const [status, setStatus] = useState(matter.status);

  const updateMutation = useMutation({
    mutationFn: (newStatus: string) =>
      client.matters.update({
        id: matter.id,
        status: newStatus as
          | "NEW"
          | "IN_PROGRESS"
          | "PENDING_CLIENT"
          | "SUBMITTED"
          | "COMPLETE"
          | "CANCELLED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
      setStatus(matter.status);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateMutation.mutate(newStatus);
  };

  const completedTasks = matter.checklist.filter((c) => c.isCompleted).length;
  const totalTasks = matter.checklist.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Info */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Matter Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="Reference" value={matter.referenceNumber} />
              <InfoRow label="Title" value={matter.title} />
              <InfoRow
                label="Business"
                value={
                  <Badge
                    className={
                      matter.business === "GCMC"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-blue-500/10 text-blue-600"
                    }
                    variant="outline"
                  >
                    {matter.business}
                  </Badge>
                }
              />
              <InfoRow
                label="Service Type"
                value={matter.serviceType?.name || "-"}
              />
              <InfoRow
                label="Category"
                value={matter.serviceType?.category || "-"}
              />
              <InfoRow label="Tax Year" value={matter.taxYear || "-"} />
            </div>
            {matter.description && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-sm">
                  Description
                </p>
                <p className="text-sm">{matter.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            {matter.client ? (
              <div className="space-y-2">
                <Link
                  className="font-medium text-lg hover:underline"
                  params={{ clientId: matter.client.id }}
                  to="/app/clients/$clientId"
                >
                  {matter.client.displayName}
                </Link>
                {matter.client.email && (
                  <p className="text-muted-foreground text-sm">
                    {matter.client.email}
                  </p>
                )}
                {matter.client.phone && (
                  <p className="text-muted-foreground text-sm">
                    {matter.client.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No client assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoRow
                label="Estimated Fee"
                value={
                  matter.estimatedFee
                    ? `GYD ${Number(matter.estimatedFee).toLocaleString()}`
                    : "-"
                }
              />
              <InfoRow
                label="Actual Fee"
                value={
                  matter.actualFee
                    ? `GYD ${Number(matter.actualFee).toLocaleString()}`
                    : "-"
                }
              />
              <InfoRow
                label="Payment Status"
                value={
                  <Badge
                    className={
                      matter.isPaid
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }
                    variant="outline"
                  >
                    {matter.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={handleStatusChange} value={status}>
              <SelectTrigger
                className={statusStyles[status]}
                disabled={updateMutation.isPending}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge
                className={priorityStyles[matter.priority]}
                variant="outline"
              >
                {matter.priority} Priority
              </Badge>
            </div>

            {totalTasks > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {completedTasks}/{totalTasks}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Start:</span>
              <span>
                {matter.startDate
                  ? new Date(matter.startDate).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span>
                {matter.dueDate
                  ? new Date(matter.dueDate).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            {matter.completedDate && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Completed:</span>
                <span>
                  {new Date(matter.completedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {matter.assignedStaff ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{matter.assignedStaff.user.name}</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Unassigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChecklistTab({ matter }: { matter: MatterData }) {
  const [newItem, setNewItem] = useState("");

  const addItemMutation = useMutation({
    mutationFn: (item: string) =>
      client.matters.checklist.addItem({ matterId: matter.id, item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
      setNewItem("");
      toast.success("Checklist item added");
    },
    onError: () => toast.error("Failed to add item"),
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      client.matters.checklist.toggleItem({ id, isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
    },
    onError: () => toast.error("Failed to update item"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => client.matters.checklist.deleteItem({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
      toast.success("Item deleted");
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const handleAddItem = () => {
    if (newItem.trim()) {
      addItemMutation.mutate(newItem.trim());
    }
  };

  const sortedChecklist = [...matter.checklist].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddItem();
              }
            }}
            placeholder="Add new checklist item..."
            value={newItem}
          />
          <Button
            disabled={!newItem.trim() || addItemMutation.isPending}
            onClick={handleAddItem}
          >
            {addItemMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator />

        {/* Checklist items */}
        {sortedChecklist.length > 0 ? (
          <div className="space-y-2">
            {sortedChecklist.map((item) => (
              <div
                className="flex items-center gap-3 rounded-lg border p-3"
                key={item.id}
              >
                <button
                  className="flex-shrink-0"
                  disabled={toggleItemMutation.isPending}
                  onClick={() =>
                    toggleItemMutation.mutate({
                      id: item.id,
                      isCompleted: !item.isCompleted,
                    })
                  }
                  type="button"
                >
                  {item.isCompleted ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={
                      item.isCompleted
                        ? "text-muted-foreground line-through"
                        : ""
                    }
                  >
                    {item.item}
                  </p>
                  {item.isCompleted && item.completedAt && (
                    <p className="text-muted-foreground text-xs">
                      Completed{" "}
                      {new Date(item.completedAt).toLocaleDateString()}
                      {item.completedBy && ` by ${item.completedBy.name}`}
                    </p>
                  )}
                </div>
                <Button
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  disabled={deleteItemMutation.isPending}
                  onClick={() => deleteItemMutation.mutate(item.id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No checklist items yet. Add one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({ matter }: { matter: MatterData }) {
  const [newNote, setNewNote] = useState("");

  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      client.matters.notes.create({
        matterId: matter.id,
        content,
        isInternal: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matter", matter.id] });
      setNewNote("");
      toast.success("Note added");
    },
    onError: () => toast.error("Failed to add note"),
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            value={newNote}
          />
          <Button
            disabled={!newNote.trim() || addNoteMutation.isPending}
            onClick={handleAddNote}
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Add Note
          </Button>
        </div>

        <Separator />

        {/* Notes list */}
        {matter.notes.length > 0 ? (
          <div className="space-y-4">
            {matter.notes.map((note) => (
              <div className="rounded-lg border p-4" key={note.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {note.createdBy?.name || "Unknown"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No notes yet. Add one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-medium text-muted-foreground text-sm">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
