# GK-Nexus Architecture Diagram

This diagram illustrates the complete system architecture of GK-Nexus, showing the Turborepo monorepo structure, data flow, and external integrations.

## System Architecture

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Browser"
        Browser[Web Browser<br/>React 19 SPA]
    end

    %% Application Layer
    subgraph "Turborepo Monorepo"
        subgraph "Apps"
            Web[Web App<br/>apps/web<br/>Port: 3001<br/>Tech: Vite + React 19 + TanStack Router]
            Server[Server<br/>apps/server<br/>Port: 3000<br/>Tech: Hono + Bun Runtime]
            Docs[Documentation<br/>apps/docs<br/>Port: 4321<br/>Tech: Astro Starlight]
        end

        subgraph "Shared Packages"
            API[API Package<br/>packages/api<br/>oRPC Routers + Procedures]
            Auth[Auth Package<br/>packages/auth<br/>Better-Auth Configuration]
            DB[Database Package<br/>packages/db<br/>Drizzle ORM + Schema]
        end
    end

    %% Data Layer
    subgraph "Data Storage"
        PostgreSQL[(PostgreSQL 16<br/>Primary Database)]
        FileSystem[Local File System<br/>Uploaded Documents]
    end

    %% External Services
    subgraph "External Services"
        Resend[Resend API<br/>Email Delivery<br/>Portal Invites, Notifications]
        S3[S3-Compatible Storage<br/>Cloudflare R2<br/>Document Backups]
        GRA[GRA API<br/>Guyana Revenue Authority<br/>Tax Compliance - Phase 3]
        WhatsApp[WhatsApp Business<br/>Client Messaging<br/>Phase 3]
    end

    %% Data Flow - Client to Web App
    Browser -->|HTTPS Request<br/>Port 3001| Web
    Web -->|Serve Static Assets<br/>index.html + JS/CSS| Browser

    %% Data Flow - Web App to Server
    Browser -->|API Calls<br/>POST /rpc/[procedure]<br/>JSON-RPC-like Protocol| Server

    %% Data Flow - Server Internal Architecture
    Server -->|oRPC Handler<br/>Type-safe RPC| API
    Server -->|Authentication Middleware<br/>Session Management| Auth
    API -->|Database Queries<br/>Type-safe ORM| DB
    DB -->|SQL Queries| PostgreSQL
    Auth -->|Session Persistence<br/>User Management| PostgreSQL

    %% Document Upload/Download Flow
    Server -->|File Upload<br/>Document Storage| FileSystem
    Server -->|Cloud Backup<br/>Automated Sync| S3
    FileSystem -->|Serve Documents<br/>Secure Download| Server

    %% External Service Integrations
    Server -->|Send Emails<br/>Portal Invites, Reminders| Resend
    Server -->|Backup Database<br/>Scheduled + Manual| S3
    Server -.->|Tax API Integration<br/>Future Phase 3| GRA
    Server -.->|WhatsApp Messaging<br/>Future Phase 3| WhatsApp

    %% Documentation Access
    Browser -.->|Access Docs<br/>Port 4321<br/>Development Only| Docs

    %% Styling
    classDef appStyle fill:#3B82F6,stroke:#1E40AF,color:#fff
    classDef packageStyle fill:#8B5CF6,stroke:#6D28D9,color:#fff
    classDef dataStyle fill:#10B981,stroke:#059669,color:#fff
    classDef externalStyle fill:#F59E0B,stroke:#D97706,color:#fff
    classDef futureStyle fill:#6B7280,stroke:#4B5563,color:#fff,stroke-dasharray: 5 5

    class Web,Server,Docs appStyle
    class API,Auth,DB packageStyle
    class PostgreSQL,FileSystem dataStyle
    class Resend,S3 externalStyle
    class GRA,WhatsApp futureStyle
```

## Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Staff User
    participant Browser as Browser
    participant Server as Server (Hono)
    participant Auth as Better-Auth
    participant DB as PostgreSQL

    %% Login Flow
    User->>Browser: Enter email/password
    Browser->>Server: POST /api/auth/sign-in
    Server->>Auth: Validate credentials
    Auth->>DB: Query user + staff tables
    DB-->>Auth: User record + staff profile
    Auth->>Auth: Verify password hash
    Auth->>DB: Create session record
    DB-->>Auth: Session created
    Auth-->>Server: Session token + user data
    Server-->>Browser: Set httpOnly cookie + JSON response
    Browser->>Browser: Store user state
    Browser-->>User: Redirect to /app/dashboard

    Note over Browser,Server: Subsequent Requests

    User->>Browser: Access protected route
    Browser->>Server: API request + session cookie
    Server->>Auth: Validate session
    Auth->>DB: Query session + user
    DB-->>Auth: Valid session
    Auth-->>Server: User + staff context
    Server->>Server: Check staff permissions
    Server-->>Browser: Protected data
    Browser-->>User: Render UI
```

## Document Upload/Download Flow

