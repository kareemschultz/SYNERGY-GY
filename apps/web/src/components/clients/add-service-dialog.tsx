import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCategoryAccordion } from "@/components/wizards/client-onboarding/service-category-accordion";
import { ServiceCheckboxItem } from "@/components/wizards/client-onboarding/service-checkbox-item";
import { ServiceDetailsModal } from "@/components/wizards/client-onboarding/service-details-modal";
import {
  BUSINESSES,
  type ServiceCatalogItem,
} from "@/components/wizards/client-onboarding/types";
import { client, queryClient } from "@/utils/orpc";

type ServicesGroupedByCategory = Awaited<
  ReturnType<typeof client.serviceCatalog.services.getForWizard>
>;

type AddServiceDialogProps = {
  clientId: string;
  businesses: string[]; // "GCMC" | "KAJ"
  trigger?: React.ReactNode;
};

export function AddServiceDialog({
  clientId,
  businesses,
  trigger,
}: AddServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceForDetails, setSelectedServiceForDetails] =
    useState<ServiceCatalogItem | null>(null);

  // Determine available businesses based on client data
  const availableBusinesses = BUSINESSES.filter((b) =>
    businesses.includes(b.value)
  );

  const defaultTab = availableBusinesses[0]?.value || "GCMC";

  // Fetch GCMC services
  const { data: gcmcData, isLoading: gcmcLoading } =
    useQuery<ServicesGroupedByCategory>({
      queryKey: ["serviceCatalog", "wizard", "GCMC"],
      queryFn: async () =>
        await client.serviceCatalog.services.getForWizard({ business: "GCMC" }),
      enabled: open && businesses.includes("GCMC"),
    });

  // Fetch KAJ services
  const { data: kajData, isLoading: kajLoading } =
    useQuery<ServicesGroupedByCategory>({
      queryKey: ["serviceCatalog", "wizard", "KAJ"],
      queryFn: async () =>
        await client.serviceCatalog.services.getForWizard({ business: "KAJ" }),
      enabled: open && businesses.includes("KAJ"),
    });

  const saveMutation = useMutation({
    mutationFn: () =>
      client.clientServices.saveSelections({
        clientId,
        serviceIds: selectedServiceIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientServices", clientId] });
      toast.success("Services added successfully");
      setOpen(false);
      setSelectedServiceIds([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add services");
    },
  });

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedServiceIds([]);
      setSearchQuery("");
    }
  };

  const filterServices = (data: ServicesGroupedByCategory | undefined) => {
    if (!(data && searchQuery)) return data;
    const lowerQuery = searchQuery.toLowerCase();
    const filtered: ServicesGroupedByCategory = {};

    for (const [key, category] of Object.entries(data)) {
      const matchingServices = category.services.filter(
        (s) =>
          s.displayName.toLowerCase().includes(lowerQuery) ||
          s.shortDescription?.toLowerCase().includes(lowerQuery) ||
          (s.description && s.description.toLowerCase().includes(lowerQuery))
      );

      if (matchingServices.length > 0) {
        filtered[key] = {
          ...category,
          services: matchingServices,
        };
      }
    }

    return filtered;
  };

  return (
    <>
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Add Services</DialogTitle>
            <DialogDescription>
              Select services to add to this client's profile.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              value={searchQuery}
            />
          </div>

          <Tabs className="flex-1 overflow-hidden" defaultValue={defaultTab}>
            {Boolean(availableBusinesses.length > 1) && (
              <TabsList className="w-full justify-start">
                {availableBusinesses.map((b) => (
                  <TabsTrigger key={b.value} value={b.value}>
                    {b.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <div className="flex-1 overflow-hidden p-1">
              {availableBusinesses.map((b) => (
                <TabsContent className="h-full" key={b.value} value={b.value}>
                  <ScrollArea className="h-[50vh] pr-4">
                    {b.value === "GCMC" ? (
                      gcmcLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-3 pb-4">
                          {Object.entries(filterServices(gcmcData) || {}).map(
                            ([categoryKey, category]) => (
                              <ServiceCategoryAccordion
                                categoryDescription={
                                  category.categoryDescription
                                }
                                categoryDisplayName={
                                  category.categoryDisplayName
                                }
                                categoryName={category.categoryName}
                                key={categoryKey}
                                onServiceDetails={setSelectedServiceForDetails}
                                onServiceToggle={toggleService}
                                renderServiceItem={(service, isSelected) => (
                                  <ServiceCheckboxItem
                                    isSelected={isSelected}
                                    key={service.id}
                                    onShowDetails={() =>
                                      setSelectedServiceForDetails(service)
                                    }
                                    onToggle={() => toggleService(service.id)}
                                    service={service}
                                  />
                                )}
                                selectedServiceIds={selectedServiceIds}
                                services={category.services}
                              />
                            )
                          )}
                        </div>
                      )
                    ) : kajLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-3 pb-4">
                        {Object.entries(filterServices(kajData) || {}).map(
                          ([categoryKey, category]) => (
                            <ServiceCategoryAccordion
                              categoryDescription={category.categoryDescription}
                              categoryDisplayName={category.categoryDisplayName}
                              categoryName={category.categoryName}
                              key={categoryKey}
                              onServiceDetails={setSelectedServiceForDetails}
                              onServiceToggle={toggleService}
                              renderServiceItem={(service, isSelected) => (
                                <ServiceCheckboxItem
                                  isSelected={isSelected}
                                  key={service.id}
                                  onShowDetails={() =>
                                    setSelectedServiceForDetails(service)
                                  }
                                  onToggle={() => toggleService(service.id)}
                                  service={service}
                                />
                              )}
                              selectedServiceIds={selectedServiceIds}
                              services={category.services}
                            />
                          )
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="text-muted-foreground text-sm">
                {selectedServiceIds.length} service
                {selectedServiceIds.length !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={saveMutation.isPending}
                  onClick={() => setOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    selectedServiceIds.length === 0 || saveMutation.isPending
                  }
                  onClick={() => saveMutation.mutate()}
                >
                  {Boolean(saveMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Services
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServiceDetailsModal
        isOpen={selectedServiceForDetails !== null}
        onClose={() => setSelectedServiceForDetails(null)}
        service={selectedServiceForDetails}
      />
    </>
  );
}
