import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileEdit,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/documents/templates/")({
  component: TemplatesPage,
});

const categoryLabels: Record<string, { label: string; className: string }> = {
  LETTER: {
    label: "Letter",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  AGREEMENT: {
    label: "Agreement",
    className: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  CERTIFICATE: {
    label: "Certificate",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  FORM: {
    label: "Form",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  REPORT: {
    label: "Report",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  },
  INVOICE: {
    label: "Invoice",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  },
  OTHER: {
    label: "Other",
    className: "bg-gray-500/10 text-gray-600 border-gray-200",
  },
};

const businessLabels: Record<string, { label: string; className: string }> = {
  GCMC: {
    label: "GCMC",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  KAJ: {
    label: "KAJ",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
};

function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "templates",
      { category: categoryFilter, business: businessFilter },
    ],
    queryFn: () =>
      client.documents.templates.list({
        category:
          categoryFilter === "all"
            ? undefined
            : (categoryFilter as
                | "LETTER"
                | "AGREEMENT"
                | "CERTIFICATE"
                | "FORM"
                | "REPORT"
                | "INVOICE"
                | "OTHER"),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
      }),
  });

  // Filter templates by search term locally
  const filteredTemplates = templates?.filter((template) =>
    search
      ? template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/documents/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Documents", href: "/app/documents" },
          { label: "Templates" },
        ]}
        description="Manage document templates for automated document generation"
        title="Document Templates"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(value) => setCategoryFilter(value)}
            value={categoryFilter}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="LETTER">Letter</SelectItem>
              <SelectItem value="AGREEMENT">Agreement</SelectItem>
              <SelectItem value="CERTIFICATE">Certificate</SelectItem>
              <SelectItem value="FORM">Form</SelectItem>
              <SelectItem value="REPORT">Report</SelectItem>
              <SelectItem value="INVOICE">Invoice</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => setBusinessFilter(value)}
            value={businessFilter}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              <SelectItem value="GCMC">GCMC</SelectItem>
              <SelectItem value="KAJ">KAJ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {!!error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            Failed to load templates. Please try again.
          </div>
        )}

        {/* Templates Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={6}>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading templates...
                    </div>
                  </TableCell>
                </TableRow>
                // biome-ignore lint/style/noNestedTernary: Auto-fix
                // biome-ignore lint/nursery/noLeakedRender: Auto-fix
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={template.category} />
                    </TableCell>
                    <TableCell>
                      {template.business ? (
                        <BusinessBadge business={template.business} />
                      ) : (
                        <Badge
                          className="border-gray-200 bg-gray-500/10 text-gray-600"
                          variant="outline"
                        >
                          Both
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground text-sm">
                      {template.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              params={{ templateId: template.id }}
                              to="/app/documents/templates/$templateId"
                            >
                              <FileEdit className="mr-2 h-4 w-4" />
                              View/Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={6}>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>No templates found</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/app/documents/templates/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first template
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const variant = categoryLabels[category] || categoryLabels.OTHER;
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}

function BusinessBadge({ business }: { business: string }) {
  const variant = businessLabels[business];
  if (!variant) {
    return null;
  }
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}
