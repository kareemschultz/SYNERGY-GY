import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Download,
  ExternalLink,
  Files,
  FileText,
  FolderPlus,
  HardDrive,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Settings2,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

type BackupScope = "settings" | "data" | "database" | "full";
type RestoreScope = "settings" | "data" | "all";
type RestoreStrategy = "replace" | "merge";

type Backup = {
  id: string;
  name: string;
  type: string;
  scope: BackupScope | null;
  status: string;
  filePath: string | null;
  fileSize: number | null;
  fileSizeFormatted: string | null;
  fileExists: boolean;
  includesFiles: boolean | null;
  createdAt: Date;
  completedAt: Date | null;
  tableCount: number | null;
  recordCount: number | null;
  uploadedFilesCount: number | null;
};

const SCOPE_INFO: Record<
  BackupScope,
  { label: string; description: string; icon: typeof Settings }
> = {
  settings: {
    label: "Settings Only",
    description: "Templates, service catalog, configuration (~100KB)",
    icon: Settings,
  },
  data: {
    label: "Data Only",
    description: "Clients, matters, invoices, documents metadata (~1-10MB)",
    icon: FileText,
  },
  database: {
    label: "Full Database",
    description: "All tables (settings + data) (~1-10MB)",
    icon: Database,
  },
  full: {
    label: "Everything",
    description: "All tables + uploaded files (PDFs, images) (~50MB-1GB+)",
    icon: Files,
  },
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Backup settings page with multiple modals and state management
export function BackupSettings() {
  const queryClient = useQueryClient();
  // Use TanStack Router hooks for URL search params
  const search = useSearch({ from: "/app/settings/" });
  const navigate = useNavigate({ from: "/app/settings/" });
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [selectedScope, setSelectedScope] = useState<BackupScope>("database");
  const [restoreOptions, setRestoreOptions] = useState({
    scope: "all" as RestoreScope,
    strategy: "replace" as RestoreStrategy,
    restoreFiles: false,
    createPreRestoreBackup: true,
  });

  // Handle Google Drive OAuth callback
  useEffect(() => {
    const googleDriveConnected = search.google_drive_connected;
    const googleDriveError = search.google_drive_error;

    if (googleDriveConnected === "true") {
      toast.success("Google Drive connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["backup", "googleDrive"] });
      // Clean up URL - navigate with params removed
      navigate({
        search: { tab: search.tab },
        replace: true,
      });
    }

    if (googleDriveError) {
      toast.error(`Google Drive connection failed: ${googleDriveError}`);
      navigate({
        search: { tab: search.tab },
        replace: true,
      });
    }
  }, [search, navigate, queryClient]);

  // Fetch backup statistics
  const { data: stats } = useQuery({
    queryKey: ["backup", "stats"],
    queryFn: () => client.backup.getStats(),
  });

  // Fetch backup list
  const { data: backupList, isLoading: listLoading } = useQuery({
    queryKey: ["backup", "list"],
    queryFn: () => client.backup.list({ page: 1, limit: 10 }),
  });

  // Fetch size estimate for selected scope
  const { data: sizeEstimate, isLoading: estimateLoading } = useQuery({
    queryKey: ["backup", "estimateSize", selectedScope],
    queryFn: () => client.backup.estimateSize({ scope: selectedScope }),
    enabled: createDialogOpen,
  });

  // Fetch Google Drive status
  const { data: googleDriveStatus } = useQuery({
    queryKey: ["backup", "googleDrive", "status"],
    queryFn: () => client.backup.googleDrive.getStatus(),
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: (scope: BackupScope) =>
      client.backup.create({ type: "manual", scope }),
    onMutate: () => {
      setBackupInProgress(true);
      setCreateDialogOpen(false);
    },
    onSuccess: (data) => {
      toast.success("Backup created successfully", {
        description: `${data.backup.name} (${data.backup.fileSizeFormatted})`,
      });
      queryClient.invalidateQueries({ queryKey: ["backup"] });
    },
    onError: (error) => {
      toast.error("Backup failed", {
        description: error.message,
      });
    },
    onSettled: () => {
      setBackupInProgress(false);
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: (params: {
      id: string;
      scope: RestoreScope;
      strategy: RestoreStrategy;
      restoreFiles: boolean;
      createPreRestoreBackup: boolean;
    }) => client.backup.restore(params),
    onSuccess: (data) => {
      toast.success("Restore completed successfully", {
        description: `Restored ${data.tablesRestored} tables with ${data.recordsRestored} records.`,
      });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      queryClient.invalidateQueries({ queryKey: ["backup"] });
    },
    onError: (error) => {
      toast.error("Restore failed", {
        description: error.message,
      });
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => client.backup.delete({ id, deleteFile: true }),
    onSuccess: () => {
      toast.success("Backup deleted");
      queryClient.invalidateQueries({ queryKey: ["backup"] });
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast.error("Delete failed", {
        description: error.message,
      });
    },
  });

  // Cleanup failed backups mutation
  const cleanupFailedMutation = useMutation({
    mutationFn: () => client.backup.cleanupFailed(),
    onSuccess: (data) => {
      toast.success("Cleanup complete", {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["backup"] });
    },
    onError: (error) => {
      toast.error("Cleanup failed", {
        description: error.message,
      });
    },
  });

  // Google Drive mutations
  const getGoogleDriveAuthUrl = useMutation({
    mutationFn: () => client.backup.googleDrive.getAuthUrl(),
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error("Failed to connect to Google Drive", {
        description: error.message,
      });
    },
  });

  const disconnectGoogleDrive = useMutation({
    mutationFn: () => client.backup.googleDrive.disconnect(),
    onSuccess: () => {
      toast.success("Google Drive disconnected");
      queryClient.invalidateQueries({ queryKey: ["backup", "googleDrive"] });
    },
  });

  const createGoogleDriveFolder = useMutation({
    mutationFn: () => client.backup.googleDrive.createFolder({}),
    onSuccess: (data) => {
      toast.success("Backup folder created in Google Drive", {
        description: `Folder ID: ${data.folderId?.slice(0, 10)}...`,
      });
    },
    onError: (error) => {
      toast.error("Failed to create folder", {
        description: error.message,
      });
    },
  });

  const uploadToGoogleDrive = useMutation({
    mutationFn: (backupId: string) =>
      client.backup.googleDrive.upload({ backupId }),
    onSuccess: (data) => {
      toast.success("Backup uploaded to Google Drive", {
        description: data.fileName,
      });
      queryClient.invalidateQueries({ queryKey: ["backup"] });
    },
    onError: (error) => {
      toast.error("Upload to Google Drive failed", {
        description: error.message,
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-600">Completed</Badge>
        );
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600">Failed</Badge>;
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600">In Progress</Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
        );
    }
  };

  const getScopeBadge = (scope: BackupScope | null) => {
    if (!scope) {
      return <Badge variant="outline">Legacy</Badge>;
    }
    const info = SCOPE_INFO[scope];
    return <Badge variant="outline">{info.label}</Badge>;
  };

  // Helper function to render Google Drive status content (avoids nested ternary)
  const renderGoogleDriveContent = () => {
    if (googleDriveStatus?.connected) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">
                Connected to Google Drive
              </p>
              <p className="text-green-700 text-sm">
                {googleDriveStatus.email}
              </p>
              <p className="mt-1 text-green-600 text-xs">
                Storage: {googleDriveStatus.storageUsed} /{" "}
                {googleDriveStatus.storageTotal}
              </p>
            </div>
            <Button
              onClick={() => disconnectGoogleDrive.mutate()}
              size="sm"
              variant="outline"
            >
              Disconnect
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              disabled={createGoogleDriveFolder.isPending}
              onClick={() => createGoogleDriveFolder.mutate()}
              size="sm"
              variant="outline"
            >
              {createGoogleDriveFolder.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="mr-2 h-4 w-4" />
              )}
              Create Backup Folder
            </Button>
          </div>
        </div>
      );
    }

    if (googleDriveStatus?.configured) {
      return (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Cloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Google Drive configured</p>
            <p className="text-muted-foreground text-sm">
              Click to authorize access to your Google Drive account.
            </p>
          </div>
          <Button
            disabled={getGoogleDriveAuthUrl.isPending}
            onClick={() => getGoogleDriveAuthUrl.mutate()}
          >
            {getGoogleDriveAuthUrl.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Connect
          </Button>
        </div>
      );
    }

    // Not configured
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CloudOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Google Drive not configured</p>
            <p className="text-muted-foreground text-sm">
              Set up Google Cloud OAuth to enable cloud backups.
            </p>
          </div>
          <Button disabled variant="outline">
            <Settings2 className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 font-medium text-sm">Setup Instructions</h4>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-sm">
            <li>
              Go to{" "}
              <a
                className="text-blue-600 underline"
                href="https://console.cloud.google.com/apis/credentials"
                rel="noopener noreferrer"
                target="_blank"
              >
                Google Cloud Console
              </a>
            </li>
            <li>Create OAuth 2.0 credentials (Web application)</li>
            <li>
              Add redirect URI:{" "}
              <code className="rounded bg-muted px-1 text-xs">
                {window.location.origin}/api/auth/google-drive/callback
              </code>
            </li>
            <li>
              Set environment variables:
              <ul className="mt-1 ml-4 list-disc text-xs">
                <li>
                  <code>GOOGLE_DRIVE_CLIENT_ID</code>
                </li>
                <li>
                  <code>GOOGLE_DRIVE_CLIENT_SECRET</code>
                </li>
              </ul>
            </li>
            <li>Restart the server</li>
          </ol>
        </div>
      </div>
    );
  };

  const formatDate = (dateInput: Date | string) =>
    new Date(dateInput).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  // Render backup list content based on loading/data state
  const renderBackupListContent = () => {
    if (listLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (backupList?.backups.length === 0) {
      return (
        <div className="rounded-lg border-2 border-dashed py-8 text-center">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No backups yet</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Create your first backup to protect your data.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backupList?.backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(backup.status)}
                    <span className="max-w-[200px] truncate">
                      {backup.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(backup.status)}</TableCell>
                <TableCell>{getScopeBadge(backup.scope)}</TableCell>
                <TableCell>{backup.fileSizeFormatted || "—"}</TableCell>
                <TableCell>{formatDate(backup.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {backup.status === "completed" && backup.fileExists && (
                      <>
                        <Button
                          asChild
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          size="sm"
                          title="Download backup file"
                          variant="ghost"
                        >
                          <a
                            download
                            href={`/api/backup/download/${backup.id}`}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </a>
                        </Button>
                        {googleDriveStatus?.connected === true ? (
                          <Button
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            disabled={uploadToGoogleDrive.isPending}
                            onClick={() =>
                              uploadToGoogleDrive.mutate(backup.id)
                            }
                            size="sm"
                            title="Upload to Google Drive"
                            variant="ghost"
                          >
                            {uploadToGoogleDrive.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              Upload to Google Drive
                            </span>
                          </Button>
                        ) : null}
                        <Button
                          className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreOptions({
                              scope: "all",
                              strategy: "replace",
                              restoreFiles: backup.includesFiles === true,
                              createPreRestoreBackup: true,
                            });
                            setRestoreDialogOpen(true);
                          }}
                          size="sm"
                          title="Restore from this backup"
                          variant="ghost"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only">Restore</span>
                        </Button>
                      </>
                    )}
                    <Button
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setDeleteDialogOpen(true);
                      }}
                      size="sm"
                      title="Delete backup"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">Backup & Restore</h2>
        <p className="text-muted-foreground text-sm">
          Manage database backups, restore points, and cloud storage
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Total Backups</p>
                <p className="font-bold text-2xl">{stats?.counts.total || 0}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">
                {stats?.counts.completed || 0} completed
              </span>
              <span className="text-red-600">
                {stats?.counts.failed || 0} failed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Storage Used</p>
                <p className="font-bold text-2xl">
                  {stats?.storage.diskTotalSizeFormatted || "0 B"}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              {stats?.storage.diskFiles || 0} backup files on disk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Last Backup</p>
                <p className="font-bold text-lg">
                  {stats?.latestBackup?.completedAt
                    ? formatDate(stats.latestBackup.completedAt)
                    : "Never"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              {stats?.latestBackup?.fileSizeFormatted || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            Create Backup
          </CardTitle>
          <CardDescription>
            Create a backup with customizable scope options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm">
                Choose what to include in your backup based on your needs.
              </p>
              <p className="text-muted-foreground text-xs">
                Backups are stored locally in the{" "}
                <code className="rounded bg-muted px-1">./backups</code>{" "}
                directory.
              </p>
            </div>
            <Button
              className="shrink-0"
              disabled={backupInProgress || createBackupMutation.isPending}
              onClick={() => setCreateDialogOpen(true)}
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </div>

          {createBackupMutation.isPending ? (
            <div className="mt-4 space-y-2">
              <Progress className="h-2" value={33} />
              <p className="text-center text-muted-foreground text-xs">
                Backing up database and files...
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                View and manage previous backups
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(stats?.counts.failed ?? 0) > 0 && (
                <Button
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={cleanupFailedMutation.isPending}
                  onClick={() => cleanupFailedMutation.mutate()}
                  size="sm"
                  variant="outline"
                >
                  {cleanupFailedMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Clean Up Failed ({stats?.counts.failed})
                </Button>
              )}
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["backup"] })
                }
                size="sm"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderBackupListContent()}

          {backupList !== undefined && backupList.pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-center text-muted-foreground text-sm">
              Showing {backupList.backups.length} of{" "}
              {backupList.pagination.total} backups
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Google Drive Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            Google Drive Backup
          </CardTitle>
          <CardDescription>
            Sync backups to Google Drive for offsite protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderGoogleDriveContent()}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              Choose what to include in your backup.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              className="space-y-3"
              onValueChange={(value) => setSelectedScope(value as BackupScope)}
              value={selectedScope}
            >
              {(Object.keys(SCOPE_INFO) as BackupScope[]).map((scope) => {
                const info = SCOPE_INFO[scope];
                const Icon = info.icon;
                return (
                  <div
                    className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                    key={scope}
                  >
                    <RadioGroupItem className="mt-1" id={scope} value={scope} />
                    <div className="flex-1">
                      <Label
                        className="flex cursor-pointer items-center gap-2"
                        htmlFor={scope}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {info.label}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {info.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {sizeEstimate ? (
              <div className="rounded-lg border bg-muted/50 p-3">
                <h4 className="mb-2 font-medium text-sm">Size Estimate</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Tables:</span>
                  <span>{sizeEstimate.tableCount}</span>
                  <span className="text-muted-foreground">Records:</span>
                  <span>{sizeEstimate.recordCount.toLocaleString()}</span>
                  {sizeEstimate.includesFiles === true ? (
                    <>
                      <span className="text-muted-foreground">Files:</span>
                      <span>
                        {sizeEstimate.uploadedFilesCount} (
                        {sizeEstimate.uploadedFilesSizeFormatted})
                      </span>
                    </>
                  ) : null}
                  <span className="text-muted-foreground">Est. Total:</span>
                  <span className="font-medium">
                    {sizeEstimate.estimatedTotalSizeFormatted}
                  </span>
                </div>
              </div>
            ) : null}

            {estimateLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setCreateDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={createBackupMutation.isPending}
              onClick={() => createBackupMutation.mutate(selectedScope)}
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog onOpenChange={setRestoreDialogOpen} open={restoreDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              Restore data from <strong>{selectedBackup?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900 text-sm">
                    Warning: This will modify your data
                  </p>
                  <p className="text-amber-700 text-xs">
                    A safety backup will be created before restoring.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>What to restore</Label>
                <Select
                  onValueChange={(value) =>
                    setRestoreOptions((prev) => ({
                      ...prev,
                      scope: value as RestoreScope,
                    }))
                  }
                  value={restoreOptions.scope}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everything</SelectItem>
                    <SelectItem value="settings">Settings only</SelectItem>
                    <SelectItem value="data">Data only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Restore strategy</Label>
                <Select
                  onValueChange={(value) =>
                    setRestoreOptions((prev) => ({
                      ...prev,
                      strategy: value as RestoreStrategy,
                    }))
                  }
                  value={restoreOptions.strategy}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">
                      Replace (delete existing, restore from backup)
                    </SelectItem>
                    <SelectItem value="merge">
                      Merge (keep existing, add from backup)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={restoreOptions.restoreFiles}
                    disabled={selectedBackup?.includesFiles !== true}
                    id="restoreFiles"
                    onCheckedChange={(checked) =>
                      setRestoreOptions((prev) => ({
                        ...prev,
                        restoreFiles: checked === true,
                      }))
                    }
                  />
                  <Label
                    className={
                      selectedBackup?.includesFiles !== true
                        ? "text-muted-foreground"
                        : ""
                    }
                    htmlFor="restoreFiles"
                  >
                    Restore uploaded files
                    {selectedBackup?.includesFiles !== true && (
                      <span className="ml-1 text-muted-foreground text-xs">
                        (not included in this backup)
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={restoreOptions.createPreRestoreBackup}
                    id="createPreRestoreBackup"
                    onCheckedChange={(checked) =>
                      setRestoreOptions((prev) => ({
                        ...prev,
                        createPreRestoreBackup: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="createPreRestoreBackup">
                    Create safety backup before restoring (recommended)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setRestoreDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={restoreBackupMutation.isPending}
              onClick={() => {
                if (selectedBackup) {
                  restoreBackupMutation.mutate({
                    id: selectedBackup.id,
                    ...restoreOptions,
                  });
                }
              }}
            >
              {restoreBackupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{selectedBackup?.name}</strong> and its associated backup
              file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteBackupMutation.isPending}
              onClick={() => {
                if (selectedBackup) {
                  deleteBackupMutation.mutate(selectedBackup.id);
                }
              }}
            >
              {deleteBackupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
