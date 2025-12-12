import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  LogOut,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
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

export const Route = createFileRoute("/portal/profile")({
  component: PortalProfile,
});

type ProfileData = {
  id: string;
  displayName: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  businessName: string | null;
  registrationNumber: string | null;
  incorporationDate: Date | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tinNumber: string | null;
  nationalId: string | null;
  passportNumber: string | null;
  createdAt: Date;
  summary: {
    totalMatters: number;
    activeMatters: number;
    completedMatters: number;
    totalDocuments: number;
  };
};

const clientTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individual",
  SMALL_BUSINESS: "Small Business",
  CORPORATION: "Corporation",
  NGO: "NGO",
  COOP: "Cooperative",
  CREDIT_UNION: "Credit Union",
  FOREIGN_NATIONAL: "Foreign National",
  INVESTOR: "Investor",
};

function formatDate(date: Date | string | null): string {
  if (!date) {
    return "-";
  }
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Profile page displays many conditional fields
function PortalProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const sessionToken = localStorage.getItem("portal-session");

      if (!sessionToken) {
        await navigate({ to: "/portal/login" });
        return;
      }

      try {
        const profileData = await api.portal.profile();
        setProfile(profileData as ProfileData);
      } catch (_err) {
        setError("Failed to load profile. Please try logging in again.");
        localStorage.removeItem("portal-session");
        localStorage.removeItem("portal-user");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load profile"}
          </AlertDescription>
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
            <div className="flex items-center gap-4">
              <Button asChild size="sm" variant="ghost">
                <Link to="/portal">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="font-bold text-slate-900 text-xl dark:text-white">
                  My Profile
                </h1>
              </div>
            </div>
            <Button onClick={handleLogout} size="sm" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {profile.displayName}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">
                      {clientTypeLabels[profile.type] || profile.type}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      Client since {formatDate(profile.createdAt)}
                    </span>
                  </CardDescription>
                </div>
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Active Matters
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {profile.summary.activeMatters}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">Completed</CardTitle>
                <Calendar className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {profile.summary.completedMatters}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Matters
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {profile.summary.totalMatters}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-sm">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {profile.summary.totalDocuments}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.email ? (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                ) : null}
                {profile.phone ? (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                ) : null}
                {profile.alternatePhone ? (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.alternatePhone} (Alternate)</span>
                  </div>
                ) : null}
                {profile.address ? (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile.address}
                      {profile.city ? `, ${profile.city}` : ""}
                      {profile.country ? `, ${profile.country}` : ""}
                    </span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.tinNumber ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TIN Number</span>
                    <span className="font-mono">{profile.tinNumber}</span>
                  </div>
                ) : null}
                {profile.nationalId ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">National ID</span>
                    <span className="font-mono">{profile.nationalId}</span>
                  </div>
                ) : null}
                {profile.passportNumber ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passport</span>
                    <span className="font-mono">{profile.passportNumber}</span>
                  </div>
                ) : null}
                {profile.dateOfBirth ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span>{formatDate(profile.dateOfBirth)}</span>
                  </div>
                ) : null}
                {profile.nationality ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nationality</span>
                    <span>{profile.nationality}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Business Info (for companies) */}
            {profile.type !== "INDIVIDUAL" &&
            profile.type !== "FOREIGN_NATIONAL" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.businessName ? (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.businessName}</span>
                    </div>
                  ) : null}
                  {profile.registrationNumber ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Registration #
                      </span>
                      <span className="font-mono">
                        {profile.registrationNumber}
                      </span>
                    </div>
                  ) : null}
                  {profile.incorporationDate ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Incorporated
                      </span>
                      <span>{formatDate(profile.incorporationDate)}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
