import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Search, Sparkles } from "lucide-react";
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
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/app/knowledge-base/")({
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [business, setBusiness] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const { data, isLoading } = useQuery(
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

  const { data: itemDetails } = useQuery({
    ...orpc.knowledgeBase.getById.queryOptions({
      input: { id: selectedItem ?? "" },
    }),
    enabled: !!selectedItem,
  });

  const downloadMutation = useMutation({
    ...orpc.knowledgeBase.download.mutationOptions(),
    onSuccess: () => {
      toast.success("Download started");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDownload = (id: string) => {
    downloadMutation.mutate({ id });
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
        {data?.items.map((item) => (
          <Card
            className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
            key={item.id}
            onClick={() => setSelectedItem(item.id)}
          >
            <CardHeader className="pb-2">
              <div className="mb-2 flex items-start justify-between">
                <Badge variant={getBusinessBadgeVariant(item.business)}>
                  {item.business || "General"}
                </Badge>
                {item.isStaffOnly ? (
                  <Badge className="ml-2" variant="destructive">
                    Staff Only
                  </Badge>
                ) : null}
              </div>
              <CardTitle className="line-clamp-2 text-lg">
                {item.title}
              </CardTitle>
              <CardDescription>{item.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <p className="line-clamp-3 text-muted-foreground text-sm">
                {item.shortDescription || item.description}
              </p>
            </CardContent>
            <CardFooter className="border-t bg-muted/5 pt-2">
              <div className="flex w-full items-center justify-between text-muted-foreground text-xs">
                <span>{item.type.replace("_", " ")}</span>
                {item.supportsAutoFill ? (
                  <span className="flex items-center text-blue-600 dark:text-blue-400">
                    <Sparkles className="mr-1 h-3 w-3" /> Auto-fill
                  </span>
                ) : null}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
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
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="AGENCY_FORM">Agency Forms</SelectItem>
                <SelectItem value="LETTER_TEMPLATE">
                  Letter Templates
                </SelectItem>
                <SelectItem value="GUIDE">Guides</SelectItem>
                <SelectItem value="CHECKLIST">Checklists</SelectItem>
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
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="GRA">GRA (Tax)</SelectItem>
                <SelectItem value="NIS">NIS</SelectItem>
                <SelectItem value="IMMIGRATION">Immigration</SelectItem>
                <SelectItem value="DCRA">DCRA (Business)</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="TRAINING">Training</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
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
        <div className="flex-1 overflow-y-auto p-6">{renderMainContent()}</div>
      </div>

      {/* Item Details Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setSelectedItem(null)}
        open={!!selectedItem}
      >
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{itemDetails?.title}</DialogTitle>
            <DialogDescription>
              {itemDetails?.category} • {itemDetails?.type.replace("_", " ")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2 text-foreground text-sm">
              <p>{itemDetails?.description}</p>
            </div>

            {itemDetails?.requiredFor !== undefined &&
            itemDetails.requiredFor.length > 0 ? (
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground text-xs uppercase">
                  Required For
                </span>
                <div className="flex flex-wrap gap-1">
                  {itemDetails.requiredFor.map((req) => (
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
                <span className="block truncate">
                  {itemDetails?.fileName || "N/A"}
                </span>
              </div>
              <div>
                <span className="block font-medium">Size</span>
                <span>
                  {itemDetails?.fileSize
                    ? `${(itemDetails.fileSize / 1024).toFixed(1)} KB`
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="block font-medium">Last Updated</span>
                <span>
                  {new Date(itemDetails?.updatedAt || "").toLocaleDateString()}
                </span>
              </div>
              {itemDetails?.agencyUrl ? (
                <div>
                  <span className="block font-medium">Agency Link</span>
                  <a
                    className="block truncate text-blue-500 hover:underline"
                    href={itemDetails.agencyUrl}
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
            <Button onClick={() => setSelectedItem(null)} variant="outline">
              Close
            </Button>
            {itemDetails?.supportsAutoFill ? (
              <Button className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-Fill & Download
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                disabled={!itemDetails?.id}
                onClick={() => {
                  if (itemDetails?.id) {
                    handleDownload(itemDetails.id);
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
