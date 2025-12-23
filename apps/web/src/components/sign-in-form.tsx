import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calculator,
  FileText,
  Globe,
  GraduationCap,
  Loader2,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Service tags for GCMC
const GCMC_SERVICES = [
  { label: "HR Management", icon: Users },
  { label: "Immigration", icon: Globe },
  { label: "Work Permits", icon: FileText },
  { label: "Business Visas", icon: Briefcase },
  { label: "Training", icon: GraduationCap },
  { label: "Paralegal", icon: Scale },
] as const;

// Service tags for KAJ
const KAJ_SERVICES = [
  { label: "Tax Returns", icon: Calculator },
  { label: "PAYE", icon: FileText },
  { label: "NIS Services", icon: Shield },
  { label: "Audits", icon: BadgeCheck },
  { label: "Compliance", icon: Scale },
] as const;

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
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-10 lg:flex lg:w-1/2">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2MmgxMnptLTEyIDh2LTJoMTJ2MkgyNHptMTItMTB2LTJIMjR2MmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-white tracking-tight">
                GK-Nexus
              </h1>
              <p className="font-medium text-blue-300 text-sm">
                Business Management System
              </p>
            </div>
          </div>
        </div>

        {/* Company Cards */}
        <div className="relative z-10 space-y-5">
          {/* GCMC Card */}
          <div className="group rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:shadow-lg">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <Globe className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Green Crescent Management
                </h3>
                <p className="text-emerald-300/80 text-xs">
                  Consulting & Immigration Services
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {GCMC_SERVICES.map((service) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-200 text-xs transition-colors hover:bg-emerald-500/20"
                  key={service.label}
                >
                  <service.icon className="h-3 w-3" />
                  {service.label}
                </span>
              ))}
            </div>
          </div>

          {/* KAJ Card */}
          <div className="group rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:shadow-amber-500/10 hover:shadow-lg">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Calculator className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  KAJ Financial Services
                </h3>
                <p className="text-amber-300/80 text-xs">
                  GRA Licensed Accountancy
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {KAJ_SERVICES.map((service) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-200 text-xs transition-colors hover:bg-amber-500/20"
                  key={service.label}
                >
                  <service.icon className="h-3 w-3" />
                  {service.label}
                </span>
              ))}
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5">
              <Shield className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-white text-xs">
                GRA Compliant
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5">
              <BadgeCheck className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white text-xs">
                NIS Registered
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5">
              <Globe className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-white text-xs">
                Immigration
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/50 text-xs">
          © {new Date().getFullYear()} Green Crescent Management Consultancy &
          KAJ Financial Services
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
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
