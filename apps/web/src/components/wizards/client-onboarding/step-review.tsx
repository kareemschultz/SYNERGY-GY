import {
  Briefcase,
  Building2,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { WizardStep, WizardStepSection } from "../wizard-step";
import {
  CLIENT_TYPES,
  type ClientOnboardingData,
  GCMC_SERVICES,
  getDisplayName,
  getRequiredDocuments,
  isBusinessType,
  KAJ_SERVICES,
} from "./types";

type StepReviewProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
};

/**
 * Helper component to render the appropriate icon based on client type.
 * Extracted to avoid nested ternary in the main component.
 */
function ClientTypeIcon({
  clientType,
  isBusiness,
}: {
  clientType: string;
  isBusiness: boolean;
}) {
  if (isBusiness) {
    return <Building2 className="size-6" />;
  }
  if (clientType === "FOREIGN_NATIONAL") {
    return <Globe className="size-6" />;
  }
  return <User className="size-6" />;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Review step displays comprehensive client summary with services, documents, employment, emergency contacts, and validation status across multiple sections
export function StepReview({ data, errors, onUpdate }: StepReviewProps) {
  const displayName = getDisplayName(data);
  const clientTypeLabel =
    CLIENT_TYPES.find((t) => t.value === data.clientType)?.label || "";
  const isBusiness = isBusinessType(data.clientType);
  const requiredDocuments = getRequiredDocuments(data);

  const selectedGCMCServices = GCMC_SERVICES.filter((s) =>
    data.gcmcServices.includes(s.value)
  );
  const selectedKAJServices = KAJ_SERVICES.filter((s) =>
    data.kajServices.includes(s.value)
  );

  return (
    <WizardStep
      description="Review the client information before creating"
      title="Review & Create Client"
    >
      {/* Client Summary Card */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-start gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClientTypeIcon
              clientType={data.clientType}
              isBusiness={isBusiness}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{displayName || "—"}</h3>
            <p className="text-muted-foreground text-sm">{clientTypeLabel}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.businesses.map((b) => (
                <Badge
                  className={
                    b === "GCMC"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }
                  key={b}
                  variant="secondary"
                >
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {data.email ? (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <span>{data.email}</span>
            </div>
          ) : null}
          {data.phone ? (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-muted-foreground" />
              <span>{data.phone}</span>
            </div>
          ) : null}
          {data.address || data.city ? (
            <div className="flex items-start gap-2 text-sm sm:col-span-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {[data.address, data.city, data.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          ) : null}
        </div>

        {/* Identification */}
        {data.tinNumber ||
        data.nationalId ||
        data.passportNumber ||
        data.nisNumber ? (
          <>
            <Separator />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {data.tinNumber ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">TIN:</span>{" "}
                  {data.tinNumber}
                </div>
              ) : null}
              {data.nationalId ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">National ID:</span>{" "}
                  {data.nationalId}
                </div>
              ) : null}
              {data.passportNumber ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Passport:</span>{" "}
                  {data.passportNumber}
                </div>
              ) : null}
              {data.nisNumber ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">NIS:</span>{" "}
                  {data.nisNumber}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {/* Business Details (for business types) */}
        {Boolean(isBusiness) && data.registrationNumber ? (
          <>
            <Separator />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {data.registrationNumber ? (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="size-4 text-muted-foreground" />
                  <span>Reg #: {data.registrationNumber}</span>
                </div>
              ) : null}
              {data.incorporationDate ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Incorporated:</span>{" "}
                  {new Date(data.incorporationDate).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {/* Selected Services */}
      {selectedGCMCServices.length > 0 || selectedKAJServices.length > 0 ? (
        <WizardStepSection className="mt-6" title="Selected Services">
          <div className="space-y-3">
            {selectedGCMCServices.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    variant="secondary"
                  >
                    GCMC
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedGCMCServices.map((service) => (
                    <Badge key={service.value} variant="outline">
                      {service.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedKAJServices.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    variant="secondary"
                  >
                    KAJ
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedKAJServices.map((service) => (
                    <Badge key={service.value} variant="outline">
                      {service.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </WizardStepSection>
      ) : null}

      {/* Required Documents */}
      {requiredDocuments.length > 0 ? (
        <Alert className="mt-6">
          <FileText className="size-4" />
          <AlertTitle>Documents to Collect</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Based on the selected services, the following documents will be
              needed:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {requiredDocuments.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Notes */}
      <WizardStepSection className="mt-6" title="Additional Notes">
        <Textarea
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Add any additional notes about this client..."
          rows={3}
          value={data.notes}
        />
      </WizardStepSection>

      {errors.submit ? (
        <Alert className="mt-6" variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      ) : null}
    </WizardStep>
  );
}
