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

export const Route = createFileRoute("/app/calendar/new")({
  component: NewDeadlinePage,
});

const typeOptions = [
  { value: "FILING", label: "Filing (Tax filings, regulatory)" },
  { value: "RENEWAL", label: "Renewal (Permits, licenses)" },
  { value: "PAYMENT", label: "Payment (Due dates)" },
  { value: "SUBMISSION", label: "Submission (Documents)" },
  { value: "MEETING", label: "Meeting (Court dates, client meetings)" },
  { value: "FOLLOWUP", label: "Follow-up (Reminders)" },
  { value: "OTHER", label: "Other" },
] as const;

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

const recurrenceOptions = [
  { value: "NONE", label: "No recurrence" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
] as const;

type DeadlineType = (typeof typeOptions)[number]["value"];
type Priority = (typeof priorityOptions)[number]["value"];
type Recurrence = (typeof recurrenceOptions)[number]["value"];

interface FormValues {
  title: string;
  description: string;
  type: DeadlineType;
  clientId: string;
  matterId: string;
  business: "GCMC" | "KAJ" | "";
  dueDate: string;
  dueTime: string;
  recurrencePattern: Recurrence;
  recurrenceEndDate: string;
  priority: Priority;
}

function NewDeadlinePage() {
  const navigate = useNavigate();
  const [clientSearch, setClientSearch] = useState("");
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    displayName: string;
  } | null>(null);

  // Search clients
  const { data: clientResults } = useQuery({
    queryKey: ["clientSearch", clientSearch],
    queryFn: () => client.clients.search({ query: clientSearch, limit: 10 }),
    enabled: clientSearch.length >= 2,
  });

  // Get matters for selected client
  const { data: matters } = useQuery({
    queryKey: ["clientMatters", selectedClient?.id],
    queryFn: () =>
      client.matters.list({
        clientId: selectedClient?.id,
        page: 1,
        limit: 50,
      }),
    enabled: selectedClient !== null,
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const dueDateTime = values.dueTime
        ? `${values.dueDate}T${values.dueTime}:00`
        : `${values.dueDate}T09:00:00`;

      return client.deadlines.create({
        title: values.title,
        description: values.description || undefined,
        type: values.type,
        clientId: values.clientId || undefined,
        matterId: values.matterId || undefined,
        business: values.business || undefined,
        dueDate: new Date(dueDateTime).toISOString(),
        recurrencePattern: values.recurrencePattern,
        recurrenceEndDate: values.recurrenceEndDate || undefined,
        priority: values.priority,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["calendarData"] });
      queryClient.invalidateQueries({ queryKey: ["deadlineStats"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingDeadlines"] });
      toast.success("Deadline created successfully");
      navigate({ to: "/app/calendar" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deadline");
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "OTHER" as DeadlineType,
      clientId: "",
      matterId: "",
      business: "" as "GCMC" | "KAJ" | "",
      dueDate: "",
      dueTime: "",
      recurrencePattern: "NONE" as Recurrence,
      recurrenceEndDate: "",
      priority: "NORMAL" as Priority,
    } satisfies FormValues,
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      if (!value.dueDate) {
        toast.error("Please select a due date");
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
              <Link to="/app/calendar">
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
              Create Deadline
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Calendar", href: "/app/calendar" },
          { label: "New Deadline" },
        ]}
        description="Create a new deadline or reminder"
        title="New Deadline"
      />

      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Deadline Information</CardTitle>
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
                      placeholder="e.g., File Q4 Tax Returns"
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
                      placeholder="Additional details..."
                      rows={2}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="type">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Type *</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as DeadlineType)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

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

                <form.Field name="business">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Business</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as "GCMC" | "KAJ" | "")
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Both</SelectItem>
                          <SelectItem value="GCMC">GCMC</SelectItem>
                          <SelectItem value="KAJ">KAJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Due Date & Recurrence */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="dueDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Due Date *</Label>
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

                <form.Field name="dueTime">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Time (optional)</Label>
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="recurrencePattern">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Recurrence</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as Recurrence)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recurrence" />
                        </SelectTrigger>
                        <SelectContent>
                          {recurrenceOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="recurrenceEndDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Recurrence End Date</Label>
                      <Input
                        disabled={
                          form.state.values.recurrencePattern === "NONE"
                        }
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
            </CardContent>
          </Card>

          {/* Link to Client/Matter */}
          <Card>
            <CardHeader>
              <CardTitle>Link to Client/Matter (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Client Search */}
                <div className="space-y-2">
                  <Label>Client</Label>
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
                                  form.setFieldValue("matterId", "");
                                  setClientPopoverOpen(false);
                                }}
                                value={c.displayName}
                              >
                                {c.displayName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Matter Selection */}
                <form.Field name="matterId">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Matter</Label>
                      <Select
                        disabled={!selectedClient}
                        onValueChange={field.handleChange}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              selectedClient
                                ? "Select a matter..."
                                : "Select client first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {matters?.matters.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.referenceNumber} - {m.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
