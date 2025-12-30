import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
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

export const Route = createFileRoute("/app/appointments/new")({
  component: NewAppointmentPage,
});

type LocationType = "IN_PERSON" | "PHONE" | "VIDEO";

type FormValues = {
  clientId: string;
  appointmentTypeId: string;
  matterId: string;
  business: "GCMC" | "KAJ";
  title: string;
  description: string;
  scheduledAt: string;
  scheduledTime: string;
  durationMinutes: number;
  locationType: LocationType;
  location: string;
  preAppointmentNotes: string;
  clientNotes: string;
};

function NewAppointmentPage() {
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

  // Get appointment types for selected business
  const { data: appointmentTypes } = useQuery({
    queryKey: ["appointmentTypes", selectedBusiness],
    queryFn: () =>
      client.appointments.types.list({
        business: selectedBusiness || undefined,
      }),
    enabled: selectedBusiness !== null,
  });

  // Get matters for selected client (optional linking)
  const { data: clientMatters } = useQuery({
    queryKey: ["clientMatters", selectedClient?.id],
    queryFn: () =>
      client.matters.list({
        clientId: selectedClient?.id,
        limit: 50,
      }),
    enabled: !!selectedClient?.id,
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      // Combine date and time
      const scheduledAt = new Date(
        `${values.scheduledAt}T${values.scheduledTime}`
      ).toISOString();

      return client.appointments.create({
        clientId: values.clientId,
        appointmentTypeId: values.appointmentTypeId,
        matterId:
          values.matterId && values.matterId !== "__none__"
            ? values.matterId
            : undefined,
        business: values.business,
        title: values.title,
        description: values.description || undefined,
        scheduledAt,
        durationMinutes: values.durationMinutes,
        locationType: values.locationType,
        location: values.location || undefined,
        preAppointmentNotes: values.preAppointmentNotes || undefined,
        clientNotes: values.clientNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment created successfully");
      navigate({ to: "/app/appointments" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create appointment");
    },
  });

  const form = useForm({
    defaultValues: {
      clientId: "",
      appointmentTypeId: "",
      matterId: "",
      business: "" as "GCMC" | "KAJ",
      title: "",
      description: "",
      scheduledAt: new Date().toISOString().split("T")[0],
      scheduledTime: "09:00",
      durationMinutes: 30,
      locationType: "IN_PERSON" as LocationType,
      location: "",
      preAppointmentNotes: "",
      clientNotes: "",
    } satisfies FormValues,
    // biome-ignore lint/suspicious/useAwait: TanStack Form expects async handler
    onSubmit: async ({ value }) => {
      if (!value.clientId) {
        toast.error("Please select a client");
        return;
      }
      if (!value.appointmentTypeId) {
        toast.error("Please select an appointment type");
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

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/appointments">
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
              Create Appointment
            </Button>
          </div>
        }
        description="Schedule a new appointment with a client"
        title="New Appointment"
      />

      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Client & Business Selection */}
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
                          // Reset appointment type when business changes
                          form.setFieldValue("appointmentTypeId", "");
                        }}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GCMC">
                            GCMC (Training, Consulting)
                          </SelectItem>
                          <SelectItem value="KAJ">
                            KAJ (Tax, Accounting)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Appointment Type Selection */}
              {selectedBusiness ? (
                <form.Field name="appointmentTypeId">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Appointment Type *</Label>
                      <Select
                        onValueChange={(value) => {
                          field.handleChange(value);
                          // Auto-fill title and duration based on appointment type
                          const selectedType = appointmentTypes?.find(
                            (at) => at.id === value
                          );
                          if (selectedType) {
                            if (!form.state.values.title) {
                              form.setFieldValue("title", selectedType.name);
                            }
                            form.setFieldValue(
                              "durationMinutes",
                              selectedType.defaultDurationMinutes
                            );
                          }
                        }}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select appointment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentTypes?.map((at) => (
                            <SelectItem key={at.id} value={at.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-2 rounded-full"
                                  style={{
                                    backgroundColor: at.color ?? "#6b7280",
                                  }}
                                />
                                {at.name} ({at.defaultDurationMinutes} min)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              ) : null}

              {/* Link to Matter (optional) */}
              {!!selectedClient && (clientMatters?.matters?.length ?? 0) > 0 ? (
                <form.Field name="matterId">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        Link to Matter (Optional)
                      </Label>
                      <Select
                        onValueChange={field.handleChange}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a matter to link" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            No matter linked
                          </SelectItem>
                          {clientMatters?.matters?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.title} ({m.referenceNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              ) : null}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
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
                      placeholder="Enter appointment title"
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
                      placeholder="Additional details about this appointment..."
                      rows={3}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="scheduledAt">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Date *</Label>
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

                <form.Field name="scheduledTime">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Time *</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="time"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="durationMinutes">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Duration (minutes)</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(Number.parseInt(value, 10))
                        }
                        value={String(field.state.value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="locationType">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Type</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as LocationType)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Location type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_PERSON">In Person</SelectItem>
                          <SelectItem value="PHONE">Phone Call</SelectItem>
                          <SelectItem value="VIDEO">Video Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="location">
                  {(field) => {
                    const locationType = form.state.values.locationType;
                    const locationLabels: Record<string, string> = {
                      IN_PERSON: "Address",
                      VIDEO: "Meeting Link",
                      PHONE: "Phone Number",
                    };
                    const locationPlaceholders: Record<string, string> = {
                      IN_PERSON: "Office address or location",
                      VIDEO: "https://meet.google.com/...",
                      PHONE: "Phone number to call",
                    };
                    return (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          {locationLabels[locationType] || "Location"}
                        </Label>
                        <Input
                          id={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={
                            locationPlaceholders[locationType] ||
                            "Enter location"
                          }
                          value={field.state.value}
                        />
                      </div>
                    );
                  }}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="preAppointmentNotes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Staff Notes (Internal)</Label>
                    <Textarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Internal notes for staff only..."
                      rows={2}
                      value={field.state.value}
                    />
                    <p className="text-muted-foreground text-xs">
                      Only visible to staff members
                    </p>
                  </div>
                )}
              </form.Field>

              <form.Field name="clientNotes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Client Notes (Visible in Portal)
                    </Label>
                    <Textarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Notes visible to the client in their portal..."
                      rows={2}
                      value={field.state.value}
                    />
                    <p className="text-muted-foreground text-xs">
                      This will be visible to the client in their portal
                    </p>
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
