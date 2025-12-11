import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceCard } from "@/components/services/service-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/services/")({
  component: ServicesPage,
});

function ServicesPage() {
  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["service-categories", businessFilter],
    queryFn: () =>
      client.serviceCatalog.categories.list({
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        isActive: true,
        includeServiceCount: true,
      }),
  });

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: [
      "services",
      {
        search,
        business: businessFilter,
        categoryId: selectedCategoryId,
        page,
      },
    ],
    queryFn: () =>
      client.serviceCatalog.services.list({
        page,
        limit: 12,
        search: search || undefined,
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        categoryId: selectedCategoryId || undefined,
        isActive: true,
        sortBy: "sortOrder",
        sortOrder: "asc",
      }),
  });

  // Fetch featured services
  const { data: featuredData } = useQuery({
    queryKey: ["featured-services", businessFilter],
    queryFn: () =>
      client.serviceCatalog.services.getFeatured({
        business:
          businessFilter === "all"
            ? undefined
            : (businessFilter as "GCMC" | "KAJ"),
        limit: 6,
      }),
  });

  const categories = categoriesData?.categories || [];
  const services = servicesData?.services || [];
  const featured = featuredData?.services || [];

  // Group categories by business
  const gcmcCategories = categories.filter((cat) => cat.business === "GCMC");
  const kajCategories = categories.filter((cat) => cat.business === "KAJ");

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Services" },
        ]}
        description="Browse our comprehensive range of professional services"
        title="Service Catalog"
      />

      <div className="space-y-6 p-6">
        {/* Featured Services Section */}
        {featured.length > 0 && !search && !selectedCategoryId && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-xl">Featured Services</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((service) => (
                <ServiceCard
                  key={service.id}
                  linkTo={`/app/services/${service.id}`}
                  service={service}
                  showBusiness={businessFilter === "all"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search services..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(value) => {
              setBusinessFilter(value);
              setSelectedCategoryId(null);
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

          {selectedCategoryId && (
            <Button
              onClick={() => {
                setSelectedCategoryId(null);
                setPage(1);
              }}
              variant="outline"
            >
              Clear Category Filter
            </Button>
          )}
        </div>

        {/* Categories and Services */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Categories Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <h3 className="font-semibold">Categories</h3>

              {categoriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton className="h-10 w-full" key={i} />
                  ))}
                </div>
              ) : businessFilter === "all" ? (
                <Tabs className="w-full" defaultValue="GCMC">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="GCMC">GCMC</TabsTrigger>
                    <TabsTrigger value="KAJ">KAJ</TabsTrigger>
                  </TabsList>
                  <TabsContent className="mt-4" value="GCMC">
                    <div className="space-y-1">
                      <Button
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCategoryId(null);
                          setBusinessFilter("GCMC");
                        }}
                        variant={
                          selectedCategoryId === null ? "secondary" : "ghost"
                        }
                      >
                        All GCMC Services
                      </Button>
                      {gcmcCategories.map((category) => (
                        <Button
                          className="w-full justify-between"
                          key={category.id}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setBusinessFilter("GCMC");
                            setPage(1);
                          }}
                          variant={
                            selectedCategoryId === category.id
                              ? "secondary"
                              : "ghost"
                          }
                        >
                          <span className="truncate">
                            {category.displayName}
                          </span>
                          {"serviceCount" in category && (
                            <Badge className="ml-2 shrink-0" variant="outline">
                              {String(category.serviceCount)}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent className="mt-4" value="KAJ">
                    <div className="space-y-1">
                      <Button
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCategoryId(null);
                          setBusinessFilter("KAJ");
                        }}
                        variant={
                          selectedCategoryId === null ? "secondary" : "ghost"
                        }
                      >
                        All KAJ Services
                      </Button>
                      {kajCategories.map((category) => (
                        <Button
                          className="w-full justify-between"
                          key={category.id}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setBusinessFilter("KAJ");
                            setPage(1);
                          }}
                          variant={
                            selectedCategoryId === category.id
                              ? "secondary"
                              : "ghost"
                          }
                        >
                          <span className="truncate">
                            {category.displayName}
                          </span>
                          {"serviceCount" in category && (
                            <Badge className="ml-2 shrink-0" variant="outline">
                              {String(category.serviceCount)}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-1">
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setPage(1);
                    }}
                    variant={
                      selectedCategoryId === null ? "secondary" : "ghost"
                    }
                  >
                    All Services
                  </Button>
                  {categories.map((category) => (
                    <Button
                      className="w-full justify-between"
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setPage(1);
                      }}
                      variant={
                        selectedCategoryId === category.id
                          ? "secondary"
                          : "ghost"
                      }
                    >
                      <span className="truncate">{category.displayName}</span>
                      {"serviceCount" in category && (
                        <Badge className="ml-2 shrink-0" variant="outline">
                          {String(category.serviceCount)}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Services Grid */}
          <div className="lg:col-span-9">
            {servicesLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton className="h-64" key={i} />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {search
                    ? "No services found matching your search."
                    : "No services available in this category."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      linkTo={`/app/services/${service.id}`}
                      service={service}
                      showBusiness={businessFilter === "all"}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {servicesData &&
                  servicesData.totalPages &&
                  servicesData.totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <Button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2 px-4">
                        <span className="text-muted-foreground text-sm">
                          Page {page} of {servicesData.totalPages}
                        </span>
                      </div>
                      <Button
                        disabled={page === servicesData.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
