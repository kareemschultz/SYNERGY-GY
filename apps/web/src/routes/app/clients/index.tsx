import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MoreHorizontal, Plus, Search, Wand2 } from "lucide-react";
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

export const Route = createFileRoute("/app/clients/")({
  component: ClientsPage,
});

const clientTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individual",
  SMALL_BUSINESS: "Small Business",
  CORPORATION: "Corporation",
  NGO: "NGO",
  COOP: "Cooperative",
  CREDIT_UNION: "Credit Union",
  FOREIGN_NATIONAL: "Foreign National",
  INVESTOR: "Investor",
};

function ClientsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "clients",
      {
        search,
        type: typeFilter,
        business: businessFilter,
        status: statusFilter,
        page,
      },
    ],
    queryFn: () =>
      client.clients.list({
        page,
        limit: 20,
        search: search || undefined,
        type:
          typeFilter === "all"
            ? undefined
            : (typeFilter as
                | "INDIVIDUAL"
                | "SMALL_BUSINESS"
                | "CORPORATION"
                | "NGO"
                | "COOP"
                | "CREDIT_UNION"
                | "FOREIGN_NATIONAL"
                | "INVESTOR"),
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "ACTIVE" | "INACTIVE" | "ARCHIVED"),
      }),
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Quick Add
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/clients/onboard">
                <Wand2 className="mr-2 h-4 w-4" />
                Client Wizard
              </Link>
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients" },
        ]}
        description="Manage clients across both businesses"
        title="Clients"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search clients by name, email, or TIN..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(value) => {
              setBusinessFilter(value);
              setPage(1);
            }}
            value={businessFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              <SelectItem value="GCMC">GCMC</SelectItem>
              <SelectItem value="KAJ">KAJ</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
            value={typeFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="SMALL_BUSINESS">Small Business</SelectItem>
              <SelectItem value="CORPORATION">Corporation</SelectItem>
              <SelectItem value="NGO">NGO</SelectItem>
              <SelectItem value="COOP">Cooperative</SelectItem>
              <SelectItem value="CREDIT_UNION">Credit Union</SelectItem>
              <SelectItem value="FOREIGN_NATIONAL">Foreign National</SelectItem>
              <SelectItem value="INVESTOR">Investor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error state */}
        {!!error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            Failed to load clients. Please try again.
          </div>
        )}

        {/* Clients Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading clients...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.clients && data.clients.length > 0 ? (
                data.clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        params={{ clientId: c.id }}
                        to="/app/clients/$clientId"
                      >
                        {c.displayName}
                      </Link>
                    </TableCell>
                    <TableCell>{clientTypeLabels[c.type] || c.type}</TableCell>
                    <TableCell>
                      <BusinessBadges businesses={c.businesses} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {!!c.email && <div>{c.email}</div>}
                        {!!c.phone && (
                          <div className="text-muted-foreground">{c.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.tinNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
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
                              params={{ clientId: c.id }}
                              to="/app/clients/$clientId"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              params={{ clientId: c.id }}
                              search={{ edit: true }}
                              to="/app/clients/$clientId"
                            >
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <p>No clients found</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/app/clients/onboard">
                          <Wand2 className="mr-2 h-4 w-4" />
                          Add your first client
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!!data?.totalPages && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)}{" "}
              of {data.total} clients
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessBadges({ businesses }: { businesses: string[] }) {
  return (
    <div className="flex gap-1">
      {businesses.includes("GCMC") && (
        <Badge className="bg-emerald-500/10 text-emerald-600" variant="outline">
          GCMC
        </Badge>
      )}
      {businesses.includes("KAJ") && (
        <Badge className="bg-blue-500/10 text-blue-600" variant="outline">
          KAJ
        </Badge>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    ACTIVE: {
      className: "bg-green-500/10 text-green-600 border-green-200",
      label: "Active",
    },
    INACTIVE: {
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      label: "Inactive",
    },
    ARCHIVED: {
      className: "bg-gray-500/10 text-gray-600 border-gray-200",
      label: "Archived",
    },
  };

  const variant = variants[status] || variants.ACTIVE;

  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}