```mermaid
sequenceDiagram
    autonumber
    participant Staff as Staff User
    participant Browser as Browser
    participant Server as Server
    participant DB as PostgreSQL
    participant FS as File System
    participant S3 as S3 Storage

    %% Upload Flow
    Staff->>Browser: Select file + metadata
    Browser->>Server: POST /rpc/documents.upload<br/>FormData + clientId/matterId
    Server->>Server: Validate file type + size
    Server->>Server: Generate UUID filename
    Server->>FS: Save file to uploads/documents/
    FS-->>Server: File saved
    Server->>DB: Insert document record
    DB-->>Server: Document ID
    Server->>S3: Queue backup job (async)
    Server-->>Browser: Success + document metadata
    Browser-->>Staff: Show success message

    Note over S3: Background Backup Process

    S3->>S3: Scheduled backup job runs
    S3->>FS: Read document files
    FS-->>S3: File stream
    S3->>S3: Upload to R2 bucket
    S3->>DB: Update isBackedUp = true
    DB-->>S3: Updated

    %% Download Flow
    Staff->>Browser: Click download button
    Browser->>Server: GET /rpc/documents.download?id=xxx
    Server->>DB: Query document record
    DB-->>Server: Document metadata + file path
    Server->>Server: Check permissions (staff/client access)
    Server->>FS: Read file
    FS-->>Server: File stream
    Server->>DB: Log download activity
    Server-->>Browser: File stream + headers
    Browser-->>Staff: Browser download prompt
```

## Technology Stack

### Frontend (Web App)
- **Framework**: React 19 with function components
- **Routing**: TanStack Router (file-based routing)
- **Build Tool**: Vite (fast HMR, ESM-native)
- **API Client**: oRPC client (type-safe RPC calls)
- **State Management**: TanStack Query (server state) + React hooks (local state)
- **UI Components**: shadcn/ui (Tailwind CSS + Radix UI)
- **Forms**: React Hook Form + Zod validation

### Backend (Server)
- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Hono (lightweight web framework)
- **API Layer**: oRPC (type-safe RPC with automatic client generation)
- **Authentication**: Better-Auth (session-based with PostgreSQL)
- **ORM**: Drizzle ORM (type-safe SQL query builder)
- **Validation**: Zod schemas
- **File Uploads**: Multipart form handling

### Database
- **Primary DB**: PostgreSQL 16
- **Schema Management**: Drizzle migrations
- **Connection Pooling**: Built-in Bun PostgreSQL driver

### Infrastructure
- **Monorepo**: Turborepo (build caching, task orchestration)
- **Package Manager**: Bun (fast install, workspaces)
- **Containerization**: Docker + Docker Compose
- **Code Quality**: Ultracite (Biome-based linting/formatting)

### External Integrations
- **Email**: Resend API
- **Storage**: Cloudflare R2 (S3-compatible)
- **Future**: GRA API, WhatsApp Business

## Deployment Architecture

```mermaid
graph LR
    subgraph "Production Environment"
        Nginx[Nginx Reverse Proxy<br/>SSL Termination<br/>Rate Limiting]

        subgraph "Application Container"
            Server[Bun Server<br/>Port 3000<br/>Health Check: /health]
            Static[Static Assets<br/>Web App Build<br/>Served by Hono]
        end

        subgraph "Data Layer"
            DB[(PostgreSQL<br/>Persistent Volume)]
            Files[Document Storage<br/>Volume Mount]
        end

        subgraph "Monitoring"
            Logs[Application Logs<br/>JSON Format]
            Health[Health Checks<br/>Docker + Nginx]
        end
    end

    Internet[Internet] --> Nginx
    Nginx --> Server
    Nginx --> Static
    Server --> DB
    Server --> Files
    Server --> Logs
    Health --> Server

    classDef proxyStyle fill:#60A5FA,stroke:#2563EB,color:#fff
    classDef appStyle fill:#34D399,stroke:#059669,color:#fff
    classDef dataStyle fill:#FBBF24,stroke:#D97706,color:#000
    classDef monitorStyle fill:#A78BFA,stroke:#7C3AED,color:#fff

    class Nginx proxyStyle
    class Server,Static appStyle
    class DB,Files dataStyle
    class Logs,Health monitorStyle
```

## Security Model

### Authentication Layers

1. **Staff Authentication**: Better-Auth with password hashing (bcrypt)
2. **Client Portal**: Separate portal user system with invite tokens
3. **Session Management**: Secure httpOnly cookies, 30-minute inactivity timeout
4. **Password Setup**: Token-based onboarding for new staff members

### Authorization Model

| Role | Permissions |
|------|-------------|
| OWNER | Full system access, all businesses |
| GCMC_MANAGER | Full GCMC access, staff management |
| KAJ_MANAGER | Full KAJ access, staff management |
| STAFF_GCMC | GCMC client/matter access (view/edit) |
| STAFF_KAJ | KAJ client/matter access (view/edit) |
| STAFF_BOTH | Both GCMC + KAJ access |
| RECEPTIONIST | Read-only access, appointment scheduling |

### Data Isolation

- Business-level isolation (GCMC vs KAJ)
- Role-based access control (RBAC) at API layer
- Client portal users limited to own data only
- Staff impersonation logging for audit trail

## Performance Characteristics

- **Build Time**: <5 minutes (with Docker BuildKit caching)
- **Image Size**: <300MB (optimized with Turbo prune)
- **Cold Start**: <60 seconds (container startup)
- **Hot Reload**: <200ms (Vite HMR in development)
- **API Response**: <100ms average (database queries)
- **Health Check**: <1 second response time

## Backup Strategy

1. **Database Backups**: Automated daily backups to S3 (retention: 30 days)
2. **Document Backups**: Asynchronous sync to Cloudflare R2
3. **Manual Backups**: Staff-initiated backups before major changes
4. **Restore**: Complete system restore from backup archives

---

**Last Updated**: 2025-01-15
**Maintained By**: Development Team
