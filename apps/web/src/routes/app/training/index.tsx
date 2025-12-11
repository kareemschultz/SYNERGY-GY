/**
 * Training Course List Page
 *
 * Displays all training courses with search and filter capabilities.
 * Allows GCMC staff to browse the course catalog and manage offerings.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
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
import { orpc } from "@/utils/orpc";

const trainingSearchSchema = z.object({
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

export const Route = createFileRoute("/app/training/")({
  validateSearch: trainingSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const filters = {
      ...(deps.category && deps.category !== "ALL"
        ? { category: deps.category }
        : {}),
      ...(deps.isActive !== "all"
        ? { isActive: deps.isActive === "true" }
        : {}),
      ...(deps.search ? { search: deps.search } : {}),
    };

    const courses = await orpc.training.courses.list.query(filters);
    return { courses };
  },
  component: TrainingPage,
});

function TrainingPage() {
  const { courses } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const [searchInput, setSearchInput] = useState(search.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: (prev) => ({
        ...prev,
        search: searchInput || undefined,
      }),
    });
  };

  const handleCategoryChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        category: value as z.infer<typeof trainingSearchSchema>["category"],
      }),
    });
  };

  const handleStatusChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        isActive: value as z.infer<typeof trainingSearchSchema>["isActive"],
      }),
    });
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Training Courses
          </h1>
          <p className="text-muted-foreground">
            Manage GCMC training catalog and schedules
          </p>
        </div>
        <Button asChild>
          <Link to="/app/training/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
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

      {courses.length === 0 ? (
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
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} />
          ))}
        </div>
      )}
    </div>
  );
}
