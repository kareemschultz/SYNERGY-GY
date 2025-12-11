import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Edit,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/app/clients/$clientId")({
  component: ClientDetailPage,
});

const clientTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individual",
  SMALL_BUSINESS: "Small Business",
  CORPORATION: "Corporation",
  NGO: "NGO",
  COOP: "Cooperative",
  CREDIT_UNION: "Credit Union",
  FOREIGN_NATIONAL: "Foreign National",
  INVESTOR: "Investor",
};

const communicationTypes = [
  { value: "PHONE", label: "Phone" },
  { value: "EMAIL", label: "Email" },
  { value: "IN_PERSON", label: "In Person" },
  { value: "LETTER", label: "Letter" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OTHER", label: "Other" },
];

const communicationDirections = [
  { value: "INBOUND", label: "Inbound (from client)" },
  { value: "OUTBOUND", label: "Outbound (to client)" },
];

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: clientData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => client.clients.getById({ id: clientId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          Client not found or access denied
        </p>
        <Button asChild variant="outline">
          <Link to="/app/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>
    );
  }

  const isIndividual =
    clientData.type === "INDIVIDUAL" || clientData.type === "FOREIGN_NATIONAL";

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/app/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link search={{ clientId }} to="/app/matters/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Matter
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Clients", href: "/app/clients" },
          { label: clientData.displayName },
        ]}
        description={clientTypeLabels[clientData.type] || clientData.type}
        title={clientData.displayName}
      />

      <div className="p-6">
        {/* Client Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  {isIndividual ? (
                    <User className="h-8 w-8 text-primary" />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-xl">
                    {clientData.displayName}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">
                      {clientTypeLabels[clientData.type]}
                    </Badge>
                    <StatusBadge status={clientData.status} />
                    <BusinessBadges businesses={clientData.businesses} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {clientData.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a
                      className="hover:underline"
                      href={`mailto:${clientData.email}`}
                    >
                      {clientData.email}
                    </a>
                  </div>
                )}
                {clientData.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a
                      className="hover:underline"
                      href={`tel:${clientData.phone}`}
                    >
                      {clientData.phone}
                    </a>
                  </div>
                )}
                {clientData.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {clientData.city}, {clientData.country}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <User className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="mr-2 h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="matters">
              <FileText className="mr-2 h-4 w-4" />
              Matters
            </TabsTrigger>
            <TabsTrigger value="communications">
              <MessageSquare className="mr-2 h-4 w-4" />
              Communications
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent className="mt-6" value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isIndividual ? (
                    <>
                      <InfoRow
                        label="First Name"
                        value={clientData.firstName}
                      />
                      <InfoRow label="Last Name" value={clientData.lastName} />
                      <InfoRow
                        label="Date of Birth"
                        value={clientData.dateOfBirth}
                      />
                      <InfoRow
                        label="Nationality"
                        value={clientData.nationality}
                      />
                    </>
                  ) : (
                    <>
                      <InfoRow
                        label="Business Name"
                        value={clientData.businessName}
                      />
                      <InfoRow
                        label="Registration #"
                        value={clientData.registrationNumber}
                      />
                      <InfoRow
                        label="Incorporation Date"
                        value={clientData.incorporationDate}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Email" value={clientData.email} />
                  <InfoRow label="Phone" value={clientData.phone} />
                  <InfoRow
                    label="Alternate Phone"
                    value={clientData.alternatePhone}
                  />
                  <InfoRow label="Address" value={clientData.address} />
                  <InfoRow label="City" value={clientData.city} />
                  <InfoRow label="Country" value={clientData.country} />
                </CardContent>
              </Card>

              {/* Identification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Identification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="TIN Number" value={clientData.tinNumber} />
                  <InfoRow label="National ID" value={clientData.nationalId} />
                  <InfoRow
                    label="Passport #"
                    value={clientData.passportNumber}
                  />
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientData.notes ? (
                    <p className="whitespace-pre-wrap text-sm">
                      {clientData.notes}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No notes</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent className="mt-6" value="contacts">
            <ContactsSection
              clientId={clientId}
              contacts={clientData.contacts}
            />
          </TabsContent>

          {/* Matters Tab */}
          <TabsContent className="mt-6" value="matters">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Matters</CardTitle>
                <Button asChild size="sm">
                  <Link search={{ clientId }} to="/app/matters/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Matter
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  No matters found for this client.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent className="mt-6" value="communications">
            <CommunicationsSection
              clientId={clientId}
              communications={clientData.communications}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm">{value || "-"}</span>
    </div>
  );
}

