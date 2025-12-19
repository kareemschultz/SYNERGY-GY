import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Edit,
  Eye,
  FolderTree,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/services/")({
  component: AdminServicesPage,
});

type ServiceType = {
  id: string;
  categoryId: string;
  name: string;
  displayName: string;
  description: string | null;
  shortDescription: string | null;
  pricingType: "FIXED" | "RANGE" | "TIERED" | "CUSTOM";
  basePrice: string | null;
  maxPrice: string | null;
  typicalDuration: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  currency: string;
  category?: { displayName: string } | null;
};

type CategoryType = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  serviceCount?: number;
};

function AdminServicesPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<"GCMC" | "KAJ">(
    "GCMC"
  );
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(
    null
  );
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(
    null
  );
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-service-categories", selectedBusiness],
    queryFn: () =>
      client.serviceCatalog.categories.list({
        business: selectedBusiness,
        includeServiceCount: true,
      }),
  });

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["admin-services", selectedBusiness],
    queryFn: () =>
      client.serviceCatalog.services.list({
        business: selectedBusiness,
        limit: 50,
        sortBy: "sortOrder",
        sortOrder: "asc",
      }),
  });

  const categories = categoriesData?.categories || [];
  const services = servicesData?.services || [];

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => client.serviceCatalog.services.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      toast.success("Service deleted successfully");
      setDeleteServiceId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete service");
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => client.serviceCatalog.categories.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] });
      toast.success("Category deleted successfully");
      setDeleteCategoryId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  const handleEditService = (service: ServiceType) => {
    setEditingService(service);
    setServiceDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryType) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleServiceDialogClose = (open: boolean) => {
    setServiceDialogOpen(open);
    if (!open) {
      setEditingService(null);
    }
  };

  const handleCategoryDialogClose = (open: boolean) => {
    setCategoryDialogOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  };

  const serviceToDelete = services.find((s) => s.id === deleteServiceId);
  const categoryToDelete = categories.find((c) => c.id === deleteCategoryId);

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Services" },
        ]}
        description="Manage service categories and catalog items"
        title="Service Catalog Management"
      />

      <div className="space-y-6 p-6">
        {/* Business Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <Select
              onValueChange={(value) =>
                setSelectedBusiness(value as "GCMC" | "KAJ")
              }
              value={selectedBusiness}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GCMC">GCMC</SelectItem>
                <SelectItem value="KAJ">KAJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs for Categories and Services */}
        <Tabs className="space-y-4" defaultValue="services">
          <TabsList>
            <TabsTrigger className="flex items-center gap-2" value="services">
              <Package className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="categories">
              <FolderTree className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>
                      Manage services for {selectedBusiness}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setServiceDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton className="h-12 w-full" key={i} />
                    ))}
                  </div>
                  // biome-ignore lint/style/noNestedTernary: Auto-fix
                ) : services.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold text-lg">No services</h3>
                    <p className="text-muted-foreground">
                      Get started by creating a service category first.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Pricing Type</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {service.displayName}
                              {service.isFeatured ? (
                                <Badge variant="secondary">Featured</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {service.category?.displayName || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {service.pricingType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {service.basePrice
                              ? formatCurrency(
                                  Number(service.basePrice),
                                  service.currency
                                )
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {service.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button asChild size="sm" variant="ghost">
                                <Link to={`/app/admin/services/${service.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                onClick={() => handleEditService(service)}
                                size="sm"
                                variant="ghost"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => setDeleteServiceId(service.id)}
                                size="sm"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Service Categories</CardTitle>
                    <CardDescription>
                      Manage categories for {selectedBusiness}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCategoryDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton className="h-16 w-full" key={i} />
                    ))}
                  </div>
                  // biome-ignore lint/style/noNestedTernary: Auto-fix
                ) : categories.length === 0 ? (
                  <div className="py-12 text-center">
                    <FolderTree className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold text-lg">
                      No categories
                    </h3>
                    <p className="text-muted-foreground">
                      Create categories to organize your services.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Sort Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            {category.displayName}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {category.description || "—"}
                          </TableCell>
                          <TableCell>
                            {"serviceCount" in category ? (
                              <Badge variant="outline">
                                {String(
                                  category.serviceCount as number | undefined
                                )}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>{category.sortOrder}</TableCell>
                          <TableCell>
                            {category.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => handleEditCategory(category)}
                                size="sm"
                                variant="ghost"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => setDeleteCategoryId(category.id)}
                                size="sm"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              To set up your service catalog:
            </p>
            <ol className="mt-2 ml-4 list-decimal space-y-1 text-muted-foreground text-sm">
              <li>
                First, create service categories to organize your offerings
              </li>
              <li>Then add services within each category</li>
              <li>
                Services can be marked as featured to highlight them in the
                catalog
              </li>
            </ol>
            <p className="mt-2 text-muted-foreground text-sm">
              Refer to the service specifications at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                /specs/business-rules/
              </code>{" "}
              for detailed service definitions for GCMC and KAJ.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialogs */}
      <CategoryFormDialog
        business={selectedBusiness}
        category={editingCategory}
        onOpenChange={handleCategoryDialogClose}
        open={categoryDialogOpen}
      />
      <ServiceFormDialog
        business={selectedBusiness}
        onOpenChange={handleServiceDialogClose}
        open={serviceDialogOpen}
        service={editingService}
      />

      {/* Delete Service Confirmation */}
      <AlertDialog
        onOpenChange={(open: boolean) => !open && setDeleteServiceId(null)}
        open={!!deleteServiceId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {serviceToDelete?.displayName}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteServiceMutation.isPending}
              onClick={() => {
                if (deleteServiceId) {
                  deleteServiceMutation.mutate(deleteServiceId);
                }
              }}
            >
              {deleteServiceMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}{" "}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog
        onOpenChange={(open: boolean) => !open && setDeleteCategoryId(null)}
        open={!!deleteCategoryId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {categoryToDelete?.displayName}&quot;? This action cannot be
              undone. Note: Categories with existing services cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
              onClick={() => {
                if (deleteCategoryId) {
                  deleteCategoryMutation.mutate(deleteCategoryId);
                }
              }}
            >
              {deleteCategoryMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}{" "}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
