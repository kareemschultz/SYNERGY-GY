import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Edit, Loader2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { type ControllerRenderProps, useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/staff/$staff-id")({
  component: StaffDetailPage,
  validateSearch: z.object({
    edit: z.boolean().optional(),
  }),
});

const updateStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum([
    "OWNER",
    "GCMC_MANAGER",
    "KAJ_MANAGER",
    "STAFF_GCMC",
    "STAFF_KAJ",
    "STAFF_BOTH",
    "RECEPTIONIST",
  ]),
  businesses: z
    .array(z.enum(["GCMC", "KAJ"]))
    .min(1, "Select at least one business"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  canViewFinancials: z.boolean().optional(),
});

type UpdateStaffFormValues = z.infer<typeof updateStaffSchema>;

const roleDescriptions: Record<
  string,
  { label: string; description: string; requiredBusiness?: string }
> = {
  OWNER: {
    label: "Owner",
    description:
      "Full access to both businesses with all administrative privileges",
    requiredBusiness: "BOTH",
  },
  GCMC_MANAGER: {
    label: "GCMC Manager",
    description: "Administrative access to GCMC business operations",
    requiredBusiness: "GCMC",
  },
  KAJ_MANAGER: {
    label: "KAJ Manager",
    description: "Administrative access to KAJ business operations",
    requiredBusiness: "KAJ",
  },
  STAFF_GCMC: {
    label: "GCMC Staff",
    description: "Staff access to GCMC business only",
    requiredBusiness: "GCMC",
  },
  STAFF_KAJ: {
    label: "KAJ Staff",
    description: "Staff access to KAJ business only",
    requiredBusiness: "KAJ",
  },
  STAFF_BOTH: {
    label: "Staff (Both)",
    description: "Staff access to both GCMC and KAJ businesses",
    requiredBusiness: "BOTH",
  },
  RECEPTIONIST: {
    label: "Receptionist",
    description: "Reception and administrative support role",
  },
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
function StaffDetailPage() {
  const { "staff-id": staffId } = Route.useParams();
  const { edit } = Route.useSearch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(edit);

  const {
    data: staff,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "staff", staffId],
    queryFn: () => client.admin.staff.getById({ id: staffId }),
  });

  const form = useForm<UpdateStaffFormValues>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined,
      businesses: [],
      phone: "",
      jobTitle: "",
      canViewFinancials: false,
    },
  });

  const selectedRole = form.watch("role");

  // Auto-select businesses based on role
  const handleRoleChange = (role: UpdateStaffFormValues["role"]) => {
    const roleInfo = roleDescriptions[role];
    if (roleInfo.requiredBusiness === "BOTH") {
      form.setValue("businesses", ["GCMC", "KAJ"]);
    } else if (roleInfo.requiredBusiness === "GCMC") {
      form.setValue("businesses", ["GCMC"]);
    } else if (roleInfo.requiredBusiness === "KAJ") {
      form.setValue("businesses", ["KAJ"]);
    }
  };

  // Update form when data loads
  useEffect(() => {
    if (staff) {
      form.reset({
        name: staff.user.name,
        email: staff.user.email,
        role: staff.role as UpdateStaffFormValues["role"],
        businesses: staff.businesses as ("GCMC" | "KAJ")[],
        phone: staff.phone || "",
        jobTitle: staff.jobTitle || "",
        canViewFinancials: staff.canViewFinancials ?? false,
      });
    }
  }, [staff, form]);

  const updateMutation = useMutation({
    mutationFn: (values: UpdateStaffFormValues) =>
      client.admin.staff.update({
        id: staffId,
        ...values,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast({
        title: "Staff updated successfully",
        description: "Changes have been saved.",
      });
      setIsEditing(false);
      navigate({ to: "/app/admin/staff/$staffId", params: { staffId } });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Failed to update staff",
        description:
          err instanceof Error
            ? err.message
            : "An error occurred. Please try again.",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      client.admin.staff.toggleActive({ id: staffId, isActive }),
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast({
        title: isActive ? "Staff activated" : "Staff deactivated",
        description: `Staff member has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to update staff status. Please try again.",
      });
    },
  });

  const onSubmit = (values: UpdateStaffFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading staff details...
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Failed to load staff details</p>
            <p className="text-sm">
              {error instanceof Error
                ? error.message
                : "Staff member not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            {isEditing ? null : (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  disabled={toggleActiveMutation.isPending}
                  onClick={() => toggleActiveMutation.mutate(!staff.isActive)}
                  variant={staff.isActive ? "outline" : "default"}
                >
                  {toggleActiveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {staff.isActive ? "Deactivating..." : "Activating..."}
                    </>
                    // biome-ignore lint/style/noNestedTernary: Auto-fix
                  ) : staff.isActive ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    "Activate"
                  )}
                </Button>
              </>
            )}
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Staff", href: "/app/admin/staff" },
          { label: staff.user.name },
        ]}
        description={staff.user.email}
        title={staff.user.name}
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Status Badge */}
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-muted-foreground text-sm">Account Status</p>
                <p className="mt-1 font-medium">
                  {staff.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <Badge
                className={
                  staff.isActive
                    ? "border-green-200 bg-green-500/10 text-green-600"
                    : "border-gray-200 bg-gray-500/10 text-gray-600"
                }
                variant="outline"
              >
                {staff.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>

          {/* Staff Details */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Staff Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">
                        Personal Information
                      </h3>

                      <FormField
                        control={form.control}
                        name="name"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            UpdateStaffFormValues,
                            "name"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            UpdateStaffFormValues,
                            "email"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            UpdateStaffFormValues,
                            "phone"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            UpdateStaffFormValues,
                            "jobTitle"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Role & Permissions */}
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="font-medium text-sm">
                        Role & Permissions
                      </h3>

                      <FormField
                        control={form.control}
                        name="role"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            UpdateStaffFormValues,
                            "role"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Role *</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleRoleChange(
                                  value as UpdateStaffFormValues["role"]
                                );
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(roleDescriptions).map(
                                  ([value, info]) => (
                                    <SelectItem key={value} value={value}>
                                      {info.label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            {!!selectedRole && (
                              <FormDescription>
                                {roleDescriptions[selectedRole].description}
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businesses"
                        render={() => (
                          <FormItem>
                            <FormLabel>Business Access *</FormLabel>
                            <div className="space-y-2">
                              <FormField
                                control={form.control}
                                name="businesses"
                                render={({
                                  field,
                                }: {
                                  field: ControllerRenderProps<
                                    UpdateStaffFormValues,
                                    "businesses"
                                  >;
                                }) => (
                                  <FormItem className="flex items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes("GCMC")}
                                        disabled={
                                          // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                                          selectedRole &&
                                          roleDescriptions[selectedRole]
                                            .requiredBusiness === "BOTH"
                                        }
                                        onCheckedChange={(checked) => {
                                          const value = field.value || [];
                                          if (checked) {
                                            field.onChange([...value, "GCMC"]);
                                          } else {
                                            field.onChange(
                                              value.filter(
                                                (v: "GCMC" | "KAJ") =>
                                                  v !== "GCMC"
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-normal">
                                        GCMC - Guyana Caribbean Management
                                        Consultancy
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="businesses"
                                render={({
                                  field,
                                }: {
                                  field: ControllerRenderProps<
                                    UpdateStaffFormValues,
                                    "businesses"
                                  >;
                                }) => (
                                  <FormItem className="flex items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes("KAJ")}
                                        disabled={
                                          // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                                          selectedRole &&
                                          roleDescriptions[selectedRole]
                                            .requiredBusiness === "BOTH"
                                        }
                                        onCheckedChange={(checked) => {
                                          const value = field.value || [];
                                          if (checked) {
                                            field.onChange([...value, "KAJ"]);
                                          } else {
                                            field.onChange(
                                              value.filter(
                                                (v: "GCMC" | "KAJ") =>
                                                  v !== "KAJ"
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-normal">
                                        KAJ - Kamal A. Joseph & Associates
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Financial Access Permission */}
                      <FormField
                        control={form.control}
                        name="canViewFinancials"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            UpdateStaffFormValues,
                            "canViewFinancials"
                          >;
                        }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Can View Financial Data</FormLabel>
                              <FormDescription>
                                Allow this staff member to view invoices,
                                payments, and financial reports. Managers and
                                owners have access by default.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 border-t pt-6">
                      <Button
                        className="flex-1"
                        disabled={updateMutation.isPending}
                        type="submit"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          form.reset();
                        }}
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* View Mode - Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Full Name" value={staff.user.name} />
                  <InfoRow label="Email" value={staff.user.email} />
                  <InfoRow label="Phone" value={staff.phone || "-"} />
                  <InfoRow label="Job Title" value={staff.jobTitle || "-"} />
                </CardContent>
              </Card>

              {/* View Mode - Role & Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Role & Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Role</p>
                    <div className="mt-1">
                      <RoleBadge role={staff.role} />
                    </div>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {roleDescriptions[staff.role]?.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Business Access
                    </p>
                    <div className="mt-1 flex gap-2">
                      <BusinessBadges businesses={staff.businesses} />
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Financial Data Access
                    </p>
                    <div className="mt-1">
                      <Badge
                        className={
                          staff.canViewFinancials
                            ? "border-green-200 bg-green-500/10 text-green-600"
                            : "border-gray-200 bg-gray-500/10 text-gray-600"
                        }
                        variant="outline"
                      >
                        {staff.canViewFinancials ? "Can View" : "No Access"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {staff.canViewFinancials
                        ? "This user can view invoices, payments, and financial reports"
                        : "This user cannot access financial data"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* View Mode - System Information */}
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow
                    label="Account Created"
                    value={new Date(staff.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  />
                  <InfoRow
                    label="Last Updated"
                    value={new Date(staff.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  />
                  <InfoRow label="User ID" value={staff.userId} />
                  <InfoRow label="Staff ID" value={staff.id} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"].includes(role);

  return (
    <Badge
      className={
        isAdmin
          ? "border-purple-200 bg-purple-500/10 text-purple-600"
          : "border-blue-200 bg-blue-500/10 text-blue-600"
      }
      variant="outline"
    >
      {roleDescriptions[role]?.label || role}
    </Badge>
  );
}

function BusinessBadges({ businesses }: { businesses: string[] }) {
  return (
    <>
      {businesses.includes("GCMC") && (
        <Badge className="bg-emerald-500/10 text-emerald-600" variant="outline">
          GCMC
        </Badge>
      )}
      {businesses.includes("KAJ") && (
        <Badge className="bg-blue-500/10 text-blue-600" variant="outline">
          KAJ
        </Badge>
      )}
    </>
  );
}
