import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddServiceDialog } from "@/components/clients/add-service-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client, queryClient } from "@/utils/orpc";

type ClientServicesTabProps = {
  clientId: string;
};

export function ClientServicesTab({ clientId }: ClientServicesTabProps) {
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const { data: clientData } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => client.clients.getById({ id: clientId }),
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["clientServices", clientId],
    queryFn: () => client.clientServices.getByClient({ clientId }),
  });

  const servicesList = services ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: ({
      selectionId,
      status,
    }: {
      selectionId: string;
      status: "INTERESTED" | "ACTIVE" | "COMPLETED" | "INACTIVE";
    }) =>
      client.clientServices.updateStatus({
        selectionId,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientServices", clientId] });
      toast.success("Service status updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (selectionId: string) =>
      client.clientServices.delete({ selectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientServices", clientId] });
      toast.success("Service removed");
      setServiceToDelete(null); // Close dialog
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove service");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const businesses = clientData?.businesses || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Selected Services</CardTitle>
              <CardDescription>
                Manage services and track progress for this client
              </CardDescription>
            </div>
            <AddServiceDialog businesses={businesses} clientId={clientId} />
          </div>
        </CardHeader>
        <CardContent>
          {servicesList.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {servicesList.map((service) => (
                <Card className="overflow-hidden" key={service.id}>
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                    <Badge
                      className={
                        service.business === "GCMC"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }
                      variant="outline"
                    >
                      {service.business}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="h-8 w-8" size="icon" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            search={{ tab: "documents" }}
                            to={`/app/clients/${clientId}`}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Documents
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setServiceToDelete(service.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <h3 className="mb-1 font-semibold leading-none">
                        {service.serviceName}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Added{" "}
                        {new Date(service.selectedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <Select
                          disabled={updateStatusMutation.isPending}
                          onValueChange={(
                            val:
                              | "INTERESTED"
                              | "ACTIVE"
                              | "COMPLETED"
                              | "INACTIVE"
                          ) =>
                            updateStatusMutation.mutate({
                              selectionId: service.id,
                              status: val,
                            })
                          }
                          value={service.status}
                        >
                          <SelectTrigger className="h-6 w-[110px] px-2 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INTERESTED">
                              Interested
                            </SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Documents</span>
                        <span className="font-medium">
                          {service.fulfillment?.uploaded || 0} /{" "}
                          {service.fulfillment?.total || 0}
                        </span>
                      </div>
                      <Progress
                        className="h-1.5"
                        value={service.fulfillment?.percentage || 0}
                        // className={
                        //   (service.fulfillment?.percentage || 0) === 100
                        //     ? "bg-green-100 [&>div]:bg-green-600"
                        //     : ""
                        // }
                      />
                    </div>

                    {(service.fulfillment?.percentage || 0) === 100 ? (
                      <div className="flex items-center gap-1.5 rounded-md bg-green-50 p-2 font-medium text-green-600 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Documents Complete
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-md bg-amber-50 p-2 font-medium text-amber-600 text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Missing Documents
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/5 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 font-semibold text-lg">
                No Services Selected
              </h3>
              <p className="mb-4 max-w-sm text-muted-foreground text-sm">
                Add services to track requirements, documents, and progress for
                this client.
              </p>
              <AddServiceDialog businesses={businesses} clientId={clientId} />
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setServiceToDelete(null);
          }
        }}
        open={Boolean(serviceToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the
              service selection from the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (serviceToDelete) {
                  deleteMutation.mutate(serviceToDelete);
                }
              }}
            >
              {Boolean(deleteMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
