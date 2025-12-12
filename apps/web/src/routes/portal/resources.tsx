import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/portal/resources")({
  component: PortalResourcesPage,
});

function PortalResourcesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");

  const { data: me } = client.portal.me.useQuery();

  // Logic to determine which businesses to show
  // But for now, we can just let client see everything public or filter by their business
  // The API list endpoint handles filtering logic if we pass business.
  // If we pass 'ALL', it returns items for all businesses (that are not staff only).
  // However, maybe we only want to show General + Client's specific business items.
  // Ideally, the API would handle this context-aware filtering.
  // For now, let's just show everything available to clients.

  const { data, isLoading } = client.knowledgeBase.list.useQuery({
    search: search || undefined,
    category: category !== "ALL" ? (category as any) : undefined,
    type: type !== "ALL" ? (type as any) : undefined,
    isStaffOnly: false,
  });

  const downloadMutation = client.knowledgeBase.download.useMutation({
    onSuccess: (data) => {
      toast.success("Download started");
      // Handle download URL
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDownload = (id: string) => {
    downloadMutation.mutate({ id, clientId: me?.client.id });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Resources</h1>
        <p className="text-muted-foreground">
          Access forms, guides, and documents relevant to your business.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            value={search}
          />
        </div>
        <Select onValueChange={setCategory} value={category}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="GRA">Tax (GRA)</SelectItem>
            <SelectItem value="NIS">NIS</SelectItem>
            <SelectItem value="IMMIGRATION">Immigration</SelectItem>
            <SelectItem value="DCRA">Business (DCRA)</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setType} value={type}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="AGENCY_FORM">Forms</SelectItem>
            <SelectItem value="GUIDE">Guides</SelectItem>
            <SelectItem value="CHECKLIST">Checklists</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card className="animate-pulse" key={i}>
              <CardHeader className="h-24 bg-muted/50" />
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 text-muted-foreground">
          <FileText className="mb-2 h-10 w-10 opacity-20" />
          <p>No resources found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((item) => (
            <Card
              className="flex flex-col transition-shadow hover:shadow-md"
              key={item.id}
            >
              <CardHeader className="pb-2">
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.business && (
                    <Badge className="ml-2" variant="secondary">
                      {item.business}
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2 text-lg">
                  {item.title}
                </CardTitle>
                <CardDescription>{item.type.replace("_", " ")}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="line-clamp-3 text-muted-foreground text-sm">
                  {item.shortDescription || item.description}
                </p>
              </CardContent>
              <CardFooter className="mt-auto pt-4">
                <Button
                  className="w-full"
                  onClick={() => handleDownload(item.id)}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
