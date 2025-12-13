import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { WizardStep, WizardStepSection } from "../wizard-step";
import type { ClientOnboardingData } from "./types";

type StepBeneficialOwnersProps = {
  data: ClientOnboardingData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ClientOnboardingData>) => void;
  onFieldBlur?: (fieldName: string) => void;
};

const OWNERSHIP_TYPES = [
  { value: "DIRECT", label: "Direct Ownership" },
  { value: "INDIRECT", label: "Indirect Ownership" },
  { value: "BENEFICIAL", label: "Beneficial Ownership" },
] as const;

const NATIONALITIES = [
  "Guyanese",
  "American",
  "British",
  "Canadian",
  "Indian",
  "Chinese",
  "Brazilian",
  "Surinamese",
  "Trinidadian",
  "Venezuelan",
  "Other",
];

type BeneficialOwner = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  nationalId?: string;
  passportNumber?: string;
  ownershipPercentage: number;
  ownershipType: "DIRECT" | "INDIRECT" | "BENEFICIAL";
  positionHeld?: string;
  isPep: boolean;
  pepDetails?: string;
  pepRelationship?: string;
};

const emptyOwner: BeneficialOwner = {
  fullName: "",
  dateOfBirth: "",
  nationality: "Guyanese",
  ownershipPercentage: 25,
  ownershipType: "DIRECT",
  isPep: false,
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex business logic for beneficial ownership management
export function StepBeneficialOwners({
  data,
  errors,
  onUpdate,
}: StepBeneficialOwnersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentOwner, setCurrentOwner] = useState<BeneficialOwner>(emptyOwner);

  const owners = data.beneficialOwners || [];
  const totalOwnership = owners.reduce(
    (sum, owner) => sum + owner.ownershipPercentage,
    0
  );

  const handleAddOwner = () => {
    setCurrentOwner(emptyOwner);
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditOwner = (index: number) => {
    setCurrentOwner(owners[index]);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleSaveOwner = () => {
    const newOwners =
      editingIndex !== null
        ? owners.map((owner, i) => (i === editingIndex ? currentOwner : owner))
        : [...owners, currentOwner];

    onUpdate({ beneficialOwners: newOwners });
    setIsDialogOpen(false);
    setCurrentOwner(emptyOwner);
    setEditingIndex(null);
  };

  const handleDeleteOwner = (index: number) => {
    const newOwners = owners.filter((_, i) => i !== index);
    onUpdate({ beneficialOwners: newOwners });
  };

  return (
    <WizardStep
      description="Disclose all beneficial owners with 25%+ ownership"
      title="Beneficial Ownership Disclosure"
    >
      {/* Legal Warning */}
      <Alert className="border-destructive" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-bold">Legal Requirement</AlertTitle>
        <AlertDescription>
          Under the <strong>Guyana Beneficial Ownership Disclosure Act</strong>,
          all beneficial owners holding 25% or more ownership must be disclosed.
          Non-compliance carries a penalty of <strong>GYD $200,000</strong>.
          Ensure all information is accurate and complete.
        </AlertDescription>
      </Alert>

      {/* Owners Table */}
      <WizardStepSection className="mt-6" title="Beneficial Owners">
        {owners.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Ownership %</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>PEP</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((owner, index) => (
                    <TableRow
                      key={`${owner.fullName}-${owner.nationality}-${owner.ownershipPercentage}`}
                    >
                      <TableCell className="font-medium">
                        {owner.fullName}
                      </TableCell>
                      <TableCell>{owner.nationality}</TableCell>
                      <TableCell>{owner.ownershipPercentage}%</TableCell>
                      <TableCell>
                        {OWNERSHIP_TYPES.find(
                          (t) => t.value === owner.ownershipType
                        )?.label || owner.ownershipType}
                      </TableCell>
                      <TableCell>
                        {owner.isPep ? (
                          <span className="font-medium text-destructive">
                            Yes
                          </span>
                        ) : (
                          "No"
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          onClick={() => handleEditOwner(index)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteOwner(index)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Ownership Summary */}
            <div className="mt-4 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Ownership Disclosed:</span>
                <span
                  className={`font-bold text-lg ${totalOwnership < 100 ? "text-destructive" : ""}`}
                >
                  {totalOwnership}%
                </span>
              </div>
              {totalOwnership < 100 ? (
                <p className="mt-2 text-destructive text-sm">
                  ⚠️ Total disclosed ownership is less than 100%. Ensure all
                  beneficial owners (25%+ ownership) are disclosed.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <Alert>
            <AlertDescription>
              No beneficial owners added yet. Click "Add Beneficial Owner" to
              begin disclosure.
            </AlertDescription>
          </Alert>
        )}

        <Button className="mt-4" onClick={handleAddOwner}>
          <Plus className="mr-2 h-4 w-4" />
          Add Beneficial Owner
        </Button>

        {errors.beneficialOwners ? (
          <p className="mt-2 text-destructive text-sm">
            {errors.beneficialOwners}
          </p>
        ) : null}
      </WizardStepSection>

      {/* Add/Edit Owner Dialog */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null
                ? "Edit Beneficial Owner"
                : "Add Beneficial Owner"}
            </DialogTitle>
            <DialogDescription>
              Provide complete information for the beneficial owner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerFullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ownerFullName"
                  onChange={(e) =>
                    setCurrentOwner({
                      ...currentOwner,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Full legal name"
                  value={currentOwner.fullName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerDateOfBirth">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ownerDateOfBirth"
                  onChange={(e) =>
                    setCurrentOwner({
                      ...currentOwner,
                      dateOfBirth: e.target.value,
                    })
                  }
                  type="date"
                  value={currentOwner.dateOfBirth}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerNationality">
                  Nationality <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setCurrentOwner({ ...currentOwner, nationality: value })
                  }
                  value={currentOwner.nationality}
                >
                  <SelectTrigger id="ownerNationality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((nat) => (
                      <SelectItem key={nat} value={nat}>
                        {nat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerNationalId">National ID</Label>
                <Input
                  id="ownerNationalId"
                  onChange={(e) =>
                    setCurrentOwner({
                      ...currentOwner,
                      nationalId: e.target.value,
                    })
                  }
                  placeholder="National ID number"
                  value={currentOwner.nationalId || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPassportNumber">Passport Number</Label>
                <Input
                  id="ownerPassportNumber"
                  onChange={(e) =>
                    setCurrentOwner({
                      ...currentOwner,
                      passportNumber: e.target.value,
                    })
                  }
                  placeholder="Passport number"
                  value={currentOwner.passportNumber || ""}
                />
              </div>
            </div>

            {/* Ownership Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerOwnershipPercentage">
                  Ownership Percentage{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ownerOwnershipPercentage"
                  max={100}
                  min={25}
                  onChange={(e) =>
                    setCurrentOwner({
                      ...currentOwner,
                      ownershipPercentage: Number(e.target.value),
                    })
                  }
                  placeholder="25-100"
                  type="number"
                  value={currentOwner.ownershipPercentage}
                />
                <p className="text-muted-foreground text-xs">
                  Minimum 25% required for beneficial ownership
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerOwnershipType">
                  Ownership Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setCurrentOwner({
                      ...currentOwner,
                      ownershipType: value as
                        | "DIRECT"
                        | "INDIRECT"
                        | "BENEFICIAL",
                    })
                  }
                  value={currentOwner.ownershipType}
                >
                  <SelectTrigger id="ownerOwnershipType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="ownerPositionHeld">
                  Position/Title in Company
                </Label>
                <Input
                  id="ownerPositionHeld"
                  onChange={(e) =>
                    setCurrentOwner({
                      ...currentOwner,
                      positionHeld: e.target.value,
                    })
                  }
                  placeholder="e.g., Director, Shareholder, Trustee"
                  value={currentOwner.positionHeld || ""}
                />
              </div>
            </div>

            {/* PEP Declaration */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={currentOwner.isPep}
                  id="ownerIsPep"
                  onCheckedChange={(checked) =>
                    setCurrentOwner({
                      ...currentOwner,
                      isPep: checked === true,
                    })
                  }
                />
                <Label
                  className="cursor-pointer font-medium"
                  htmlFor="ownerIsPep"
                >
                  This person is a Politically Exposed Person (PEP)
                </Label>
              </div>
              <p className="text-muted-foreground text-xs">
                A PEP is a person who holds or has held a prominent public
                function (e.g., government official, judicial officer, military
                official, or their family members/close associates)
              </p>

              {currentOwner.isPep ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPepRelationship">
                      PEP Relationship{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setCurrentOwner({
                          ...currentOwner,
                          pepRelationship: value,
                        })
                      }
                      value={currentOwner.pepRelationship}
                    >
                      <SelectTrigger id="ownerPepRelationship">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELF">
                          Self (I am the PEP)
                        </SelectItem>
                        <SelectItem value="FAMILY_MEMBER">
                          Family Member of PEP
                        </SelectItem>
                        <SelectItem value="CLOSE_ASSOCIATE">
                          Close Associate of PEP
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerPepDetails">
                      PEP Details <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="ownerPepDetails"
                      onChange={(e) =>
                        setCurrentOwner({
                          ...currentOwner,
                          pepDetails: e.target.value,
                        })
                      }
                      placeholder="Describe position held, jurisdiction, and any relevant details"
                      rows={3}
                      value={currentOwner.pepDetails || ""}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsDialogOpen(false);
                setCurrentOwner(emptyOwner);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                !(
                  currentOwner.fullName &&
                  currentOwner.dateOfBirth &&
                  currentOwner.nationality
                ) ||
                currentOwner.ownershipPercentage < 25 ||
                currentOwner.ownershipPercentage > 100 ||
                (currentOwner.isPep && !currentOwner.pepDetails)
              }
              onClick={handleSaveOwner}
            >
              {editingIndex !== null ? "Update Owner" : "Add Owner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WizardStep>
  );
}
