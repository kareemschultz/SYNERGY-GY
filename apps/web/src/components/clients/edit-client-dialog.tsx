import type { AnyFieldApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

// Helper component for text input fields
function FormTextField({
  field,
  label,
  type = "text",
  placeholder,
}: {
  field: AnyFieldApi;
  label: string;
  type?: "text" | "email" | "date";
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={field.state.value}
      />
    </div>
  );
}

// Helper to toggle business in array
function toggleBusinessInArray(
  current: ("GCMC" | "KAJ")[],
  business: "GCMC" | "KAJ",
  checked: boolean
): ("GCMC" | "KAJ")[] {
  if (checked) {
    return [...current, business];
  }
  return current.filter((b) => b !== business);
}

const clientTypes = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "SMALL_BUSINESS", label: "Small Business" },
  { value: "CORPORATION", label: "Corporation" },
  { value: "NGO", label: "NGO" },
  { value: "COOP", label: "Cooperative" },
  { value: "CREDIT_UNION", label: "Credit Union" },
  { value: "FOREIGN_NATIONAL", label: "Foreign National" },
  { value: "INVESTOR", label: "Investor" },
] as const;

type ClientType = (typeof clientTypes)[number]["value"];

type ClientData = {
  id: string;
  type: ClientType;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  businessName: string | null;
  registrationNumber: string | null;
  incorporationDate: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tinNumber: string | null;
  nationalId: string | null;
  passportNumber: string | null;
  businesses: ("GCMC" | "KAJ")[];
  notes: string | null;
};

type EditClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: ClientData;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Edit dialog handles complex form with dynamic fields based on client type (individual vs business) and multiple field sections
export function EditClientDialog({
  open,
  onOpenChange,
  clientData,
}: EditClientDialogProps) {
  const updateMutation = useMutation({
    mutationFn: async (values: Parameters<typeof client.clients.update>[0]) =>
      client.clients.update(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientData.id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clientDashboard"] });
      toast.success("Client updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client");
    },
  });

  const form = useForm({
    defaultValues: {
      type: clientData.type as ClientType,
      displayName: clientData.displayName,
      firstName: clientData.firstName || "",
      lastName: clientData.lastName || "",
      dateOfBirth: clientData.dateOfBirth || "",
      nationality: clientData.nationality || "Guyanese",
      businessName: clientData.businessName || "",
      registrationNumber: clientData.registrationNumber || "",
      incorporationDate: clientData.incorporationDate || "",
      email: clientData.email || "",
      phone: clientData.phone || "",
      alternatePhone: clientData.alternatePhone || "",
      address: clientData.address || "",
      city: clientData.city || "",
      country: clientData.country || "Guyana",
      tinNumber: clientData.tinNumber || "",
      nationalId: clientData.nationalId || "",
      passportNumber: clientData.passportNumber || "",
      businesses: clientData.businesses,
      notes: clientData.notes || "",
    },
    onSubmit: ({ value }) => {
      if (!value.displayName.trim()) {
        toast.error("Display Name is required");
        return;
      }
      if (value.businesses.length === 0) {
        toast.error("Please select at least one business (GCMC or KAJ)");
        return;
      }

      const normalize = (input: string | null | undefined) => {
        const trimmed = input?.trim();
        return trimmed ? trimmed : undefined;
      };

      const payload = {
        id: clientData.id,
        ...value,
        displayName: value.displayName.trim(),
        firstName: normalize(value.firstName),
        lastName: normalize(value.lastName),
        dateOfBirth: normalize(value.dateOfBirth),
        nationality: normalize(value.nationality),
        businessName: normalize(value.businessName),
        registrationNumber: normalize(value.registrationNumber),
        incorporationDate: normalize(value.incorporationDate),
        email: normalize(value.email),
        phone: normalize(value.phone),
        alternatePhone: normalize(value.alternatePhone),
        address: normalize(value.address),
        city: normalize(value.city),
        country: normalize(value.country),
        tinNumber: normalize(value.tinNumber),
        nationalId: normalize(value.nationalId),
        passportNumber: normalize(value.passportNumber),
        notes: normalize(value.notes),
      } satisfies Parameters<typeof client.clients.update>[0];

      updateMutation.mutate(payload);
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form.reset]);

  const isIndividual =
    form.state.values.type === "INDIVIDUAL" ||
    form.state.values.type === "FOREIGN_NATIONAL";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information. All changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Client Type *</Label>
                    <Select
                      onValueChange={(value) =>
                        field.handleChange(value as ClientType)
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="displayName">
                {(field) => (
                  <FormTextField
                    field={field}
                    label="Display Name *"
                    placeholder="How this client should be displayed"
                  />
                )}
              </form.Field>
            </div>

            {/* Individual fields */}
            {!!isIndividual && (
              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="firstName">
                  {(field) => (
                    <FormTextField field={field} label="First Name" />
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => <FormTextField field={field} label="Last Name" />}
                </form.Field>

                <form.Field name="dateOfBirth">
                  {(field) => (
                    <FormTextField
                      field={field}
                      label="Date of Birth"
                      type="date"
                    />
                  )}
                </form.Field>
              </div>
            )}

            {/* Business/Organization fields */}
            {!isIndividual && (
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="businessName">
                  {(field) => (
                    <FormTextField field={field} label="Business Name" />
                  )}
                </form.Field>

                <form.Field name="registrationNumber">
                  {(field) => (
                    <FormTextField field={field} label="Registration Number" />
                  )}
                </form.Field>

                <form.Field name="incorporationDate">
                  {(field) => (
                    <FormTextField
                      field={field}
                      label="Incorporation Date"
                      type="date"
                    />
                  )}
                </form.Field>
              </div>
            )}

            <form.Field name="nationality">
              {(field) => (
                <div className="md:w-1/2">
                  <FormTextField field={field} label="Nationality" />
                </div>
              )}
            </form.Field>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="email">
                {(field) => (
                  <FormTextField field={field} label="Email" type="email" />
                )}
              </form.Field>

              <form.Field name="phone">
                {(field) => <FormTextField field={field} label="Phone" />}
              </form.Field>

              <form.Field name="alternatePhone">
                {(field) => (
                  <FormTextField field={field} label="Alternate Phone" />
                )}
              </form.Field>
            </div>

            <form.Field name="address">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Address</Label>
                  <Textarea
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={2}
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <div className="grid gap-4 md:grid-cols-2">
              <form.Field name="city">
                {(field) => <FormTextField field={field} label="City" />}
              </form.Field>

              <form.Field name="country">
                {(field) => <FormTextField field={field} label="Country" />}
              </form.Field>
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Identification</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <form.Field name="tinNumber">
                {(field) => <FormTextField field={field} label="TIN Number" />}
              </form.Field>

              <form.Field name="nationalId">
                {(field) => <FormTextField field={field} label="National ID" />}
              </form.Field>

              <form.Field name="passportNumber">
                {(field) => (
                  <FormTextField field={field} label="Passport Number" />
                )}
              </form.Field>
            </div>
          </div>

          {/* Business Assignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Business Assignment *</h3>
            <form.Field name="businesses">
              {(field) => (
                <div className="flex gap-6">
                  <div className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={field.state.value.includes("GCMC")}
                      id="business-gcmc"
                      onCheckedChange={(checked) =>
                        field.handleChange(
                          toggleBusinessInArray(
                            field.state.value,
                            "GCMC",
                            Boolean(checked)
                          )
                        )
                      }
                    />
                    <label
                      className="cursor-pointer font-medium text-emerald-600"
                      htmlFor="business-gcmc"
                    >
                      GCMC
                    </label>
                  </div>
                  <div className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={field.state.value.includes("KAJ")}
                      id="business-kaj"
                      onCheckedChange={(checked) =>
                        field.handleChange(
                          toggleBusinessInArray(
                            field.state.value,
                            "KAJ",
                            Boolean(checked)
                          )
                        )
                      }
                    />
                    <label
                      className="cursor-pointer font-medium text-blue-600"
                      htmlFor="business-kaj"
                    >
                      KAJ
                    </label>
                  </div>
                </div>
              )}
            </form.Field>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Notes</h3>
            <form.Field name="notes">
              {(field) => (
                <Textarea
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Any additional notes about this client..."
                  rows={3}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </div>
        </form>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            disabled={updateMutation.isPending}
            onClick={() => form.handleSubmit()}
            type="submit"
          >
            {updateMutation.isPending ? (
              <svg
                aria-label="Loading"
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                role="img"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Loading</title>
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
