---
name: react-component
description: Create React components with Shadcn/UI, TanStack Query, and TypeScript. Use when building UI components, forms, lists, cards, or frontend pages. Triggers on: component, React, UI, form, frontend, page, Shadcn.
---

# React Component Development

## Locations
- Components: `apps/web/src/components/`
- Routes/Pages: `apps/web/src/routes/`
- UI Primitives: `apps/web/src/components/ui/` (Shadcn)

## Data Fetching Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";

export function MyComponent() {
  const queryClient = useQueryClient();

  // Query (GET)
  const { data, isLoading, error, refetch } = useQuery(
    orpc.myRouter.list.query({
      limit: 20,
      page: 1,
    })
  );

  // Mutation (POST/PUT/DELETE)
  const createMutation = useMutation({
    mutationFn: (input: CreateInput) => client.myRouter.create(input),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["myRouter"] });
      toast.success("Created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create");
    },
  });

  // Use mutation
  const handleCreate = (values: CreateInput) => {
    createMutation.mutate(values);
  };
}
```

## Component States Pattern

```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function MyList() {
  const { data, isLoading, error } = useQuery(
    orpc.myRouter.list.query({})
  );

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Error: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Empty State (CRITICAL - never use mock data!)
  if (!data?.items.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No items found.</p>
          <p className="text-sm mt-1">Create your first item to get started.</p>
        </CardContent>
      </Card>
    );
  }

  // 4. Data State
  return (
    <div className="space-y-4">
      {data.items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Form Pattern (React Hook Form + Zod)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. Define schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof formSchema>;

// 2. Component
export function MyForm({
  onSubmit,
  defaultValues,
  isLoading,
}: {
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<FormValues>;
  isLoading?: boolean;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
      status: "ACTIVE",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Text Input */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Input */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormDescription>We'll never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Textarea */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Select */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
```

## Common UI Components

```typescript
// Imports from @/components/ui/
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons from lucide-react
import { Plus, Pencil, Trash2, MoreHorizontal, Search, Filter, AlertCircle, Check, X } from "lucide-react";

// Toast notifications
import { toast } from "sonner";
toast.success("Success message");
toast.error("Error message");
toast.info("Info message");
```

## Status Badge Pattern

```typescript
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={statusColors[status] || "bg-gray-100"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
```

## Dialog Pattern

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    toast.success("Created successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Item</DialogTitle>
          <DialogDescription>
            Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <MyForm onSubmit={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
```

## Critical Rules

1. **NEVER use mock/fake data** - Always fetch from API or show empty state
2. **ALWAYS handle loading states** - Use Skeleton components
3. **ALWAYS handle error states** - Show user-friendly error messages
4. **ALWAYS handle empty states** - Explain what to do next
5. **Use Shadcn UI components** - Import from `@/components/ui/`
6. **Use sonner for toasts** - `import { toast } from "sonner"`
7. **Use TanStack Query** - For all data fetching
8. **Use React Hook Form + Zod** - For all forms
