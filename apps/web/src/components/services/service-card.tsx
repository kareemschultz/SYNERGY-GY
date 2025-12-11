import type { AppRouterClient } from "@SYNERGY-GY/api/routers/index";
import { Link } from "@tanstack/react-router";
import { Building2, Calendar, ChevronRight, FileText, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

type Service = Awaited<
  ReturnType<AppRouterClient["serviceCatalog"]["services"]["getById"]>
>;

type ServiceCardProps = {
  service: Service;
  showBusiness?: boolean;
  compact?: boolean;
  linkTo?: string;
};

export function ServiceCard({
  service,
  showBusiness = false,
  compact = false,
  linkTo,
}: ServiceCardProps) {
  const CardWrapper = linkTo
    ? ({ children, ...props }: React.ComponentProps<typeof Card>) => (
        <Link to={linkTo}>
          <Card
            {...props}
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
          >
            {children}
          </Card>
        </Link>
      )
    : Card;

  const renderPricing = () => {
    if (service.pricingType === "CUSTOM") {
      return (
        <div className="font-semibold text-lg text-muted-foreground">
          Quote-based pricing
        </div>
      );
    }

    if (service.pricingType === "TIERED" && service.pricingTiers) {
      return (
        <div className="space-y-2">
          <div className="font-medium text-muted-foreground text-sm">
            Multiple tiers available
          </div>
          {service.pricingTiers.slice(0, 3).map(
            (
              tier: {
                name: string;
                price?: number;
                minPrice?: number;
                maxPrice?: number;
              },
              index: number
            ) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
              <div className="flex items-center justify-between" key={index}>
                <span className="text-muted-foreground text-sm">
                  {tier.name}
                </span>
                <span className="font-medium text-sm">
                  {tier.price
                    ? formatCurrency(tier.price, service.currency)
                    : // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                      // biome-ignore lint/style/noNestedTernary: Auto-fix
                      tier.minPrice && tier.maxPrice
                      ? `${formatCurrency(tier.minPrice, service.currency)} - ${formatCurrency(tier.maxPrice, service.currency)}`
                      : "Contact us"}
                </span>
              </div>
            )
          )}
          {service.pricingTiers.length > 3 && (
            <div className="text-muted-foreground text-xs">
              +{service.pricingTiers.length - 3} more tiers
            </div>
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
        <div className="font-semibold text-lg">
          {formatCurrency(Number(service.basePrice), service.currency)} -{" "}
          {formatCurrency(Number(service.maxPrice), service.currency)}
        </div>
      );
    }

    if (service.pricingType === "FIXED" && service.basePrice) {
      return (
        <div className="font-semibold text-lg">
          {formatCurrency(Number(service.basePrice), service.currency)}
        </div>
      );
    }

    return (
      <div className="font-semibold text-lg text-muted-foreground">
        Contact us
      </div>
    );
  };

  if (compact) {
    return (
      <CardWrapper>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-1 text-base">
                {service.displayName}
              </CardTitle>
              {!!service.shortDescription && (
                <CardDescription className="mt-1 line-clamp-2">
                  {service.shortDescription}
                </CardDescription>
              )}
            </div>
            {!!showBusiness && (
              <Badge className="shrink-0" variant="outline">
                {service.business}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pt-0">
          {renderPricing()}
          {!!linkTo && (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </CardFooter>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{service.displayName}</CardTitle>
              {!!service.isFeatured && (
                <Badge className="shrink-0" variant="secondary">
                  Featured
                </Badge>
              )}
              {!!showBusiness && (
                <Badge className="shrink-0" variant="outline">
                  {service.business}
                </Badge>
              )}
            </div>
            {!!service.category && (
              <div className="mb-2 flex items-center gap-1 text-muted-foreground text-sm">
                <FileText className="h-3 w-3" />
                <span>{service.category.displayName}</span>
              </div>
            )}
            {!!service.shortDescription && (
              <CardDescription className="line-clamp-3">
                {service.shortDescription}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!!service.typicalDuration && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{service.typicalDuration}</span>
          </div>
        )}

        {!!service.targetAudience && (
          <div className="flex items-start gap-2 text-sm">
            <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">For:</span>{" "}
              <span>{service.targetAudience}</span>
            </div>
          </div>
        )}

        {!!service.tags && service.tags.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {service.tags.map((tag: string, index: number) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Auto-fix
                <Badge className="text-xs" key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div>
          <div className="mb-2 font-medium text-muted-foreground text-sm">
            Pricing
          </div>
          {renderPricing()}
          {!!service.pricingNotes && (
            <p className="mt-2 text-muted-foreground text-xs">
              {service.pricingNotes}
            </p>
          )}
        </div>
      </CardContent>

      {!!linkTo && (
        <CardFooter className="pt-0">
          <div className="flex items-center gap-1 font-medium text-primary text-sm">
            View details
            <ChevronRight className="h-4 w-4" />
          </div>
        </CardFooter>
      )}
    </CardWrapper>
  );
}
