import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { client } from "@/utils/orpc";

type ServicePickerProps = {
  business: "GCMC" | "KAJ";
  onSelect: (service: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    basePrice: string;
    pricingType: string;
  }) => void;
  disabled?: boolean;
};

export function ServicePicker({
  business,
  onSelect,
  disabled,
}: ServicePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ["services-for-invoice", business, search],
    queryFn: () =>
      client.serviceCatalog.services.list({
        business,
        isActive: true,
        search: search || undefined,
        limit: 50,
        sortBy: "displayName",
        sortOrder: "asc",
      }),
    enabled: open,
  });

  const services = servicesData?.services || [];

  const handleSelect = (service: (typeof services)[0]) => {
    onSelect({
      id: service.id,
      name: service.name,
      displayName: service.displayName,
      description: service.shortDescription || service.displayName,
      basePrice: service.basePrice || "0",
      pricingType: service.pricingType,
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled || !business} size="sm" variant="outline">
          <Package className="mr-2 h-4 w-4" />
          Add from Catalog
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Service</DialogTitle>
          <DialogDescription>
            Add a service from the {business} catalog to this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              value={search}
            />
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {search
                    ? "No services match your search"
                    : "No services available"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {services.map((service) => (
                  <button
                    className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                    key={service.id}
                    onClick={() => handleSelect(service)}
                    type="button"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {service.displayName}
                        </span>
                        {service.isFeatured ? (
                          <Badge variant="secondary">Featured</Badge>
                        ) : null}
                      </div>
                      {service.shortDescription ? (
                        <p className="mt-1 line-clamp-1 text-muted-foreground text-sm">
                          {service.shortDescription}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <Badge variant="outline">{service.pricingType}</Badge>
                        {service.category ? (
                          <span className="text-muted-foreground">
                            {service.category.displayName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      {service.basePrice ? (
                        <span className="font-semibold">
                          {formatCurrency(
                            Number(service.basePrice),
                            service.currency
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Custom</span>
                      )}
                      {service.maxPrice && service.pricingType === "RANGE" ? (
                        <p className="text-muted-foreground text-xs">
                          up to{" "}
                          {formatCurrency(
                            Number(service.maxPrice),
                            service.currency
                          )}
                        </p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
