import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/portal/messages")({
  component: PortalMessages,
});

type Message = {
  id: string;
  subject: string | null;
  content: string;
  senderType: string;
  senderName: string;
  isRead: boolean;
  createdAt: Date;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Portal messages handles inbox display, message threading, read status tracking, and compose/reply functionality
function PortalMessages() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // Fetch messages
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "messages", "list"],
    queryFn: () => client.portal.messages.list({ page: 1, limit: 50 }),
    refetchInterval: 30_000, // Refetch every 30 seconds for new messages
  });

  // Mark message as read mutation
  const markReadMutation = useMutation({
    mutationFn: (messageId: string) =>
      client.portal.messages.markRead({ messageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "messages"] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => client.portal.messages.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "messages"] });
      toast.success("All messages marked as read");
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { subject?: string; content: string }) =>
      client.portal.messages.send(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "messages"] });
      toast.success("Message sent successfully");
      setNewMessageOpen(false);
      setSubject("");
      setContent("");
    },
    onError: (mutationError: Error) => {
      toast.error(`Failed to send message: ${mutationError.message}`);
    },
  });

  // When a message is selected, mark it as read
  useEffect(() => {
    if (
      selectedMessage &&
      !selectedMessage.isRead &&
      selectedMessage.senderType === "STAFF"
    ) {
      markReadMutation.mutate(selectedMessage.id);
    }
  }, [selectedMessage?.id, selectedMessage, markReadMutation.mutate]);

  const handleSendMessage = () => {
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }
    sendMessageMutation.mutate({
      subject: subject.trim() || undefined,
      content: content.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-slate-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/portal">
              <Button size="sm" variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-2xl text-slate-900 dark:text-white">
                Messages
              </h1>
            </div>
            <div className="flex gap-2">
              {(data?.unreadCount ?? 0) > 0 ? (
                <Button
                  disabled={markAllReadMutation.isPending}
                  onClick={() => markAllReadMutation.mutate()}
                  size="sm"
                  variant="outline"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All Read
                </Button>
              ) : null}
              <Button onClick={() => setNewMessageOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Message List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Inbox</CardTitle>
                {(data?.unreadCount ?? 0) > 0 ? (
                  <Badge variant="secondary">{data?.unreadCount} unread</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data?.messages.length ? (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y">
                    {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Message list item renders read status, sender type styling, and conditional truncation */}
                    {data.messages.map((message) => (
                      <button
                        className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                          selectedMessage?.id === message.id ? "bg-muted" : ""
                        } ${
                          !message.isRead && message.senderType === "STAFF"
                            ? "bg-blue-50 dark:bg-blue-900/10"
                            : ""
                        }`}
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        type="button"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                              message.senderType === "STAFF"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                                : "bg-green-100 text-green-600 dark:bg-green-900/30"
                            }`}
                          >
                            {!message.isRead &&
                            message.senderType === "STAFF" ? (
                              <Mail className="h-4 w-4" />
                            ) : (
                              <MailOpen className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium text-sm">
                                {message.senderName}
                              </span>
                              <span className="flex-shrink-0 text-muted-foreground text-xs">
                                {formatDate(new Date(message.createdAt))}
                              </span>
                            </div>
                            {message.subject ? (
                              <p className="truncate font-medium text-sm">
                                {message.subject}
                              </p>
                            ) : null}
                            <p className="line-clamp-2 text-muted-foreground text-sm">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Mail className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="font-medium">No messages yet</p>
                  <p className="mt-1 text-sm">Send a message to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Detail */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              {selectedMessage ? (
                <div className="flex h-[550px] flex-col">
                  {/* Message Header */}
                  <div className="border-b p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          selectedMessage.senderType === "STAFF"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30"
                        }`}
                      >
                        <MailOpen className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {selectedMessage.senderName}
                          </span>
                          {selectedMessage.isRead ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {new Date(selectedMessage.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedMessage.subject ? (
                      <h2 className="mt-3 font-semibold text-lg">
                        {selectedMessage.subject}
                      </h2>
                    ) : null}
                  </div>

                  {/* Message Content */}
                  <ScrollArea className="flex-1 p-4">
                    <p className="whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </ScrollArea>

                  {/* Reply Area - Only show for staff messages */}
                  {selectedMessage.senderType === "STAFF" ? (
                    <div className="border-t p-4">
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!content.trim()) {
                            return;
                          }
                          const subjectText = selectedMessage.subject;
                          const hasSubject =
                            subjectText !== null && subjectText !== "";
                          const replySubject =
                            hasSubject === true ? `Re: ${subjectText}` : null;
                          sendMessageMutation.mutate({
                            subject: replySubject ?? undefined,
                            content: content.trim(),
                          });
                          setContent("");
                        }}
                      >
                        <Textarea
                          className="flex-1 resize-none"
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Type your reply..."
                          rows={2}
                          value={content}
                        />
                        <Button
                          disabled={
                            !content.trim() || sendMessageMutation.isPending
                          }
                          type="submit"
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-[550px] flex-col items-center justify-center text-muted-foreground">
                  <MessageSquare className="mb-4 h-16 w-16 opacity-50" />
                  <p className="font-medium text-lg">Select a message</p>
                  <p className="mt-1 text-sm">
                    Choose a message from the list to view it
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* New Message Dialog */}
      <Dialog onOpenChange={setNewMessageOpen} open={newMessageOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Send a message to our team. We typically respond within 1 business
              day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Input
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                value={subject}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                rows={6}
                value={content}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={sendMessageMutation.isPending}
              onClick={() => {
                setNewMessageOpen(false);
                setSubject("");
                setContent("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!content.trim() || sendMessageMutation.isPending}
              onClick={handleSendMessage}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
