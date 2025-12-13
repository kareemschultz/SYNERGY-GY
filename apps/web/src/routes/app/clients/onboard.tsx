import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  useWizard,
  WizardContainer,
  WizardSuccess,
} from "@/components/wizards";
import {
  type ClientOnboardingData,
  getDisplayName,
  initialOnboardingData,
  onboardingSteps,
  StepAmlCompliance,
  StepBasicInfo,
  StepBeneficialOwners,
  StepClientType,
  StepContact,
  StepDocuments,
  StepEmployment,
  StepIdentification,
  StepReview,
  StepServicesEnhanced,
} from "@/components/wizards/client-onboarding";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/clients/onboard")({
  component: ClientOnboardingWizard,
});

async function uploadFile(documentId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/upload/${documentId}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}

function ClientOnboardingWizard() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (data: ClientOnboardingData) => {
      // Map wizard data to API format
      const displayName = getDisplayName(data);
      const isIndividual =
        data.clientType === "INDIVIDUAL" ||
        data.clientType === "FOREIGN_NATIONAL";

      // Ensure clientType is not empty (validation should catch this, but TypeScript needs the check)
      if (!data.clientType) {
        throw new Error("Client type is required");
      }

      // 1. Create client
      const newClient = await client.clients.create({
        type: data.clientType,
        displayName: displayName || data.businessName || "Unknown Client",
        firstName: isIndividual ? data.firstName : undefined,
        lastName: isIndividual ? data.lastName : undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        nationality: data.nationality || undefined,
        businessName: isIndividual ? undefined : data.businessName,
        registrationNumber: isIndividual ? undefined : data.registrationNumber,
        incorporationDate: data.incorporationDate || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        alternatePhone: data.alternatePhone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        tinNumber: data.tinNumber || undefined,
        nationalId: data.nationalId || undefined,
        passportNumber: data.passportNumber || undefined,
        businesses: data.businesses,
        notes: data.notes || undefined,
        status: "ACTIVE",
      });

      // 2. Save service selections
      // Note: Currently using old gcmcServices/kajServices format as the service catalog UI migration is incomplete
      // When service catalog UI is complete, this should use selectedServiceIds only
      if (
        data.selectedServiceIds.length > 0 ||
        data.gcmcServices.length > 0 ||
        data.kajServices.length > 0
      ) {
        // If we have selectedServiceIds (new format), use them
        if (data.selectedServiceIds.length > 0) {
          await client.clientServices.saveSelections({
            clientId: newClient.id,
            serviceIds: data.selectedServiceIds,
          });
        }
        // Otherwise, fall back to old format (temporary until service catalog UI is complete)
        // This requires a different API endpoint that accepts category codes
        // For now, we'll skip this to avoid errors - the service catalog migration needs to be completed
      }

      // 3. Upload documents and link to services
      if (data.documents?.uploads && data.documents.uploads.length > 0) {
        for (const upload of data.documents.uploads) {
          // a. Prepare upload
          const doc = await client.documents.prepareUpload({
            category: upload.category,
            description: upload.description,
            clientId: newClient.id,
          });

          // b. Upload file
          await uploadFile(doc.documentId, upload.file);

          // c. Link to service if specified
          if (upload.linkedService && upload.linkedRequirement) {
            // Find selection ID - we need to fetch selections first
            // But since we just saved them, we can try to find them or just skip this optimization for now
            // Or better, fetch the selections for the client to get their IDs
            const selections = await client.clientServices.getByClient({
              clientId: newClient.id,
            });
            const selection = selections.find(
              (s) =>
                s.serviceCode === upload.linkedService ||
                s.serviceName === upload.linkedService
            );

            if (selection) {
              await client.clientServices.linkDocument({
                selectionId: selection.id,
                documentId: doc.documentId,
                requirementName: upload.linkedRequirement,
              });
            }
          }
        }
      }

      return newClient;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully!");
      // Navigate after a short delay to show success state
      setTimeout(() => {
        navigate({
          to: "/app/clients/$client-id",
          params: { "client-id": newClient.id },
        });
      }, 1500);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || "Failed to create client");
    },
  });

  const wizard = useWizard({
    steps: onboardingSteps,
    initialData: initialOnboardingData,
    storageKey: "client-onboarding",
    onComplete: async (data) => {
      await createMutation.mutateAsync(data);
    },
  });

  // Render success state
  if (wizard.isComplete) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Clients", href: "/app/clients" },
            { label: "New Client" },
          ]}
          title="Client Created"
        />
        <div className="p-6">
          <div className="mx-auto max-w-2xl">
            <WizardSuccess
              description="The client has been added to your database. You can now create matters, upload documents, and manage their services."
              title="Client Created Successfully!"
            >
              <div className="flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/app/clients">View All Clients</Link>
                </Button>
                <Button asChild>
                  <Link to="/app/clients/onboard">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Another Client
                  </Link>
                </Button>
              </div>
            </WizardSuccess>
          </div>
        </div>
      </div>
    );
  }

  // Map steps for progress display
  const progressSteps = onboardingSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    isOptional: step.isOptional,
    isComplete: wizard.visitedSteps.has(index) && index < wizard.currentStep,
  }));

  // Render current step content
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 0:
        return (
          <StepClientType
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 1:
        return (
          <StepBasicInfo
            data={wizard.data}
            errors={wizard.errors}
            onFieldBlur={wizard.validateField}
            onUpdate={wizard.updateData}
          />
        );
      case 2:
        return (
          <StepContact
            data={wizard.data}
            errors={wizard.errors}
            onFieldBlur={wizard.validateField}
            onUpdate={wizard.updateData}
          />
        );
      case 3:
        return (
          <StepIdentification
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 4:
        return (
          <StepEmployment
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 5:
        return (
          <StepBeneficialOwners
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 6:
        return (
          <StepAmlCompliance
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 7:
        return (
          <StepServicesEnhanced
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 8:
        return (
          <StepDocuments
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 9:
        return (
          <StepReview
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link to="/app/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients", href: "/app/clients" },
          { label: "New Client (Wizard)" },
        ]}
        description="Step-by-step guided client onboarding"
        title="New Client"
      />

      <div className="flex-1 overflow-hidden p-6">
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          <WizardContainer
            canGoNext={wizard.canGoNext}
            canGoPrev={wizard.canGoPrev}
            canSkip={wizard.canSkip}
            className="flex-1 overflow-hidden"
            currentStep={wizard.currentStep}
            errors={wizard.errors}
            fieldLabels={{
              clientType: "Client Type",
              firstName: "First Name",
              lastName: "Last Name",
              businessName: "Business Name",
              email: "Email Address",
              phone: "Phone Number",
              passportCountry: "Passport Country",
            }}
            isFirstStep={wizard.isFirstStep}
            isLastStep={wizard.isLastStep}
            isSubmitting={wizard.isSubmitting || createMutation.isPending}
            onNext={wizard.goNext}
            onPrev={wizard.goPrev}
            onSkip={wizard.skipStep}
            onStepClick={wizard.goToStep}
            onSubmit={wizard.submit}
            progress={wizard.progress}
            progressVariant="both"
            steps={progressSteps}
            submitLabel="Create Client"
            totalSteps={wizard.totalSteps}
            visitedSteps={wizard.visitedSteps}
          >
            {renderStepContent()}
          </WizardContainer>

          {/* Show submission error */}
          {wizard.errors.submit && (
            <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error creating client</p>
              <p className="text-sm">{wizard.errors.submit}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
