/**
 * CourseCard Component
 *
 * Displays a training course summary card with key information
 * and actions for course management.
 */

import { Link } from "@tanstack/react-router";
import { Calendar, Clock, DollarSign, Users } from "lucide-react";
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

type CourseCardProps = {
  course: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    duration: number;
    maxParticipants: number;
    price: number;
    isActive: boolean;
    scheduleCount: number;
  };
};

const CATEGORY_LABELS: Record<string, string> = {
  HUMAN_RESOURCES: "Human Resources",
  CUSTOMER_RELATIONS: "Customer Relations",
  BUSINESS_DEVELOPMENT: "Business Development",
  COMPLIANCE: "Compliance",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  HUMAN_RESOURCES: "bg-blue-100 text-blue-800",
  CUSTOMER_RELATIONS: "bg-green-100 text-green-800",
  BUSINESS_DEVELOPMENT: "bg-purple-100 text-purple-800",
  COMPLIANCE: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function CourseCard({ course }: CourseCardProps) {
  const priceInDollars = (course.price / 100).toFixed(2);

  return (
    <Card className={course.isActive ? "" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{course.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {course.description}
            </CardDescription>
          </div>
          <div className="ml-4 flex flex-col gap-2">
            <Badge
              className={
                CATEGORY_COLORS[course.category] || CATEGORY_COLORS.OTHER
              }
            >
              {CATEGORY_LABELS[course.category] || course.category}
            </Badge>
            {!course.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{course.duration} hours</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Max {course.maxParticipants} participants</span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${priceInDollars} GYD</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {course.scheduleCount}{" "}
              {course.scheduleCount === 1 ? "schedule" : "schedules"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link
            params={{ courseId: course.id }}
            to="/app/training/courses/$courseId"
          >
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
