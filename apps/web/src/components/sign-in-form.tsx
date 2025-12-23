import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm() {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/app",
            });
            toast.success("Welcome back!");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 lg:flex lg:w-1/2">
        <div>
          <div className="flex items-center gap-3 text-white">
            <Building2 className="h-10 w-10" />
            <div>
              <h1 className="font-bold text-2xl">GK-Nexus</h1>
              <p className="text-blue-200 text-sm">
                Business Management System
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Cards */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-1 font-semibold text-white">
                GREEN CRESCENT MANAGEMENT CONSULTANCY
              </h3>
              <p className="mb-2 text-blue-200 text-xs uppercase tracking-wide">
                Trainings | Consulting | Immigration | Paralegal | Business
                Proposals | Networking
              </p>
              <p className="text-blue-100 text-sm">
                HR Management, Customer Relations, Co-operatives Training,
                Company Incorporation, Work Permits, Citizenship, Business
                Visas, and Professional Networking.
              </p>
            </div>

            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-1 font-semibold text-white">
                KAJ FINANCIAL SERVICES
              </h3>
              <p className="mb-2 text-blue-200 text-xs uppercase tracking-wide">
                GRA Licence to Practice as an Accountant
              </p>
              <p className="text-blue-100 text-sm">
                Income Tax Returns, All Compliances, PAYE Returns,
                Income/Expenditure Statements, NGO & Co-operative Audits,
                National Insurance Scheme Services.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-white/80">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-xs">GRA Compliant</span>
            </div>
            <div className="h-3 w-px bg-white/30" />
            <span className="text-xs">NIS Registered</span>
            <div className="h-3 w-px bg-white/30" />
            <span className="text-xs">Immigration Services</span>
          </div>
        </div>

        <div className="text-white/60 text-xs">
          © {new Date().getFullYear()} Green Crescent Management Consultancy &
          KAJ Financial Services
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Building2 className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="font-bold text-2xl">GK-Nexus</h1>
              <p className="text-muted-foreground text-sm">
                Business Management
              </p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-bold text-3xl tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email address</Label>
                  <Input
                    autoComplete="email"
                    className="h-12"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    autoComplete="current-password"
                    className="h-12"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Subscribe>
              {(state) => (
                <Button
                  className="h-12 w-full bg-blue-600 text-base hover:bg-blue-700"
                  disabled={!state.canSubmit || state.isSubmitting}
                  type="submit"
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Staff accounts are created by administrators.
              <br />
              Contact your manager if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
