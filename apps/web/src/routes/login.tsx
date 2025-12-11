import { createFileRoute } from "@tanstack/react-router";
import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  // Only sign-in is allowed - staff accounts are created by admins
  return <SignInForm />;
}
