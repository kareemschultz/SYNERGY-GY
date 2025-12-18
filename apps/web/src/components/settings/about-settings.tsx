import { useQuery } from "@tanstack/react-query";
import {
  Book,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { client } from "@/utils/orpc";

export function AboutSettings() {
  const { data: appInfo, isLoading } = useQuery({
    queryKey: ["appInfo"],
    queryFn: () => client.settings.getAppInfo(),
  });

  const supportLinks = [
    {
      icon: Book,
      title: "Knowledge Base",
      description: "Access guides and resources",
      href: "/app/knowledge-base",
      external: false,
    },
    {
      icon: HelpCircle,
      title: "GCMC Support",
      description: "Tax, Immigration & Training inquiries",
      href: "mailto:info@gcmc.gy",
      external: true,
    },
    {
      icon: Mail,
      title: "KAJ Support",
      description: "Insurance & NIS inquiries",
      href: "mailto:info@kajconsultants.gy",
      external: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">About</h2>
        <p className="text-muted-foreground text-sm">
          Application information and support resources
        </p>
      </div>

      {/* App Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            GK-Nexus
          </CardTitle>
          <CardDescription>
            Business Management Platform for GCMC and KAJ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Version</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {appInfo?.version || "1.0.0"}
                    </Badge>
                    <Badge
                      className="bg-green-500/10 text-green-600"
                      variant="outline"
                    >
                      Latest
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Build Date</p>
                  <p className="text-sm">
                    {appInfo?.buildDate
                      ? new Date(appInfo.buildDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Unknown"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Environment</p>
                  <Badge
                    className={
                      appInfo?.environment === "production"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }
                    variant="outline"
                  >
                    {appInfo?.environment || "Production"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">All systems operational</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="font-medium text-sm">About This Application</p>
                <p className="text-muted-foreground text-sm">
                  GK-Nexus is a comprehensive business management platform
                  serving Guyana Consultancy & Management Co. (GCMC) and KAJ
                  Insurance Consultants. It provides tools for client
                  management, matter tracking, document organization, deadline
                  monitoring, GRA/NIS compliance, tax calculations, and team
                  collaboration across both businesses.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Technology Stack</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">TanStack Router</Badge>
                  <Badge variant="secondary">Hono</Badge>
                  <Badge variant="secondary">Drizzle ORM</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">shadcn/ui</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Support & Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Help</CardTitle>
          <CardDescription>
            Resources to help you get the most out of GK-Nexus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {supportLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
                  href={link.href}
                  key={link.title}
                  // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                  rel={link.external ? "noopener noreferrer" : undefined}
                  // biome-ignore lint/nursery/noLeakedRender: Auto-fix
                  target={link.external ? "_blank" : undefined}
                >
                  <div className="rounded bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{link.title}</p>
                      {!!link.external && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {link.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legal & Compliance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Legal & Compliance</CardTitle>
          <CardDescription>
            Terms, privacy, and compliance information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button className="justify-start" variant="ghost">
              <Book className="mr-2 h-4 w-4" />
              Terms of Service
            </Button>
            <Button className="justify-start" variant="ghost">
              <Book className="mr-2 h-4 w-4" />
              Privacy Policy
            </Button>
            <Button className="justify-start" variant="ghost">
              <Book className="mr-2 h-4 w-4" />
              Cookie Policy
            </Button>
            <Separator />
            <div className="space-y-1 pt-2">
              <p className="font-medium text-sm">Compliance</p>
              <p className="text-muted-foreground text-xs">
                GK-Nexus is designed to comply with industry standards for data
                protection and privacy. For more information about our security
                practices, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="rounded-lg border p-4 text-center">
        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} GK-Nexus. All rights reserved.
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Serving Guyana Consultancy & Management Co. (GCMC) and KAJ Insurance
          Consultants
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Developed by Karetech Solutions
        </p>
      </div>
    </div>
  );
}
