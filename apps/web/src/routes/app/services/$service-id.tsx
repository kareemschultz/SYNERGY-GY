import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceDetail } from "@/components/services/service-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/services/$service-id")({
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { "service-id": serviceId } = Route.useParams();

  const {
    data: service,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => client.serviceCatalog.services.getById({ id: serviceId }),
  });

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader
          actions={
            <Button asChild variant="outline">
              <Link to="/app/services">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
              </Link>
            </Button>
          }
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Services", href: "/app/services" },
            { label: "Service Details" },
          ]}
          description="The service you are looking for does not exist or you do not have access to it."
          title="Service Not Found"
        />
        <div className="p-6">
          <p className="text-muted-foreground">
            {error.message || "An error occurred while loading the service."}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Services", href: "/app/services" },
            { label: "Service Details" },
          ]}
          title="Loading..."
        />
        <div className="space-y-6 p-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Services", href: "/app/services" },
            { label: "Service Details" },
          ]}
          title="Service Not Found"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link to="/app/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Services", href: "/app/services" },
          { label: service.displayName },
        ]}
        description={service.category?.displayName}
        title={service.displayName}
      />
      <div className="p-6">
        <ServiceDetail service={service} />
      </div>
    </div>
  );
}
