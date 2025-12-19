/**
 * Training Courses List Page
 *
 * Displays all training courses with search and filter capabilities.
 * Allows GCMC staff to browse the course catalog and manage offerings.
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { CourseCard } from "@/components/training/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";

const coursesSearchSchema = z.object({
  category: z
    .enum([
      "HUMAN_RESOURCES",
      "CUSTOMER_RELATIONS",
      "BUSINESS_DEVELOPMENT",
      "COMPLIANCE",
      "OTHER",
      "ALL",
    ])
    .optional()
    .default("ALL"),
  isActive: z.enum(["true", "false", "all"]).optional().default("true"),
  search: z.string().optional(),
});

export const Route = createFileRoute("/app/training/courses/")({
  validateSearch: coursesSearchSchema,
  component: CoursesPage,
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration: number;
  maxParticipants: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  scheduleCount: number;
};

function CoursesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [searchInput, setSearchInput] = useState(search.search || "");

  const { data: courses, isLoading } = useQuery({
    queryKey: [
      "training-courses",
      {
        category: search.category,
        isActive: search.isActive,
        search: search.search,
      },
    ],
    queryFn: () =>
      client.training.listCourses({
        ...(search.category && search.category !== "ALL"
          ? {
              category: search.category as
                | "HUMAN_RESOURCES"
                | "CUSTOMER_RELATIONS"
                | "BUSINESS_DEVELOPMENT"
                | "COMPLIANCE"
                | "OTHER",
            }
          : {}),
        ...(search.isActive !== "all"
          ? { isActive: search.isActive === "true" }
          : {}),
        ...(search.search ? { search: search.search } : {}),
      }),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        search: searchInput || undefined,
      }),
    });
  };

  const handleCategoryChange = (value: string) => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        category: value as z.infer<typeof coursesSearchSchema>["category"],
      }),
    });
  };

  const handleStatusChange = (value: string) => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        isActive: value as z.infer<typeof coursesSearchSchema>["isActive"],
      }),
    });
  };

  // Helper function to render course grid content
  const renderCourseGridContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!courses || courses.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="font-semibold text-lg">No courses found</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              {search.search ||
              search.category !== "ALL" ||
              search.isActive !== "true"
                ? "Try adjusting your filters to see more results."
                : "Get started by creating your first training course."}
            </p>
            {!search.search &&
              search.category === "ALL" &&
              search.isActive === "true" && (
                <Button asChild className="mt-4">
                  <Link to="/app/training/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Link>
                </Button>
              )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course: Course) => (
          <CourseCard course={course} key={course.id} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/app/training/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Training", href: "/app/training" },
          { label: "Courses" },
        ]}
        description="Manage GCMC training course catalog"
        title="Training Courses"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <form className="flex-1" onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search courses..."
                value={searchInput}
              />
            </div>
          </form>

          <Select onValueChange={handleCategoryChange} value={search.category}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="HUMAN_RESOURCES">Human Resources</SelectItem>
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

          <Select onValueChange={handleStatusChange} value={search.isActive}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course Grid */}
        {renderCourseGridContent()}
      </div>
    </div>
  );
}
