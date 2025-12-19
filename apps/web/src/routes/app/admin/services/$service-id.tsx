import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Loader2,
  Package,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/services/$service-id")({
  component: ServiceDetailPage,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Service detail page displays comprehensive service information including pricing, requirements, agencies, and edit functionality
function ServiceDetailPage() {
  const { serviceId } = Route.useParams();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    data: service,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => client.serviceCatalog.services.getById({ id: serviceId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Service not found</p>
        <Button asChild variant="outline">
          <Link to="/app/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  const pricingTiers =
    (service.pricingTiers as Array<{
      name: string;
      description?: string;
      price?: number;
      minPrice?: number;
      maxPrice?: number;
      conditions?: string;
    }>) || [];

  const documentRequirements = (service.documentRequirements as string[]) || [];
  const deliverables = (service.deliverables as string[]) || [];
  const topicsCovered = (service.topicsCovered as string[]) || [];
  const tags = (service.tags as string[]) || [];
  const governmentAgencies = (service.governmentAgencies as string[]) || [];

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/app/admin/services" })}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Service
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Services", href: "/app/admin/services" },
          { label: service.displayName },
        ]}
        description={service.shortDescription || "Service details"}
        title={service.displayName}
      />

      <div className="space-y-6 p-6">
        {/* Header Info */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
          {service.isFeatured ? (
            <Badge variant="outline">Featured</Badge>
          ) : null}
          <Badge className="bg-blue-100 text-blue-700" variant="outline">
            <Building2 className="mr-1 h-3 w-3" />
            {service.business}
          </Badge>
          {service.category ? (
            <Badge className="bg-purple-100 text-purple-700" variant="outline">
              <Tag className="mr-1 h-3 w-3" />
              {service.category.displayName}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {service.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {/* Topics Covered */}
            {topicsCovered.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Topics Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-5">
                    {topicsCovered.map((topic) => (
                      <li className="text-muted-foreground" key={topic}>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* Document Requirements */}
            {documentRequirements.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Requirements
                  </CardTitle>
                  <CardDescription>
                    Required documents for this service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {documentRequirements.map((doc) => (
                      <li
                        className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3"
                        key={doc}
                      >
                        <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* Deliverables */}
            {deliverables.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Deliverables</CardTitle>
                  <CardDescription>
                    What the client receives upon completion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {deliverables.map((item) => (
                      <li className="flex items-center gap-2" key={item}>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* Workflow */}
            {service.workflow ? (
              <Card>
                <CardHeader>
                  <CardTitle>Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {service.workflow}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">{service.pricingType}</Badge>
                </div>

                {service.basePrice ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {service.pricingType === "RANGE" ? "From" : "Price"}
                    </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        Number(service.basePrice),
                        service.currency
                      )}
                    </span>
                  </div>
                ) : null}

                {service.maxPrice !== null &&
                service.pricingType === "RANGE" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        Number(service.maxPrice),
                        service.currency
                      )}
                    </span>
                  </div>
                ) : null}

                {service.pricingNotes ? (
                  <>
                    <Separator />
                    <p className="text-muted-foreground text-sm">
                      {service.pricingNotes}
                    </p>
                  </>
                ) : null}

                {service.discountsAvailable ? (
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                    <p className="font-medium text-green-700 text-sm dark:text-green-400">
                      Discounts: {String(service.discountsAvailable)}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Pricing Tiers */}
            {pricingTiers.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Tiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pricingTiers.map((tier) => {
                    const renderTierPrice = () => {
                      if (tier.price) {
                        return (
                          <span className="font-bold">
                            {formatCurrency(tier.price, service.currency)}
                          </span>
                        );
                      }
                      if (
                        tier.minPrice !== undefined &&
                        tier.maxPrice !== undefined
                      ) {
                        return (
                          <span className="text-sm">
                            {formatCurrency(
                              tier.minPrice ?? 0,
                              service.currency
                            )}{" "}
                            -{" "}
                            {formatCurrency(
                              tier.maxPrice ?? 0,
                              service.currency
                            )}
                          </span>
                        );
                      }
                      return null;
                    };

                    return (
                      <div className="rounded-lg border p-3" key={tier.name}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tier.name}</span>
                          {renderTierPrice()}
                        </div>
                        {tier.description ? (
                          <p className="mt-1 text-muted-foreground text-sm">
                            {tier.description}
                          </p>
                        ) : null}
                        {tier.conditions ? (
                          <p className="mt-1 text-muted-foreground text-xs italic">
                            {tier.conditions}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : null}

            {/* Duration & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.typicalDuration ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {service.typicalDuration}
                    </span>
                  </div>
                ) : null}
                {service.estimatedDays ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Est. Days</span>
                    <span className="font-medium">
                      {service.estimatedDays} days
                    </span>
                  </div>
                ) : null}
                {service.typicalDuration || service.estimatedDays ? null : (
                  <p className="text-muted-foreground text-sm">
                    No timeline information available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Government Fees & Agencies */}
            {service.governmentFees || governmentAgencies.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Government Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.governmentFees ? (
                    <div>
                      <span className="font-medium text-sm">Fees</span>
                      <p className="text-muted-foreground text-sm">
                        {service.governmentFees}
                      </p>
                    </div>
                  ) : null}
                  {governmentAgencies.length > 0 ? (
                    <div>
                      <span className="font-medium text-sm">Agencies</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {governmentAgencies.map((agency) => (
                          <Badge key={agency} variant="secondary">
                            {agency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {/* Tags */}
            {tags.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle>System Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Name</span>
                  <code className="rounded bg-muted px-1">{service.name}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sort Order</span>
                  <span>{service.sortOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {new Date(service.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <ServiceFormDialog
        business={service.business}
        onOpenChange={setEditDialogOpen}
        open={editDialogOpen}
        service={service}
      />
    </div>
  );
}
