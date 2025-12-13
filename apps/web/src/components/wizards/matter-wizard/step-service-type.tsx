import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";
import { WizardStep, WizardStepSection } from "../wizard-step";
import type { MatterWizardData } from "./types";

type StepServiceTypeProps = {
  data: MatterWizardData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MatterWizardData>) => void;
};

export function StepServiceType({
  data,
  errors,
  onUpdate,
}: StepServiceTypeProps) {
  // Get service types for selected business
  const { data: serviceTypes } = useQuery({
    queryKey: ["serviceTypes", data.business],
    queryFn: () =>
      client.matters.getServiceTypes({
        business: data.business || undefined,
      }),
    enabled: !!data.business,
  });

  // Group service types by category
  const groupedServiceTypes = useMemo(() => {
    if (!serviceTypes) {
      return null;
    }
    return serviceTypes.reduce(
      (acc, st) => {
        const category = st.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(st);
        return acc;
      },
      {} as Record<string, typeof serviceTypes>
    );
  }, [serviceTypes]);

  return (
    <WizardStep
      description="Select the business unit and type of service for this matter."
      icon={<Briefcase className="h-6 w-6" />}
      title="Business & Service"
    >
      <WizardStepSection>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Business Selection */}
          <div className="space-y-2">
            <Label>Business *</Label>
            <Select
              onValueChange={(value) => {
                onUpdate({
                  business: value as "GCMC" | "KAJ",
                  serviceTypeId: "",
                  serviceTypeName: "",
                });
              }}
              value={data.business}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GCMC">
                  GCMC (Training, Consulting, Paralegal)
                </SelectItem>
                <SelectItem value="KAJ">
                  KAJ (Tax, Accounting, Financial)
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.business ? (
              <p className="text-destructive text-sm">{errors.business}</p>
            ) : null}
          </div>

          {/* Service Type Selection - only show when business is selected */}
          <div className="space-y-2">
            <Label>Service Type *</Label>
            {data.business ? (
              serviceTypes && serviceTypes.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    No service types available for {data.business}.
                  </p>
                  <Link
                    className="mt-2 inline-block text-primary text-sm hover:underline"
                    to="/app/services"
                  >
                    Create service types
                  </Link>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={(value) => {
                      const selectedService = serviceTypes?.find(
                        (st) => st.id === value
                      );
                      onUpdate({
                        serviceTypeId: value,
                        serviceTypeName: selectedService?.name || "",
                        title: data.title || selectedService?.name || "",
                      });
                    }}
                    value={data.serviceTypeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedServiceTypes &&
                        Object.entries(groupedServiceTypes).map(
                          ([category, types]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                {category}
                              </div>
                              {types?.map((st) => (
                                <SelectItem key={st.id} value={st.id}>
                                  {st.name}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        )}
                    </SelectContent>
                  </Select>
                  {errors.serviceTypeId ? (
                    <p className="text-destructive text-sm">
                      {errors.serviceTypeId}
                    </p>
                  ) : null}
                </>
              )
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Select a business first
                </p>
              </div>
            )}
          </div>
        </div>
      </WizardStepSection>
    </WizardStep>
  );
}
