import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/matters/new")({
  component: NewMatterPage,
});

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

type Priority = (typeof priorityOptions)[number]["value"];

interface FormValues {
  clientId: string;
  serviceTypeId: string;
  business: "GCMC" | "KAJ";
  title: string;
  description: string;
  priority: Priority;
  startDate: string;
  dueDate: string;
  estimatedFee: string;
  taxYear: number | undefined;
}

function NewMatterPage() {
  const navigate = useNavigate();
  const [clientSearch, setClientSearch] = useState("");
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<
    "GCMC" | "KAJ" | null
  >(null);

  // Search clients
  const { data: clientResults } = useQuery({
    queryKey: ["clientSearch", clientSearch],
    queryFn: () => client.clients.search({ query: clientSearch, limit: 10 }),
    enabled: clientSearch.length >= 2,
  });

  // Get service types for selected business
  const { data: serviceTypes } = useQuery({
    queryKey: ["serviceTypes", selectedBusiness],
    queryFn: () =>
      client.matters.getServiceTypes({
        business: selectedBusiness || undefined,
      }),
    enabled: selectedBusiness !== null,
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      client.matters.create({
        ...values,
        taxYear: values.taxYear || undefined,
        estimatedFee: values.estimatedFee || undefined,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        description: values.description || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      toast.success("Matter created successfully");
      navigate({ to: "/app/matters/$matterId", params: { matterId: data.id } });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create matter");
    },
  });

  const form = useForm({
    defaultValues: {
      clientId: "",
      serviceTypeId: "",
      business: "" as "GCMC" | "KAJ",
      title: "",
      description: "",
      priority: "NORMAL" as Priority,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      estimatedFee: "",
      taxYear: undefined as number | undefined,
    } satisfies FormValues,
    onSubmit: async ({ value }) => {
      if (!value.clientId) {
        toast.error("Please select a client");
        return;
      }
      if (!value.serviceTypeId) {
        toast.error("Please select a service type");
        return;
      }
      if (!value.business) {
        toast.error("Please select a business");
        return;
      }
      if (!value.title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      createMutation.mutate(value);
    },
  });

  // Group service types by category
  const groupedServiceTypes = serviceTypes?.reduce(
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

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/matters">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => form.handleSubmit()}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Create Matter
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Matters", href: "/app/matters" },
          { label: "New Matter" },
        ]}
        description="Create a new service request or case"
        title="New Matter"
      />

      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Client & Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Client Search */}
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Popover
                    onOpenChange={setClientPopoverOpen}
                    open={clientPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        className="w-full justify-start"
                        role="combobox"
                        variant="outline"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {selectedClient
                          ? selectedClient.displayName
                          : "Search for a client..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          onValueChange={setClientSearch}
                          placeholder="Search clients..."
                          value={clientSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {clientSearch.length < 2
                              ? "Type at least 2 characters..."
                              : "No clients found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {clientResults?.map((c) => (
                              <CommandItem
                                key={c.id}
                                onSelect={() => {
                                  setSelectedClient({
                                    id: c.id,
                                    displayName: c.displayName,
                                  });
                                  form.setFieldValue("clientId", c.id);
                                  setClientPopoverOpen(false);
                                }}
                                value={c.displayName}
                              >
                                <div className="flex flex-col">
                                  <span>{c.displayName}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {c.type} · {c.businesses.join(", ")}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Business Selection */}
                <form.Field name="business">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Business *</Label>
                      <Select
                        onValueChange={(value) => {
                          field.handleChange(value as "GCMC" | "KAJ");
                          setSelectedBusiness(value as "GCMC" | "KAJ");
                          // Reset service type when business changes
                          form.setFieldValue("serviceTypeId", "");
                        }}
                        value={field.state.value}
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
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Service Type Selection */}
              {selectedBusiness && (
                <form.Field name="serviceTypeId">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Service Type *</Label>
                      <Select
                        onValueChange={(value) => {
                          field.handleChange(value);
                          // Auto-fill title based on service type
                          const selectedService = serviceTypes?.find(
                            (st) => st.id === value
                          );
                          if (selectedService && !form.state.values.title) {
                            form.setFieldValue("title", selectedService.name);
                          }
                        }}
                        value={field.state.value}
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
                    </div>
                  )}
                </form.Field>
              )}
            </CardContent>
          </Card>

          {/* Matter Details */}
          <Card>
            <CardHeader>
              <CardTitle>Matter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="title">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Title *</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter matter title"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Additional details about this matter..."
                      rows={3}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="priority">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Priority</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as Priority)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="taxYear">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Tax Year</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value
                              ? Number.parseInt(e.target.value, 10)
                              : undefined
                          )
                        }
                        placeholder="e.g., 2024"
                        type="number"
                        value={field.state.value || ""}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="startDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Start Date</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="date"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="dueDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Due Date</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="date"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="estimatedFee">
                {(field) => (
                  <div className="space-y-2 md:w-1/2">
                    <Label htmlFor={field.name}>Estimated Fee (GYD)</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 50000"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
