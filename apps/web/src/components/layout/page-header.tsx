import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemComponent,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BreadcrumbItemType = {
  label: string;
  href?: string;
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: PageHeaderProps) {
  // Support both actions prop and children
  const actionsContent = actions || children;
  return (
    <div className="border-b bg-card">
      <div className="flex flex-col gap-4 px-6 py-4">
        {/* Breadcrumbs */}
        {!!breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <BreadcrumbItemComponent key={item.label}>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator>
                          <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                      </>
                    )}
                  </BreadcrumbItemComponent>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}

        {/* Title and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
            {description ? (
              <p className="text-muted-foreground text-sm">{description}</p>
            ) : null}
          </div>
          {actionsContent ? (
            <div className="flex flex-shrink-0 items-center gap-2">
              {actionsContent}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
