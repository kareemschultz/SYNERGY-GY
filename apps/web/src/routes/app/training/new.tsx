/**
 * New Training Course Page
 *
 * Form for creating new training courses in the GCMC catalog.
 * Requires admin permissions.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/app/training/new")({
  component: NewCoursePage,
});

function NewCoursePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "HUMAN_RESOURCES",
    duration: "",
    maxParticipants: "20",
    price: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const course = await orpc.training.courses.create.mutate({
        title: formData.title,
        description: formData.description || null,
        category: formData.category as
          | "HUMAN_RESOURCES"
          | "CUSTOMER_RELATIONS"
          | "BUSINESS_DEVELOPMENT"
          | "COMPLIANCE"
          | "OTHER",
        duration: Number.parseInt(formData.duration, 10),
        maxParticipants: Number.parseInt(formData.maxParticipants, 10),
        price: Math.round(Number.parseFloat(formData.price) * 100), // Convert to cents
      });

      toast({
        title: "Course created",
        description: `${course.title} has been added to the catalog.`,
      });

      navigate({
        to: "/app/training/courses/$courseId",
        params: { courseId: course.id },
      });
    } catch (error) {
      toast({
        title: "Failed to create course",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the course.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate({ to: "/app/training" })}
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Create Training Course
          </h1>
          <p className="text-muted-foreground">
            Add a new course to the GCMC training catalog
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Provide details about the training course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">
                Course Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Customer Service Excellence"
                required
                value={formData.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe the course objectives and content..."
                rows={4}
                value={formData.description}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                  value={formData.category}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HUMAN_RESOURCES">
                      Human Resources
                    </SelectItem>
                    <SelectItem value="CUSTOMER_RELATIONS">
                      Customer Relations
                    </SelectItem>
                    <SelectItem value="BUSINESS_DEVELOPMENT">
                      Business Development
                    </SelectItem>
                    <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration (hours) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  min="1"
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  placeholder="e.g., 8"
                  required
                  type="number"
                  value={formData.duration}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">
                  Max Participants <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxParticipants"
                  min="1"
                  onChange={(e) =>
                    handleInputChange("maxParticipants", e.target.value)
                  }
                  placeholder="e.g., 20"
                  required
                  type="number"
                  value={formData.maxParticipants}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (GYD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  min="0"
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="e.g., 15000.00"
                  required
                  step="0.01"
                  type="number"
                  value={formData.price}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating..." : "Create Course"}
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => navigate({ to: "/app/training" })}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
