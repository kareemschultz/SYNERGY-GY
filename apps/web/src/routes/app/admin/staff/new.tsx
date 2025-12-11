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
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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
      password: "",
      confirmPassword: "",
    },
  });

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
      const { confirmPassword, ...data } = values;
      return client.admin.staff.create(data);
    },
    onSuccess: (data) => {
      toast({
        title: "Staff created successfully",
        description: `${data.user.name} has been added to the system.`,
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
                        {selectedRole && (
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
                </div>

                {/* Security */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-medium text-sm">Security</h3>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <div className="text-blue-900 text-sm">
                        <p className="font-medium">Initial Password</p>
                        <p className="mt-1">
                          Set a temporary password for the staff member. They
                          should change it on first login.
                        </p>
                      </div>
                    </div>
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
                        <FormLabel>Initial Password *</FormLabel>
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
