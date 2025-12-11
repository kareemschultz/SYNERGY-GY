import type { AppRouterClient } from "@SYNERGY-GY/api/routers/index";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Tag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

type Service = Awaited<
  ReturnType<AppRouterClient["serviceCatalog"]["services"]["getById"]>
>;

type ServiceDetailProps = {
  service: Service;
};

const renderPricing = (service: Service) => {
  if (service.pricingType === "CUSTOM") {
    return (
      <div className="font-bold text-2xl text-muted-foreground">
        Quote-based pricing
      </div>
    );
  }

  if (service.pricingType === "TIERED" && service.pricingTiers) {
    return (
      <div className="space-y-3">
        {service.pricingTiers.map(
          (
            tier: {
              name: string;
              description?: string;
              price?: number;
              minPrice?: number;
              maxPrice?: number;
              conditions?: string;
            },
            tierIndex: number
          ) => {
            const getTierPrice = () => {
              if (tier.price) {
                return formatCurrency(tier.price, service.currency);
              }
              // biome-ignore lint/nursery/noLeakedRender: Auto-fix
              if (tier.minPrice && tier.maxPrice) {
                return `${formatCurrency(tier.minPrice, service.currency)} - ${formatCurrency(tier.maxPrice, service.currency)}`;
              }
              return "Contact us";
            };

            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
              <Card key={`tier-${tierIndex}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {tier.description ? (
                    <p className="text-muted-foreground text-sm">
                      {tier.description}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="font-bold text-2xl">{getTierPrice()}</div>
                  {tier.conditions ? (
                    <p className="mt-2 text-muted-foreground text-sm">
                      {tier.conditions}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    );
  }

  if (
    service.pricingType === "RANGE" &&
    service.basePrice &&
    service.maxPrice
  ) {
    return (
      <div className="font-bold text-2xl">
        {formatCurrency(Number(service.basePrice), service.currency)} -{" "}
        {formatCurrency(Number(service.maxPrice), service.currency)}
      </div>
    );
  }

  if (service.pricingType === "FIXED" && service.basePrice) {
    return (
      <div className="font-bold text-2xl">
        {formatCurrency(Number(service.basePrice), service.currency)}
      </div>
    );
  }

  return (
    <div className="font-bold text-2xl text-muted-foreground">
      Contact us for pricing
    </div>
  );
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
export function ServiceDetail({ service }: ServiceDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="font-bold text-3xl">{service.displayName}</h1>
          {service.isFeatured ? (
            <Badge variant="secondary">Featured</Badge>
          ) : null}
          <Badge variant="outline">{service.business}</Badge>
        </div>
        {service.category ? (
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{service.category.displayName}</span>
          </div>
        ) : null}
        {service.shortDescription ? (
          <p className="text-lg text-muted-foreground">
            {service.shortDescription}
          </p>
        ) : null}
      </div>

      <Separator />

      {/* Key Details Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {service.typicalDuration ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Duration</p>
                  <p className="font-semibold">{service.typicalDuration}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {service.targetAudience ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">For</p>
                  <p className="font-semibold">{service.targetAudience}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {service.estimatedDays ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Est. Timeline</p>
                  <p className="font-semibold">{service.estimatedDays} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Description */}
      {!!service.description && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{service.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics Covered */}
      {!!service.topicsCovered && service.topicsCovered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Topics Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {service.topicsCovered.map((topic: string, index: number) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
                <li className="flex items-start gap-2" key={index}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Document Requirements */}
      {!!service.documentRequirements &&
        service.documentRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {service.documentRequirements.map(
                  (doc: string, index: number) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
                    <li className="flex items-start gap-2" key={index}>
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                        <span className="font-medium text-xs">{index + 1}</span>
                      </div>
                      <span>{doc}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Deliverables */}
      {!!service.deliverables && service.deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              What You'll Receive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {service.deliverables.map(
                (deliverable: string, index: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
                  <li className="flex items-start gap-2" key={index}>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <span>{deliverable}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Workflow */}
      {!!service.workflow && (
        <Card>
          <CardHeader>
            <CardTitle>Service Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {service.workflow}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderPricing()}

          {!!service.pricingNotes && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm">{service.pricingNotes}</p>
            </div>
          )}

          {!!service.discountsAvailable && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
              <p className="text-green-800 text-sm dark:text-green-200">
                <strong>Discounts Available:</strong>{" "}
                {service.discountsAvailable}
              </p>
            </div>
          )}

          {!!service.governmentFees && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-amber-800 text-sm dark:text-amber-200">
                <strong>Government Fees:</strong> {service.governmentFees}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Government Agencies */}
      {!!service.governmentAgencies &&
        service.governmentAgencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Government Agencies Involved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {service.governmentAgencies.map(
                  (agency: string, index: number) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
                    <Badge key={index} variant="outline">
                      {agency}
                    </Badge>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Tags */}
      {!!service.tags && service.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {service.tags.map((tag: string, index: number) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
