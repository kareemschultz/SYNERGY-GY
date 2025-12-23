import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Cloud,
  CloudOff,
  Download,
  HardDrive,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

type Backup = {
  id: string;
  name: string;
  type: string;
  status: string;
  filePath: string | null;
  fileSize: number | null;
  fileSizeFormatted: string | null;
  fileExists: boolean;
  createdAt: Date;
  completedAt: Date | null;
  tableCount: number | null;
  recordCount: number | null;
  uploadedFilesCount: number | null;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Backup settings page with multiple modals and state management
export function BackupSettings() {
  const queryClient = useQueryClient();
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

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

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => client.backup.create({ type: "manual" }),
    onMutate: () => {
      setBackupInProgress(true);
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
    mutationFn: (id: string) =>
      client.backup.restore({ id, skipMigrations: false }),
    onSuccess: () => {
      toast.success("Restore completed successfully", {
        description: "Please refresh your browser to see the restored data.",
      });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
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
              <TableHead>Type</TableHead>
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
                <TableCell>
                  <Badge variant="outline">{backup.type}</Badge>
                </TableCell>
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
                        <Button
                          className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => {
                            setSelectedBackup(backup);
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
          Manage database backups and restore points
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
            Create a full backup of the database and uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm">
                Backups include all database tables and uploaded documents.
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
              onClick={() => createBackupMutation.mutate()}
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Create Backup Now
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

      {/* Cloud Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            Cloud Storage
          </CardTitle>
          <CardDescription>
            Sync backups to cloud storage for offsite protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CloudOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Cloud storage not configured</p>
              <p className="text-muted-foreground text-sm">
                Configure S3 or Cloudflare R2 to enable automatic cloud backups.
              </p>
            </div>
            <Button disabled variant="outline">
              <Settings2 className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </div>
          <p className="mt-3 text-muted-foreground text-xs">
            Set <code className="rounded bg-muted px-1">BACKUP_S3_*</code>{" "}
            environment variables to enable cloud sync.
          </p>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog onOpenChange={setRestoreDialogOpen} open={restoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace <strong>ALL current data</strong> with the data
              from <strong>{selectedBackup?.name}</strong>. This action cannot
              be undone.
              <br />
              <br />A safety backup of your current data will be created
              automatically before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={restoreBackupMutation.isPending}
              onClick={() => {
                if (selectedBackup) {
                  restoreBackupMutation.mutate(selectedBackup.id);
                }
              }}
            >
              {restoreBackupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Yes, Restore"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
