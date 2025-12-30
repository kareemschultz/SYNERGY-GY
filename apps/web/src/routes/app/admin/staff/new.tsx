import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { type ControllerRenderProps, useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/admin/staff/new")({
  component: NewStaffPage,
});

const createStaffSchema = z
  .object({
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
    // Account setup method (default handled in defaultValues)
    sendInviteEmail: z.boolean(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate password if local setup is chosen
    if (!data.sendInviteEmail) {
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 8 characters",
          path: ["password"],
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });
      }
    }
  });

type CreateStaffFormValues = z.infer<typeof createStaffSchema>;

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

function NewStaffPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined,
      businesses: [],
      phone: "",
      jobTitle: "",
      canViewFinancials: false,
      sendInviteEmail: true,
      password: "",
      confirmPassword: "",
    },
  });

  const sendInviteEmail = form.watch("sendInviteEmail");

  const selectedRole = form.watch("role");

  // Auto-select businesses based on role
  const handleRoleChange = (role: CreateStaffFormValues["role"]) => {
    const roleInfo = roleDescriptions[role];
    if (roleInfo.requiredBusiness === "BOTH") {
      form.setValue("businesses", ["GCMC", "KAJ"]);
    } else if (roleInfo.requiredBusiness === "GCMC") {
      form.setValue("businesses", ["GCMC"]);
    } else if (roleInfo.requiredBusiness === "KAJ") {
      form.setValue("businesses", ["KAJ"]);
    }
  };

  const createMutation = useMutation({
    mutationFn: (values: CreateStaffFormValues) => {
      const { confirmPassword: _confirmPassword, ...data } = values;
      return client.admin.staff.create(data);
    },
    onSuccess: (data) => {
      const isEmailInvite = data.setupMethod === "email";
      toast({
        title: "Staff created successfully",
        description: isEmailInvite
          ? `Setup email sent to ${data.user.email}. They can set their password using the link.`
          : `${data.user.name} can now log in with the password you set.`,
      });
      navigate({ to: "/app/admin/staff" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create staff",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
      });
    },
  });

  const onSubmit = (values: CreateStaffFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Admin", href: "/app/admin" },
          { label: "Staff", href: "/app/admin/staff" },
          { label: "New" },
        ]}
        description="Add a new staff member to the system"
        title="Add Staff Member"
      />

      <div className="p-6">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Staff Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Personal Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<
                        CreateStaffFormValues,
                        "name"
                      >;
                    }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        CreateStaffFormValues,
                        "email"
                      >;
                    }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used for login and system notifications
                        </FormDescription>
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
                        CreateStaffFormValues,
                        "phone"
                      >;
                    }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+592 123-4567" {...field} />
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
                        CreateStaffFormValues,
                        "jobTitle"
                      >;
                    }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Senior Accountant" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Role & Permissions */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-medium text-sm">Role & Permissions</h3>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<
                        CreateStaffFormValues,
                        "role"
                      >;
                    }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleRoleChange(
                              value as CreateStaffFormValues["role"]
                            );
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
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
                                CreateStaffFormValues,
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
                                            (v: "GCMC" | "KAJ") => v !== "GCMC"
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
                                CreateStaffFormValues,
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
                                            (v: "GCMC" | "KAJ") => v !== "KAJ"
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
                        CreateStaffFormValues,
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
                            Allow this staff member to view invoices, payments,
                            and financial reports.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Account Setup Method */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-medium text-sm">Account Setup</h3>

                  <FormField
                    control={form.control}
                    name="sendInviteEmail"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>
                          How should this staff member set up their account?
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            className="flex flex-col space-y-2"
                            defaultValue="true"
                            onValueChange={(value) =>
                              field.onChange(value === "true")
                            }
                            value={field.value ? "true" : "false"}
                          >
                            <div className="flex items-start space-x-3 rounded-lg border p-4">
                              <RadioGroupItem id="email-invite" value="true" />
                              <div className="space-y-1">
                                <label
                                  className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  htmlFor="email-invite"
                                >
                                  Send email invite (Recommended)
                                </label>
                                <p className="text-muted-foreground text-sm">
                                  Staff member will receive an email with a
                                  secure link to set their own password.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3 rounded-lg border p-4">
                              <RadioGroupItem
                                id="local-password"
                                value="false"
                              />
                              <div className="space-y-1">
                                <label
                                  className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  htmlFor="local-password"
                                >
                                  Set password now
                                </label>
                                <p className="text-muted-foreground text-sm">
                                  You set a temporary password for immediate
                                  access. Staff should change it on first login.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password fields - only show when local password is selected */}
                  {!sendInviteEmail && (
                    <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="text-amber-900 text-sm">
                          Set a temporary password. The staff member should
                          change it after first login.
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="password"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            CreateStaffFormValues,
                            "password"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Minimum 8 characters"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            CreateStaffFormValues,
                            "confirmPassword"
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Confirm Password *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Re-enter password"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t pt-6">
                  <Button
                    className="flex-1"
                    disabled={createMutation.isPending}
                    type="submit"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Staff Member"
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/app/admin/staff" })}
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
      </div>
    </div>
  );
}