function BusinessBadges({ businesses }: { businesses: string[] }) {
  return (
    <div className="flex gap-1">
      {businesses.includes("GCMC") && (
        <Badge className="bg-emerald-500/10 text-emerald-600" variant="outline">
          GCMC
        </Badge>
      )}
      {businesses.includes("KAJ") && (
        <Badge className="bg-blue-500/10 text-blue-600" variant="outline">
          KAJ
        </Badge>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    ACTIVE: { className: "bg-green-500/10 text-green-600", label: "Active" },
    INACTIVE: {
      className: "bg-yellow-500/10 text-yellow-600",
      label: "Inactive",
    },
    ARCHIVED: { className: "bg-gray-500/10 text-gray-600", label: "Archived" },
  };
  const variant = variants[status] || variants.ACTIVE;
  return (
    <Badge className={variant.className} variant="outline">
      {variant.label}
    </Badge>
  );
}

interface Contact {
  id: string;
  name: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: string | null;
  notes?: string | null;
}

function ContactsSection({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: Contact[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    email: "",
    phone: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      client.clients.contacts.create({
        clientId,
        name: newContact.name,
        relationship: newContact.relationship || undefined,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setIsAddOpen(false);
      setNewContact({ name: "", relationship: "", email: "", phone: "" });
      toast.success("Contact added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add contact");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.clients.contacts.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Contact deleted");
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contacts</CardTitle>
        <Dialog onOpenChange={setIsAddOpen} open={isAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  placeholder="Contact name"
                  value={newContact.name}
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      relationship: e.target.value,
                    })
                  }
                  placeholder="e.g., Spouse, Director, Accountant"
                  value={newContact.relationship}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  placeholder="Email address"
                  type="email"
                  value={newContact.email}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  placeholder="Phone number"
                  value={newContact.phone}
                />
              </div>
              <Button
                className="w-full"
                disabled={!newContact.name || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No contacts added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={contact.id}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.name}</span>
                    {contact.isPrimary === "true" && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                  </div>
                  {contact.relationship && (
                    <p className="text-muted-foreground text-sm">
                      {contact.relationship}
                    </p>
                  )}
                  <div className="mt-1 flex gap-4 text-muted-foreground text-sm">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                </div>
                <Button
                  onClick={() => deleteMutation.mutate(contact.id)}
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Communication {
  id: string;
  type: string;
  direction: string;
  subject?: string | null;
  summary: string;
  communicatedAt: Date;
  staff?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
}

function CommunicationsSection({
  clientId,
  communications,
}: {
  clientId: string;
  communications: Communication[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newComm, setNewComm] = useState({
    type: "PHONE" as const,
    direction: "OUTBOUND" as const,
    subject: "",
    summary: "",
    communicatedAt: new Date().toISOString().slice(0, 16),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      client.clients.communications.create({
        clientId,
        type: newComm.type,
        direction: newComm.direction,
        subject: newComm.subject || undefined,
        summary: newComm.summary,
        communicatedAt: new Date(newComm.communicatedAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setIsAddOpen(false);
      setNewComm({
        type: "PHONE",
        direction: "OUTBOUND",
        subject: "",
        summary: "",
        communicatedAt: new Date().toISOString().slice(0, 16),
      });
      toast.success("Communication logged");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log communication");
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Communication Log</CardTitle>
        <Dialog onOpenChange={setIsAddOpen} open={isAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Communication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    onValueChange={(v) =>
                      setNewComm({ ...newComm, type: v as typeof newComm.type })
                    }
                    value={newComm.type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {communicationTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    onValueChange={(v) =>
                      setNewComm({
                        ...newComm,
                        direction: v as typeof newComm.direction,
                      })
                    }
                    value={newComm.direction}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {communicationDirections.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  onChange={(e) =>
                    setNewComm({ ...newComm, communicatedAt: e.target.value })
                  }
                  type="datetime-local"
                  value={newComm.communicatedAt}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  onChange={(e) =>
                    setNewComm({ ...newComm, subject: e.target.value })
                  }
                  placeholder="Brief subject"
                  value={newComm.subject}
                />
              </div>
              <div className="space-y-2">
                <Label>Summary *</Label>
                <Textarea
                  onChange={(e) =>
                    setNewComm({ ...newComm, summary: e.target.value })
                  }
                  placeholder="What was discussed..."
                  rows={3}
                  value={newComm.summary}
                />
              </div>
              <Button
                className="w-full"
                disabled={!newComm.summary || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Log Communication
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No communications logged yet.
          </p>
        ) : (
          <div className="space-y-4">
            {communications.map((comm) => (
              <div className="border-muted border-l-2 pl-4" key={comm.id}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{comm.type}</Badge>
                  <Badge
                    variant={
                      comm.direction === "INBOUND" ? "secondary" : "outline"
                    }
                  >
                    {comm.direction === "INBOUND" ? "Inbound" : "Outbound"}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {new Date(comm.communicatedAt).toLocaleString()}
                  </span>
                </div>
                {comm.subject && (
                  <p className="mt-1 font-medium text-sm">{comm.subject}</p>
                )}
                <p className="mt-1 text-sm">{comm.summary}</p>
                {comm.staff?.user?.name && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    by {comm.staff.user.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
