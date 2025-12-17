import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock,
  FileText,
  FolderOpen,
  Search,
  Shield,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Upload,
    title: "Easy Uploads",
    description:
      "Drag & drop files or use our guided wizard to upload documents quickly",
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description:
      "Documents are automatically organized by year, month, and client",
  },
  {
    icon: Search,
    title: "Powerful Search",
    description:
      "Find any document instantly with filters by category, date, and client",
  },
  {
    icon: Clock,
    title: "Expiration Tracking",
    description:
      "Get notified before important documents expire (passports, licenses)",
  },
  {
    icon: Shield,
    title: "Secure Storage",
    description: "All documents are encrypted and backed up automatically",
  },
  {
    icon: FileText,
    title: "Document Templates",
    description: "Generate professional documents from customizable templates",
  },
];

const documentTypes = [
  {
    name: "Identity Documents",
    examples: "Passport, ID Card, Driver's License",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    name: "Tax Documents",
    examples: "Tax Returns, Assessments, Receipts",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    name: "Financial Records",
    examples: "Bank Statements, Audits, Reports",
    color: "bg-green-500/10 text-green-600",
  },
  {
    name: "Legal Documents",
    examples: "Contracts, Agreements, Certificates",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    name: "Immigration Papers",
    examples: "Visas, Work Permits, Applications",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    name: "Business Documents",
    examples: "Registration, Licenses, Incorporation",
    color: "bg-indigo-500/10 text-indigo-600",
  },
];

export function DocumentsGettingStarted() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 font-bold text-2xl">
            Welcome to Document Management
          </h2>
          <p className="mb-6 text-muted-foreground">
            Securely store, organize, and manage all your client documents in
            one place. Get started by uploading your first document.
          </p>
          <Button asChild size="lg">
            <Link to="/app/documents/upload">
              <Upload className="mr-2 h-5 w-5" />
              Upload Your First Document
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">
          What You Can Do With Documents
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                className="transition-colors hover:border-primary/50"
                key={feature.title}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documentTypes.map((type) => (
              <div
                className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/50"
                key={type.name}
              >
                <div
                  className={`mb-2 inline-block rounded px-2 py-0.5 font-medium text-xs ${type.color}`}
                >
                  {type.name}
                </div>
                <p className="text-muted-foreground text-xs">{type.examples}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-muted border-l-2 pl-6">
            <li className="relative">
              <div className="-left-[27px] absolute flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                1
              </div>
              <h4 className="font-medium">Upload Documents</h4>
              <p className="text-muted-foreground text-sm">
                Click "Upload Document" and drag & drop files or browse your
                computer
              </p>
            </li>
            <li className="relative">
              <div className="-left-[27px] absolute flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                2
              </div>
              <h4 className="font-medium">Categorize & Tag</h4>
              <p className="text-muted-foreground text-sm">
                Select a category and add tags to make documents easy to find
              </p>
            </li>
            <li className="relative">
              <div className="-left-[27px] absolute flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                3
              </div>
              <h4 className="font-medium">Link to Client</h4>
              <p className="text-muted-foreground text-sm">
                Optionally link documents to a client or specific matter
              </p>
            </li>
            <li className="relative">
              <div className="-left-[27px] absolute flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                4
              </div>
              <h4 className="font-medium">Access Anytime</h4>
              <p className="text-muted-foreground text-sm">
                Search, filter, and download documents whenever you need them
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild variant="outline">
          <Link to="/app/documents/templates">
            <FileText className="mr-2 h-4 w-4" />
            Browse Templates
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/clients">
            <FolderOpen className="mr-2 h-4 w-4" />
            View Clients
          </Link>
        </Button>
      </div>
    </div>
  );
}
