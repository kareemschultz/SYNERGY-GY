import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  useWizard,
  WizardContainer,
  WizardSuccess,
} from "@/components/wizards";
import {
  initialMatterData,
  type MatterWizardData,
  matterWizardSteps,
  StepClient,
  StepDetails,
  StepReview,
  StepSchedule,
  StepServiceType,
} from "@/components/wizards/matter-wizard";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/matters/wizard")({
  component: MatterWizard,
});

function MatterWizard() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (data: MatterWizardData) =>
      client.matters.create({
        clientId: data.clientId,
        serviceTypeId: data.serviceTypeId,
        business: data.business as "GCMC" | "KAJ",
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        taxYear: data.taxYear || undefined,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
        estimatedFee: data.estimatedFee || undefined,
      }),
    onSuccess: (newMatter) => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      toast.success("Matter created successfully!");
      // Navigate after a short delay to show success state
      setTimeout(() => {
        navigate({
          to: "/app/matters/$matterId",
          params: { matterId: newMatter.id },
        });
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create matter");
    },
  });

  const wizard = useWizard({
    steps: matterWizardSteps,
    initialData: initialMatterData,
    storageKey: "matter-wizard",
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
            { label: "Matters", href: "/app/matters" },
            { label: "New Matter" },
          ]}
          title="Matter Created"
        />
        <div className="p-6">
          <div className="mx-auto max-w-2xl">
            <WizardSuccess
              description="The matter has been created and is ready for work. You can now upload documents, track progress, and manage the case."
              title="Matter Created Successfully!"
            >
              <div className="flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/app/matters">View All Matters</Link>
                </Button>
                <Button asChild>
                  <Link to="/app/matters/wizard">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Create Another Matter
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
  const progressSteps = matterWizardSteps.map((step, index) => ({
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
          <StepClient
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 1:
        return (
          <StepServiceType
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 2:
        return (
          <StepDetails
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 3:
        return (
          <StepSchedule
            data={wizard.data}
            errors={wizard.errors}
            onUpdate={wizard.updateData}
          />
        );
      case 4:
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
            <Link to="/app/matters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Matters", href: "/app/matters" },
          { label: "New Matter (Wizard)" },
        ]}
        description="Step-by-step guided matter creation"
        title="New Matter"
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
              clientId: "Client",
              business: "Business",
              serviceTypeId: "Service Type",
              title: "Title",
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
            submitLabel="Create Matter"
            totalSteps={wizard.totalSteps}
            visitedSteps={wizard.visitedSteps}
          >
            {renderStepContent()}
          </WizardContainer>

          {/* Show submission error */}
          {wizard.errors.submit ? (
            <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error creating matter</p>
              <p className="text-sm">{wizard.errors.submit}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
