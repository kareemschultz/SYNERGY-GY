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
    onSubmit: async ({ value }) => {
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
  }, [open, clientData]);

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
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Display Name *</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="How this client should be displayed"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            {/* Individual fields */}
            {!!isIndividual && (
              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="firstName">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>First Name</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Last Name</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="dateOfBirth">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Date of Birth</Label>
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
            )}

            {/* Business/Organization fields */}
            {!isIndividual && (
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="businessName">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Business Name</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="registrationNumber">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Registration Number</Label>
                      <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="incorporationDate">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Incorporation Date</Label>
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
            )}

            <form.Field name="nationality">
              {(field) => (
                <div className="space-y-2 md:w-1/2">
                  <Label htmlFor={field.name}>Nationality</Label>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    value={field.state.value}
                  />
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
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="email"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="phone">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Phone</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="alternatePhone">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Alternate Phone</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
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
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>City</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="country">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Country</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Identification</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <form.Field name="tinNumber">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>TIN Number</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="nationalId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>National ID</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="passportNumber">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Passport Number</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    />
                  </div>
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
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={field.state.value.includes("GCMC")}
                      onCheckedChange={(checked) => {
                        const current = field.state.value;
                        if (checked) {
                          field.handleChange([...current, "GCMC"]);
                        } else {
                          field.handleChange(
                            current.filter((b) => b !== "GCMC")
                          );
                        }
                      }}
                    />
                    <span className="font-medium text-emerald-600">GCMC</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={field.state.value.includes("KAJ")}
                      onCheckedChange={(checked) => {
                        const current = field.state.value;
                        if (checked) {
                          field.handleChange([...current, "KAJ"]);
                        } else {
                          field.handleChange(
                            current.filter((b) => b !== "KAJ")
                          );
                        }
                      }}
                    />
                    <span className="font-medium text-blue-600">KAJ</span>
                  </label>
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
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
