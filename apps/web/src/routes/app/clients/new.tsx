import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/app/clients/new")({
  component: NewClientPage,
});

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

type FormValues = {
  type: ClientType;
  displayName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  businessName: string;
  registrationNumber: string;
  incorporationDate: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  country: string;
  tinNumber: string;
  nationalId: string;
  passportNumber: string;
  businesses: ("GCMC" | "KAJ")[];
  notes: string;
};

function NewClientPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      client.clients.create({
        ...values,
        status: "ACTIVE",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully");
      navigate({ to: "/app/clients/$clientId", params: { clientId: data.id } });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create client");
    },
  });

  const form = useForm({
    defaultValues: {
      type: "INDIVIDUAL" as ClientType,
      displayName: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "Guyanese",
      businessName: "",
      registrationNumber: "",
      incorporationDate: "",
      email: "",
      phone: "",
      alternatePhone: "",
      address: "",
      city: "",
      country: "Guyana",
      tinNumber: "",
      nationalId: "",
      passportNumber: "",
      businesses: [] as ("GCMC" | "KAJ")[],
      notes: "",
    } satisfies FormValues,
    onSubmit: async ({ value }) => {
      // Validate required fields
      const errors: string[] = [];

      if (!value.displayName.trim()) {
        errors.push("Display Name is required");
      }
      if (value.businesses.length === 0) {
        errors.push("Please select at least one business (GCMC or KAJ)");
      }

      if (errors.length > 0) {
        toast.error(
          <div className="space-y-1">
            <p className="font-medium">Please fix the following:</p>
            <ul className="list-disc pl-4 text-sm">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        );
        return;
      }

      createMutation.mutate(value);
    },
  });

  // Helper to check if form has validation issues
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!form.state.values.displayName.trim()) {
      errors.push("Display Name is required");
    }
    if (form.state.values.businesses.length === 0) {
      errors.push("Select at least one business");
    }
    return errors;
  };

  const validationErrors = getValidationErrors();
  const hasErrors = validationErrors.length > 0;

  const isIndividual =
    form.state.values.type === "INDIVIDUAL" ||
    form.state.values.type === "FOREIGN_NATIONAL";

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/app/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            {hasErrors && (
              <span className="hidden items-center gap-1 text-amber-600 text-sm sm:flex">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.length} field
                {validationErrors.length > 1 ? "s" : ""} need attention
              </span>
            )}
            <Button
              disabled={createMutation.isPending}
              onClick={() => form.handleSubmit()}
              title={hasErrors ? validationErrors.join(", ") : undefined}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Client
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients", href: "/app/clients" },
          { label: "New Client" },
        ]}
        description="Add a new client to your database"
        title="New Client"
      />

      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  {(field) => {
                    const showError =
                      field.state.meta.isTouched && !field.state.value.trim();
                    return (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Display Name *</Label>
                        <Input
                          aria-describedby={
                            showError ? `${field.name}-error` : undefined
                          }
                          aria-invalid={showError}
                          className={
                            showError ? "border-destructive" : undefined
                          }
                          id={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="How this client should be displayed"
                          value={field.state.value}
                        />
                        {showError && (
                          <p
                            className="text-destructive text-sm"
                            id={`${field.name}-error`}
                            role="alert"
                          >
                            Display Name is required
                          </p>
                        )}
                      </div>
                    );
                  }}
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
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle>Identification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Business Assignment */}
          <Card
            className={
              form.state.values.businesses.length === 0
                ? "border-amber-200 dark:border-amber-800"
                : undefined
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Business Assignment *
                {form.state.values.businesses.length === 0 && (
                  <span className="flex items-center gap-1 font-normal text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Required
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field name="businesses">
                {(field) => (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      Select which business(es) this client belongs to
                    </p>
                    <div className="flex gap-6">
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: Auto-fix */}
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
                        <span className="font-medium text-emerald-600">
                          GCMC
                        </span>
                        <span className="text-muted-foreground text-sm">
                          (Training, Consulting, Paralegal, Immigration)
                        </span>
                      </label>
                      {/* biome-ignore lint/a11y/noLabelWithoutControl: Auto-fix */}
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
                        <span className="text-muted-foreground text-sm">
                          (Tax, Accounting, Financial Services)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field name="notes">
                {(field) => (
                  <Textarea
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Any additional notes about this client..."
                    rows={4}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Bottom Actions - Duplicated for easy access */}
          <div className="flex justify-end gap-2 pb-6">
            <Button asChild variant="outline">
              <Link to="/app/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => form.handleSubmit()}
              type="submit"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Client
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
