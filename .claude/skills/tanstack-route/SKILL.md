---
name: tanstack-route
description: Create TanStack Router routes with file-based routing, loaders, and authentication. Use when building pages, navigation, route protection, or data loading. Triggers on: route, page, navigation, TanStack Router, loader, redirect.
---

# TanStack Router Development

## Location
All routes in `apps/web/src/routes/`

## Route Structure
```
routes/
├── __root.tsx           # Root layout (providers, error boundary)
├── index.tsx            # Home page (/)
├── login.tsx            # Login page (/login)
├── app.tsx              # Staff app layout (/app) - PROTECTED
├── app/
│   ├── index.tsx        # Staff dashboard (/app)
│   ├── clients.tsx      # Client list (/app/clients)
│   ├── clients/
│   │   ├── $client-id.tsx   # Client detail (/app/clients/:clientId)
│   │   └── new.tsx          # New client (/app/clients/new)
│   └── settings.tsx     # Settings (/app/settings)
├── portal.tsx           # Client portal layout (/portal) - PROTECTED
└── portal/
    ├── index.tsx        # Portal dashboard (/portal)
    └── documents.tsx    # Portal documents (/portal/documents)
```

## Basic Route

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/my-page")({
  component: MyPage,
});

function MyPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold">My Page</h1>
    </div>
  );
}
```

## Protected Route (Staff)

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/login" });
    }
    return { session: session.data };
  },
});

function AppLayout() {
  const { session } = Route.useRouteContext();
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

## Dynamic Route (with params)

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// File: $client-id.tsx
// URL: /app/clients/:clientId
export const Route = createFileRoute("/app/clients/$client-id")({
  component: ClientDetail,
});

function ClientDetail() {
  // Access params (note: use kebab-case from filename)
  const { "client-id": clientId } = Route.useParams();

  const { data, isLoading } = useQuery(
    orpc.clients.getById.query({ id: clientId })
  );

  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <NotFound />;

  return <ClientDetailView client={data} />;
}
```

## Route with Loader (prefetch data)

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/clients/$client-id")({
  component: ClientDetail,
  loader: async ({ params }) => {
    // Prefetch data before component renders
    const clientData = await client.clients.getById({
      id: params["client-id"],
    });
    return { clientData };
  },
});

function ClientDetail() {
  // Access loader data
  const { clientData } = Route.useLoaderData();

  return <ClientDetailView client={clientData} />;
}
```

## Route with Search Params

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Define search params schema
const searchSchema = z.object({
  page: z.number().default(1),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "all"]).default("all"),
});

export const Route = createFileRoute("/app/clients")({
  component: ClientList,
  validateSearch: searchSchema,
});

function ClientList() {
  // Access validated search params
  const { page, search, status } = Route.useSearch();

  // Navigate with search params
  const navigate = Route.useNavigate();

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, search, status } });
  };

  return (/* ... */);
}
```

## Layout Route

```typescript
// app.tsx - Layout for all /app/* routes
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/header";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <Outlet /> {/* Child routes render here */}
        </main>
      </div>
    </div>
  );
}
```

## Navigation

```typescript
import { Link, useNavigate } from "@tanstack/react-router";

// Declarative link
<Link
  to="/app/clients/$client-id"
  params={{ "client-id": client.id }}
  className="hover:underline"
>
  {client.name}
</Link>

// Programmatic navigation
const navigate = useNavigate();

// Simple navigation
navigate({ to: "/app/clients" });

// With params
navigate({
  to: "/app/clients/$client-id",
  params: { "client-id": clientId },
});

// With search params
navigate({
  to: "/app/clients",
  search: { page: 1, status: "ACTIVE" },
});

// Replace history (no back button)
navigate({ to: "/app", replace: true });
```

## Route Naming Convention

| File Name | URL Path | Param Access |
|-----------|----------|--------------|
| `index.tsx` | `/` (index of parent) | - |
| `clients.tsx` | `/clients` | - |
| `$client-id.tsx` | `/clients/:clientId` | `params["client-id"]` |
| `$id.tsx` | `/:id` | `params.id` |
| `new.tsx` | `/new` | - |
| `_layout.tsx` | (layout only, no URL) | - |

## Critical Rules

1. **Use kebab-case for dynamic routes** - `$client-id.tsx` not `$clientId.tsx`
2. **Access params with bracket notation** - `params["client-id"]`
3. **Protect routes with beforeLoad** - Check auth before rendering
4. **Use Outlet for layouts** - Child routes render inside Outlet
5. **Validate search params** - Use Zod schema with `validateSearch`
6. **Regenerate route tree** - Run `bun run dev` after adding routes
