import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DocumentUploadWizard } from "@/components/documents/document-upload-wizard";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/documents/upload")({
  component: UploadDocumentPage,
});

function UploadDocumentPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link to="/app/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Documents", href: "/app/documents" },
          { label: "Upload" },
        ]}
        description="Upload and organize documents for clients and matters"
        title="Upload Documents"
      />

      <div className="p-6">
        <DocumentUploadWizard
          onCancel={() => navigate({ to: "/app/documents" })}
          onComplete={() => navigate({ to: "/app/documents" })}
        />
      </div>
    </div>
  );
}
