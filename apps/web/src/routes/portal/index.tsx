import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, FileText, FolderOpen, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { client as api } from "@/utils/orpc";

export const Route = createFileRoute("/portal/")({
  component: PortalDashboard,
});

type Matter = {
  id: string;
  referenceNumber: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
};

type PortalUser = {
  id: string;
  email: string;
  clientId: string;
};

function PortalDashboard() {
  const navigate = useNavigate();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const sessionToken = localStorage.getItem("portal-session");
      const storedUser = localStorage.getItem("portal-user");

      if (!(sessionToken && storedUser)) {
        await navigate({ to: "/portal/login" });
        return;
      }

      try {
        setUser(JSON.parse(storedUser));

        // Load user info and matters
        const [meData, mattersData] = await Promise.all([
          api.portal.me(),
          api.portal.matters.list({ page: 1, limit: 10 }),
        ]);

        setClientName(meData.client?.displayName || "Client");
        setMatters(mattersData.matters);
      } catch (_err) {
        setError("Failed to load dashboard. Please try logging in again.");
        localStorage.removeItem("portal-session");
        localStorage.removeItem("portal-user");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.portal.auth.logout();
    } catch (_err) {
      // Ignore error, logout locally anyway
    } finally {
      localStorage.removeItem("portal-session");
      localStorage.removeItem("portal-user");
      await navigate({ to: "/portal/login" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "COMPLETED":
        return "bg-green-500";
      case "ON_HOLD":
        return "bg-yellow-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-slate-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl text-slate-900 dark:text-white">
                Client Portal
              </h1>
              <p className="text-slate-600 text-sm dark:text-slate-400">
                Welcome, {clientName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button onClick={handleLogout} size="sm" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Navigation */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/portal/profile">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  My Profile
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  View your account details
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Active Matters
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{matters.length}</div>
              <p className="text-muted-foreground text-xs">
                Your current cases
              </p>
            </CardContent>
          </Card>

          <Link to="/portal/financials">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Financials
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  View invoices and payments
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/portal/appointments">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Appointments
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  View scheduled meetings
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Matters List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Matters</CardTitle>
            <CardDescription>
              View the status and details of your cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matters.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FolderOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No matters found</p>
                <p className="mt-2 text-sm">
                  Your case information will appear here once it's available
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matters.map((matter) => (
                  <Link
                    className="block"
                    key={matter.id}
                    params={{ matterId: matter.id }}
                    to="/portal/matters/$matterId"
                  >
                    <div className="rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-medium font-mono text-sm">
                              {matter.referenceNumber}
                            </span>
                            <Badge
                              className={getPriorityColor(matter.priority)}
                            >
                              {matter.priority}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-sm dark:text-slate-400">
                            {matter.description}
                          </p>
                          <p className="mt-2 text-muted-foreground text-xs">
                            Created:{" "}
                            {new Date(matter.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <div
                            className={`h-2 w-2 rounded-full ${getStatusColor(matter.status)}`}
                            title={matter.status}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
