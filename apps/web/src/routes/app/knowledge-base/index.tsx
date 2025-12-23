import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Loader2,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client, orpc } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

export const Route = createFileRoute("/app/knowledge-base/")({
  component: KnowledgeBasePage,
});

const ADMIN_ROLES = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"] as const;

// Agency color configuration for visual distinction
const AGENCY_COLORS: Record<
  string,
  { border: string; text: string; bg: string }
> = {
  GRA: {
    border: "border-yellow-500",
    text: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  NIS: {
    border: "border-blue-500",
    text: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  IMMIGRATION: {
    border: "border-purple-500",
    text: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  DCRA: {
    border: "border-green-500",
    text: "text-green-500",
    bg: "bg-green-500/10",
  },
  LABOUR: {
    border: "border-orange-500",
    text: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  EPA: {
    border: "border-emerald-500",
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  GNBS: {
    border: "border-cyan-500",
    text: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  SBB: {
    border: "border-pink-500",
    text: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  GENERAL: {
    border: "border-gray-500",
    text: "text-gray-500",
    bg: "bg-gray-500/10",
  },
  INTERNAL: {
    border: "border-slate-500",
    text: "text-slate-500",
    bg: "bg-slate-500/10",
  },
  TRAINING: {
    border: "border-indigo-500",
    text: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
};

// Helper to get agency styling
const getAgencyStyle = (category: string) =>
  AGENCY_COLORS[category] || AGENCY_COLORS.GENERAL;

// Quick filter options for common searches with icons
const QUICK_FILTERS = [
  { label: "Tax Forms", category: "GRA", emoji: "💰" },
  { label: "NIS Registration", category: "NIS", emoji: "🛡️" },
  { label: "Work Permits", category: "IMMIGRATION", emoji: "🌍" },
  { label: "Business Reg", category: "DCRA", emoji: "🏢" },
  { label: "Templates", type: "LETTER_TEMPLATE", emoji: "📝" },
  { label: "Training", category: "TRAINING", emoji: "🎓" },
] as const;

// Types for item details
type KnowledgeBaseItemDetails = {
  id: string;
  title: string;
  category: string;
  type: string;
  description: string;
  fileName?: string | null;
  fileSize?: number | null;
  storagePath?: string | null;
  agencyUrl?: string | null;
  updatedAt: string | Date;
  requiredFor?: string[];
  supportsAutoFill: boolean;
};

// Extracted Dialog Component to reduce complexity
function ItemDetailsDialog({
  item,
  open,
  onClose,
  onDownload,
  onAutoFill,
}: {
  item: KnowledgeBaseItemDetails | null | undefined;
  open: boolean;
  onClose: () => void;
  onDownload: (id: string, fileName?: string | null) => void;
  onAutoFill: (item: KnowledgeBaseItemDetails) => void;
}) {
  const getDownloadButtonText = (): string => {
    if (item?.storagePath) {
      return "Download";
    }
    if (item?.agencyUrl) {
      return "Open Link";
    }
    return "No File";
  };

  const isDownloadAvailable = Boolean(
    item?.id && (item?.storagePath || item?.agencyUrl)
  );

  return (
    <Dialog onOpenChange={(openState) => !openState && onClose()} open={open}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.title}</DialogTitle>
          <DialogDescription>
            {item?.category} • {item?.type.replace("_", " ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-foreground text-sm">
            <p>{item?.description}</p>
          </div>

          {Array.isArray(item?.requiredFor) && item.requiredFor.length > 0 ? (
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground text-xs uppercase">
                Required For
              </span>
              <div className="flex flex-wrap gap-1">
                {item.requiredFor.map((req) => (
                  <Badge className="text-xs" key={req} variant="outline">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 rounded-md bg-muted/20 p-3 text-muted-foreground text-xs">
            <div>
              <span className="block font-medium">File Name</span>
              <span className="block truncate">{item?.fileName || "N/A"}</span>
            </div>
            <div>
              <span className="block font-medium">Size</span>
              <span>
                {item?.fileSize
                  ? `${(item.fileSize / 1024).toFixed(1)} KB`
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="block font-medium">Last Updated</span>
              <span>
                {new Date(item?.updatedAt || "").toLocaleDateString()}
              </span>
            </div>
            {item?.agencyUrl ? (
              <div>
                <span className="block font-medium">Agency Link</span>
                <a
                  className="block truncate text-blue-500 hover:underline"
                  href={item.agencyUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Visit Website
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          {item?.supportsAutoFill ? (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
              onClick={() => {
                if (item) {
                  onAutoFill(item);
                }
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-Fill & Download
            </Button>
          ) : (
            <Button
              className="w-full sm:w-auto"
              disabled={!isDownloadAvailable}
              onClick={() => {
                if (item?.id) {
                  onDownload(item.id, item.fileName);
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {getDownloadButtonText()}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Type for auto-fill response
type AutoFillResponse = {
  success: boolean;
  itemId: string;
  downloadUrl: string;
  fileName?: string | null;
};

// Type for clients list response
type ClientsListResponse = {
  clients: Array<{
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }>;
};

// Type for matters list response
type MattersListResponse = {
  matters: Array<{
    id: string;
    title: string;
    referenceNumber: string;
  }>;
};

// Auto-Fill Dialog for selecting client/matter and generating document
function AutoFillDialog({
  item,
  open,
  onClose,
}: {
  item: KnowledgeBaseItemDetails | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedMatterId, setSelectedMatterId] = useState<string>("");

  // Fetch clients list
  const { data: clientsDataRaw } = useQuery({
    queryKey: ["clients", "list", "autoFill"],
    queryFn: () => client.clients.list({ limit: 100 }),
    enabled: open,
  });
  const clientsData = unwrapOrpc<ClientsListResponse | undefined>(
    clientsDataRaw
  );

  // Fetch matters for selected client
  const { data: mattersDataRaw } = useQuery({
    queryKey: ["matters", "list", selectedClientId],
    queryFn: () =>
      client.matters.list({
        clientId: selectedClientId,
        limit: 50,
      }),
    enabled: open && !!selectedClientId,
  });
  const mattersData = unwrapOrpc<MattersListResponse | undefined>(
    mattersDataRaw
  );

  // Auto-fill mutation
  const autoFillMutation = useMutation({
    mutationFn: async () => {
      const response = await client.knowledgeBase.autoFill({
        id: item?.id ?? "",
        clientId: selectedClientId || undefined,
        matterId: selectedMatterId || undefined,
      });
      return unwrapOrpc<AutoFillResponse>(response);
    },
    onSuccess: (data) => {
      toast.success("Document generated successfully");

      // Trigger download using the returned download URL
      if (data?.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.fileName || item?.fileName || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Auto-fill failed: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!item?.id) {
      toast.error("No item selected");
      return;
    }
    autoFillMutation.mutate();
  };

  const handleClose = () => {
    setSelectedClientId("");
    setSelectedMatterId("");
    onClose();
  };

  return (
    <Dialog
      onOpenChange={(openState) => !openState && handleClose()}
      open={open}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Auto-Fill Document</DialogTitle>
          <DialogDescription>
            Select a client and matter to auto-fill {item?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-select">Client</Label>
            <Select
              onValueChange={(value) => {
                setSelectedClientId(value);
                setSelectedMatterId("");
              }}
              value={selectedClientId}
            >
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clientsData?.clients?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName || `${c.firstName} ${c.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="matter-select">Matter (Optional)</Label>
            <Select
              disabled={!selectedClientId}
              onValueChange={(value) => {
                if (value === "none") {
                  setSelectedMatterId("");
                } else {
                  setSelectedMatterId(value);
                }
              }}
              value={selectedMatterId || "none"}
            >
              <SelectTrigger id="matter-select">
                <SelectValue
                  placeholder={
                    selectedClientId
                      ? "Select a matter..."
                      : "Select a client first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No matter selected</SelectItem>
                {mattersData?.matters?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title} ({m.referenceNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClientId ? (
            <div className="rounded-md bg-muted/30 p-3">
              <p className="text-muted-foreground text-sm">
                The document will be auto-filled with client information
                {selectedMatterId ? " and matter details" : ""}.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!selectedClientId || autoFillMutation.isPending}
            onClick={handleGenerate}
          >
            {autoFillMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Type for the list response
type KnowledgeBaseListResponse = {
  items: Array<{
    id: string;
    title: string;
    category: string;
    type: string;
    description: string;
    shortDescription?: string | null;
    business: string | null;
    isStaffOnly: boolean;
    supportsAutoFill: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [business, setBusiness] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [autoFillItem, setAutoFillItem] =
    useState<KnowledgeBaseItemDetails | null>(null);

  // Check if user is admin for "Manage" button
  const { data: staffStatusRaw } = useQuery({
    queryKey: ["settings", "getStaffStatus"],
    queryFn: () => client.settings.getStaffStatus(),
    staleTime: 5 * 60 * 1000,
  });
  const staffStatus = unwrapOrpc<{
    hasStaffProfile: boolean;
    isActive: boolean;
    staff: { role: string } | null;
  }>(staffStatusRaw);
  const isAdmin =
    staffStatus?.staff?.role &&
    ADMIN_ROLES.includes(
      staffStatus.staff.role as (typeof ADMIN_ROLES)[number]
    );

  const { data: dataRaw, isLoading } = useQuery(
    orpc.knowledgeBase.list.queryOptions({
      input: {
        search: search || undefined,
        type:
          type !== "ALL"
            ? (type as
                | "AGENCY_FORM"
                | "LETTER_TEMPLATE"
                | "GUIDE"
                | "CHECKLIST")
            : undefined,
        category:
          category !== "ALL"
            ? (category as
                | "GRA"
                | "NIS"
                | "IMMIGRATION"
                | "DCRA"
                | "GENERAL"
                | "INTERNAL")
            : undefined,
        business: business !== "ALL" ? (business as "GCMC" | "KAJ") : undefined,
      },
    })
  );

  // Unwrap oRPC response envelope
  const data = unwrapOrpc<KnowledgeBaseListResponse | undefined>(dataRaw);

  const { data: itemDetailsRaw } = useQuery({
    ...orpc.knowledgeBase.getById.queryOptions({
      input: { id: selectedItem ?? "" },
    }),
    enabled: !!selectedItem,
  });

  // Unwrap oRPC response envelope for item details
  const itemDetails = unwrapOrpc<KnowledgeBaseItemDetails | undefined>(
    itemDetailsRaw
  );

  const handleDownload = (id: string, fileName?: string | null) => {
    // Trigger download via the new streaming endpoint
    const link = document.createElement("a");
    link.href = `/api/knowledge-base/download/${id}`;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  // Helper function to get badge variant based on business
  const getBusinessBadgeVariant = (
    itemBusiness: string | null
  ): "default" | "secondary" | "outline" => {
    if (itemBusiness === "GCMC") {
      return "default";
    }
    if (itemBusiness === "KAJ") {
      return "secondary";
    }
    return "outline";
  };

  // Helper function to render main content
  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card className="animate-pulse" key={i}>
              <CardHeader className="h-24 bg-muted/50" />
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      );
    }

    if (data?.items.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
          <FileText className="mb-2 h-10 w-10 opacity-20" />
          <p>No resources found matching your filters.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.items.map((item) => {
          const agencyStyle = getAgencyStyle(item.category);
          return (
            <Card
              className={`group relative flex cursor-pointer flex-col overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg ${agencyStyle.border} border-l-4`}
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
            >
              <CardHeader className="pb-2">
                <div className="mb-2 flex items-start justify-between">
                  {/* Agency badge with color coding */}
                  <Badge
                    className={`${agencyStyle.border} ${agencyStyle.text} ${agencyStyle.bg}`}
                    variant="outline"
                  >
                    {item.category}
                  </Badge>
                  <div className="flex gap-1">
                    {item.business ? (
                      <Badge variant={getBusinessBadgeVariant(item.business)}>
                        {item.business}
                      </Badge>
                    ) : null}
                    {item.isStaffOnly ? (
                      <Badge variant="destructive">Staff Only</Badge>
                    ) : null}
                  </div>
                </div>
                <CardTitle className="line-clamp-2 flex items-start gap-2 text-lg">
                  <FileText
                    className={`mt-0.5 h-5 w-5 shrink-0 ${agencyStyle.text}`}
                  />
                  <span>{item.title}</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {item.type.replace("_", " ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="line-clamp-3 text-muted-foreground text-sm">
                  {item.shortDescription || item.description}
                </p>
              </CardContent>
              <CardFooter className="border-t bg-muted/5 pt-3">
                <div className="flex w-full items-center justify-between">
                  {item.supportsAutoFill ? (
                    <span className="flex items-center rounded-full bg-purple-500/10 px-2 py-1 font-medium text-purple-500 text-xs">
                      <Sparkles className="mr-1 h-3 w-3" /> Auto-fill Ready
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      <Download className="mr-1 inline h-3 w-3" /> Download
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
                    Click to view →
                  </span>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        actions={
          isAdmin ? (
            <Button asChild variant="outline">
              <a href="/app/admin/knowledge-base">
                <Settings2 className="mr-2 h-4 w-4" />
                Manage Resources
              </a>
            </Button>
          ) : null
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Knowledge Base" },
        ]}
        description="Access forms, templates, guides, and resources"
        title="Knowledge Base"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="hidden w-64 space-y-6 overflow-y-auto border-r bg-muted/10 p-4 md:block">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                value={search}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">📋 All Types</SelectItem>
                <SelectItem value="AGENCY_FORM">📄 Agency Forms</SelectItem>
                <SelectItem value="LETTER_TEMPLATE">
                  📝 Letter Templates
                </SelectItem>
                <SelectItem value="GUIDE">📖 Guides</SelectItem>
                <SelectItem value="CHECKLIST">✅ Checklists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">📋 All Categories</SelectItem>
                <SelectItem value="GRA">💰 GRA (Tax)</SelectItem>
                <SelectItem value="NIS">🛡️ NIS</SelectItem>
                <SelectItem value="IMMIGRATION">🌍 Immigration</SelectItem>
                <SelectItem value="DCRA">🏢 DCRA (Business)</SelectItem>
                <SelectItem value="GENERAL">📁 General</SelectItem>
                <SelectItem value="TRAINING">🎓 Training</SelectItem>
                <SelectItem value="INTERNAL">🔒 Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Business Unit</Label>
            <Select onValueChange={setBusiness} value={business}>
              <SelectTrigger>
                <SelectValue placeholder="All Business Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Business Units</SelectItem>
                <SelectItem value="GCMC">GCMC</SelectItem>
                <SelectItem value="KAJ">KAJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <Button
              className="w-full"
              onClick={() => {
                setSearch("");
                setType("ALL");
                setCategory("ALL");
                setBusiness("ALL");
              }}
              variant="outline"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Filter Chips */}
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="mr-2 flex items-center text-muted-foreground text-sm">
              Quick filters:
            </span>
            {QUICK_FILTERS.map((filter) => {
              const hasCategory = "category" in filter;
              const hasType = "type" in filter;
              const matchesCategory = hasCategory
                ? category === filter.category
                : false;
              const matchesType = hasType ? type === filter.type : false;
              const isActive = matchesCategory || matchesType;
              const filterStyle =
                "category" in filter
                  ? getAgencyStyle(filter.category)
                  : {
                      border: "border-slate-500",
                      text: "text-slate-500",
                      bg: "bg-slate-500/10",
                    };

              return (
                <button
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-all hover:scale-105 ${
                    isActive
                      ? `${filterStyle.border} ${filterStyle.bg} ${filterStyle.text}`
                      : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                  key={filter.label}
                  onClick={() => {
                    if ("category" in filter) {
                      setCategory(filter.category);
                      setType("ALL");
                    } else if ("type" in filter) {
                      setType(filter.type);
                      setCategory("ALL");
                    }
                  }}
                  type="button"
                >
                  <span>{filter.emoji}</span>
                  {filter.label}
                </button>
              );
            })}
            {category !== "ALL" || type !== "ALL" ? (
              <button
                className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 font-medium text-destructive text-xs transition-all hover:bg-destructive/20"
                onClick={() => {
                  setCategory("ALL");
                  setType("ALL");
                }}
                type="button"
              >
                ✕ Clear
              </button>
            ) : null}
          </div>
          {renderMainContent()}
        </div>
      </div>

      {/* Item Details Dialog */}
      <ItemDetailsDialog
        item={itemDetails}
        onAutoFill={(item) => {
          setAutoFillItem(item);
          setAutoFillOpen(true);
          setSelectedItem(null);
        }}
        onClose={() => setSelectedItem(null)}
        onDownload={handleDownload}
        open={!!selectedItem}
      />

      {/* Auto-Fill Dialog */}
      <AutoFillDialog
        item={autoFillItem}
        onClose={() => {
          setAutoFillOpen(false);
          setAutoFillItem(null);
        }}
        open={autoFillOpen}
      />
    </div>
  );
}
