import type { NotFoundRouteProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotFoundProps = {
  title?: string;
  description?: string;
  showHomeLink?: boolean;
  showBackLink?: boolean;
};

// Component accepts both custom props and TanStack Router's NotFoundRouteProps
export function NotFound(props: NotFoundProps | NotFoundRouteProps) {
  // Handle both custom props and router props
  const title = "title" in props ? props.title : "Page Not Found";
  const description =
    "description" in props
      ? props.description
      : "Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.";
  const showHomeLink = "showHomeLink" in props ? props.showHomeLink : true;
  const showBackLink = "showBackLink" in props ? props.showBackLink : true;
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">404</CardTitle>
          <p className="font-semibold text-lg">{title}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{description}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showBackLink ? (
              <Button onClick={() => window.history.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            ) : null}
            {showHomeLink ? (
              <Button asChild>
                <Link to="/app">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-sm">
              Need help?{" "}
              <a
                className="font-medium text-primary hover:underline"
                href="mailto:support@gcmc.gy"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
