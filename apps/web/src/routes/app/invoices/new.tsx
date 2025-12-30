import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LineItem } from "@/components/invoices/line-item-editor";
import { LineItemEditor } from "@/components/invoices/line-item-editor";
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

export const Route = createFileRoute("/app/invoices/new")({
  component: NewInvoicePage,
});

type FormValues = {
  business: "GCMC" | "KAJ";
  clientId: string;
  matterId: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: LineItem[];
  taxAmount: string;
  notes: string;
  terms: string;
  referenceNumber: string;
};

function NewInvoicePage() {
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

  // Get client matters when client is selected
  const { data: clientMatters } = useQuery({
    queryKey: ["matters", selectedClient?.id],
    queryFn: () =>
      client.matters.list({
        page: 1,
        limit: 100,
        clientId: selectedClient?.id,
      }),
    enabled: !!selectedClient?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      client.invoices.create({
        business: values.business,
        clientId: values.clientId,
        matterId:
          values.matterId && values.matterId !== "__none__"
            ? values.matterId
            : undefined,
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate,
        lineItems: values.lineItems,
        taxAmount: values.taxAmount || "0",
        notes: values.notes || undefined,
        terms: values.terms || undefined,
        referenceNumber: values.referenceNumber || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      navigate({
        to: "/app/invoices/$invoiceId",
        params: { invoiceId: data.id },
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });

  const form = useForm({
    defaultValues: {
      business: "" as FormValues["business"],
      clientId: "",
      matterId: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      lineItems: [] as FormValues["lineItems"],
      taxAmount: "0",
      notes: "",
      terms: "",
      referenceNumber: "",
    } satisfies FormValues,
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
    // biome-ignore lint/suspicious/useAwait: Auto-fix
    onSubmit: async ({ value }) => {
      // Validation
      if (!value.business) {
        toast.error("Please select a business");
        return;
      }
      if (!value.clientId) {
        toast.error("Please select a client");
        return;
      }
      if (!value.invoiceDate) {
        toast.error("Please enter an invoice date");
        return;
      }
      if (!value.dueDate) {
        toast.error("Please enter a due date");
        return;
      }
      if (value.lineItems.length === 0) {
        toast.error("Please add at least one line item");
        return;
      }

      // Validate line items
      for (const [index, item] of value.lineItems.entries()) {
        if (!item.description.trim()) {
          toast.error(`Line item ${index + 1}: Description is required`);
          return;
        }
        if (!item.unitPrice || Number.parseFloat(item.unitPrice) <= 0) {
          toast.error(
            `Line item ${index + 1}: Unit price must be greater than 0`
          );
          return;
        }
      }

      createMutation.mutate(value);
    },
  });

  // Calculate totals
  const subtotal = form.state.values.lineItems.reduce(
    (sum, item) => sum + Number.parseFloat(item.amount || "0"),
    0
  );
  const taxAmount = Number.parseFloat(form.state.values.taxAmount || "0");
  const totalAmount = subtotal + taxAmount;

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/invoices">
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
              Create Invoice
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Invoices", href: "/app/invoices" },
          { label: "New Invoice" },
        ]}
        description="Create a new invoice for a client"
        title="New Invoice"
      />

      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Client & Business */}
          <Card>
            <CardHeader>
              <CardTitle>Client & Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Business Selection */}
                <form.Field name="business">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Business *</Label>
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as "GCMC" | "KAJ")
                        }
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
              </div>

              {/* Optional Matter Selection */}
              {!!selectedClient &&
                clientMatters &&
                clientMatters.matters.length > 0 && (
                  <form.Field name="matterId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          Related Matter (Optional)
                        </Label>
                        <Select
                          onValueChange={(value) => field.handleChange(value)}
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a matter (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {clientMatters.matters.map((matter) => (
                              <SelectItem key={matter.id} value={matter.id}>
                                {matter.referenceNumber} - {matter.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                )}
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="invoiceDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Invoice Date *</Label>
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

                <form.Field name="referenceNumber">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Client Reference</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="PO or reference number"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field name="lineItems">
                {(field) => (
                  <LineItemEditor
                    business={form.state.values.business || undefined}
                    items={field.state.value}
                    onChange={(items) => field.handleChange(items)}
                  />
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Tax & Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="taxAmount">
                {(field) => (
                  <div className="space-y-2 md:w-1/3">
                    <Label htmlFor={field.name}>Tax Amount (GYD)</Label>
                    <Input
                      id={field.name}
                      min="0"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              {/* Totals Display */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>GYD {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>GYD {taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                      <span>Total:</span>
                      <span>GYD {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="terms">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Payment Terms</Label>
                    <Textarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Payment terms and conditions..."
                      rows={3}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="notes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Internal Notes</Label>
                    <Textarea
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Internal notes (not visible to client)..."
                      rows={3}
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
