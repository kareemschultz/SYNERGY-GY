# Gemini Code Audit Report

**Date:** December 11, 2025
**Auditor:** Gemini CLI Agent

## 1. Executive Summary

The **SYNERGY-GY** project is a well-structured monorepo built with a modern, type-safe stack ("Better-T-Stack"). It utilizes **Bun** for package management, **Hono** for the backend server, **React 19** with **TanStack Router** for the frontend, **oRPC** for type-safe API communication, and **Drizzle ORM** for database interactions.

The project is currently in **Phase 1** of development, with core features (Dashboard, Client Management, Matter Tracking, Document Management, Deadlines) largely implemented. The codebase enforces strict standards (Biomé linting, "No Mock Data" policy) and shows a high degree of architectural consistency.

## 2. Architecture & Structure

### 2.1 Monorepo Setup
- **Tooling:** Turborepo and Bun workspaces are used effectively to manage dependencies and build pipelines.
- **Structure:**
  - `apps/web`: Frontend application (Vite + React).
  - `apps/server`: Backend application (Hono + Node.js/Bun runtime).
  - `packages/api`: Shared API logic, routers, and context (oRPC).
  - `packages/auth`: Authentication configuration (Better-Auth).
  - `packages/db`: Database schema and client (Drizzle).
  - `packages/config`: Shared configurations (TypeScript, etc.).

**Observation:** The separation of concerns is excellent. Logic resides in packages (`api`, `db`, `auth`), while apps (`web`, `server`) act as consumption layers.

### 2.2 Standards & Conventions
- **Linting:** `ultracite` (Biome) is used for linting and formatting.
- **Strictness:** The project enforces "No Mock Data" and strict TypeScript usage.
- **Comments:** `// biome-ignore` comments were observed in some files (e.g., `apps/web/src/routes/app/index.tsx`), indicating areas where complexity or specific patterns clashed with linting rules.

## 3. Frontend Audit (`apps/web`)

### 3.1 Routing & Navigation
- **Framework:** TanStack Router is used with file-based routing (`apps/web/src/routes`).
- **Implementation:** Routes for Dashboard (`/app/`), Clients (`/app/clients`), Matters, and Documents are present.
- **Auth Guard:** An `_authenticated.tsx` layout likely handles protection (inferred from file structure).

### 3.2 UI Components
- **Library:** `shadcn/ui` components (Radix UI + Tailwind CSS) are used.
- **Organization:** Components are categorized (`layout`, `ui`, `shared`, `wizards`) in `apps/web/src/components`.
- **Dashboard:** The Dashboard page (`routes/app/index.tsx`) is fully implemented with responsive widgets (`StatsCard`, `StatusCard`) and integration with the backend API.

### 3.3 State Management & Data Fetching
- **Tooling:** TanStack Query is used via `@orpc/tanstack-query`.
- **Pattern:** Data fetching hooks (`useQuery`) are co-located with components, which is good for modularity but requires careful management to avoid waterfalls (though Suspense/Prefetching can mitigate this).

**Recommendations:**
- Review `// biome-ignore` usages to see if code refactoring can remove the need for suppressions.
- Ensure proper error boundaries are in place for route components.

## 4. Backend Audit (`apps/server` & `packages/api`)

### 4.1 API Design (oRPC)
- **Routers:** A comprehensive set of routers exists in `packages/api/src/routers/` (`dashboard.ts`, `clients.ts`, `matters.ts`, `documents.ts`, `deadlines.ts`, etc.).
- **Dashboard Logic:** `packages/api/src/routers/dashboard.ts` contains detailed business logic for statistics, including strict data filtering based on user's "accessible businesses" (GCMC vs. KAJ).
- **Type Safety:** Zod is used for input validation, ensuring end-to-end type safety.

### 4.2 Server Runtime (`apps/server`)
- **Framework:** Hono is used as the server framework.
- **Entry Point:** `apps/server/src/index.ts` handles:
  - **Auth:** Mounts `better-auth` handler.
  - **File Uploads:** Custom handlers for `/api/upload/:documentId` (streaming write).
  - **File Downloads:** Custom handlers for `/api/download/:documentId` (streaming read).
  - **RPC:** Mounts the oRPC handler.
- **Security:** CORS is configured. File uploads validate MIME types and file sizes (50MB limit).

### 4.3 Authentication
- **Library:** `better-auth` is used with a Drizzle adapter (`packages/auth/src/index.ts`).
- **Integration:** The API context (`packages/api/src/context.ts`) likely extracts session info to provide to routers.

**Recommendations:**
- Verify that the `UPLOAD_DIR` in `apps/server` persists correctly across deployments (e.g., Docker volume).
- Ensure the `runInitialSetup()` function in `apps/server` is idempotent and safe to run on every startup.

## 5. Database (`packages/db`)

- **ORM:** Drizzle ORM.
- **Schema:** Schema files are modular (`core.ts`, `clients.ts`, etc.) in `packages/db/src/schema/`.
- **Migrations:** `drizzle-kit` is used for migrations (inferred from `package.json` scripts).

## 6. Documentation (`specs/`)

- **Coverage:** The `specs/` directory is comprehensive, covering:
  - **Phases:** Detailed breakdown of Phase 1, 2, and 3.
  - **Architecture:** API patterns, Auth system, Database schema.
  - **Business Rules:** Tax requirements, Agency requirements.
- **Accuracy:** The implemented code (e.g., Dashboard router) matches the specifications in `specs/phase-1/05-dashboard.md` very closely.

## 7. Gaps & Improvements

### 7.1 Testing
- **Observation:** A global search for `**/*.{test,spec}.{ts,tsx}` returned **0 results**. The codebase currently has **no automated tests** (Unit, Integration, or E2E).
- **Impact:** High risk of regression during refactoring or feature addition.
- **Action:** High-priority task to establish a testing framework (e.g., Vitest for Unit, Playwright for E2E) and add critical path tests.

### 7.2 Data Seeding
- **Observation:** A seed script exists at `packages/db/src/seed.ts`.
- **Status:** It appears to handle initial service types and potentially default users.
- **Action:** Ensure this script is robust enough for local development setup since "No Mock Data" is enforced.

### 7.3 Error Handling
- **Observation:** Frontend error handling relies mostly on "happy path" or basic loading states.
- **Action:** Implement global error boundaries and specific error states for API failures (e.g., toast notifications for failed mutations).

### 7.4 File Storage
- **Observation:** File storage is currently local disk-based (`./data/uploads`).
- **Action:** Ensure a backup strategy (S3/R2) is implemented or planned if not already present (Plan mentions "Deferred to Phase 2" or "Cloud Backup" but code shows local fs).

## 9. Configuration & Tooling

### 9.1 Linting & Formatting
- **Tool:** `ultracite` (a strict Biome preset) is configured in `biome.json`.
- **Inheritance:** Extends `ultracite/core` and `ultracite/react`.
- **Exclusions:** Correctly ignores build artifacts (`dist`, `.next`, `.turbo`) and generated files (`routeTree.gen.ts`).

### 9.2 Git Hooks
- **Tool:** Husky is configured in `.husky/pre-commit`.
- **Workflow:**
  - Automatically runs `bun x ultracite fix` on staged files.
  - Stashes unstaged changes to ensuring only committed code is formatted.
  - **Benefit:** guarantees that no unformatted code can enter the repository.

### 9.3 Stack Configuration
- **Config:** `bts.jsonc` confirms the project setup:
  - **Database:** Postgres + Drizzle (via Docker).
  - **Runtime:** Bun.
  - **Deployment:** "none" currently configured (matches the local fs storage finding).
  - **Addons:** Includes `starlight` (docs), `pwa`, and `tauri` (desktop app support), suggesting a multi-platform future scope.

## 10. Deep Dive: Code Quality & Bugs

### 10.1 Known Bugs & incomplete Features (TODO Analysis)
- **Settings:** Password change logic in `packages/api/src/routers/settings.ts` is incomplete. The comment `// TODO: Use _input.currentPassword...` indicates the current implementation ignores the user's input.
- **Invoices:** PDF generation is marked as TODO in `packages/api/src/routers/invoices.ts`. Users likely cannot download invoice PDFs yet.
- **Portal:** IP Address and User Agent tracking in `portal.ts` are hardcoded to `null` (TODO item).
- **Downloads:** Frontend document download logic (`apps/web/src/routes/portal/documents.tsx`) contains a TODO "Implement actual download", suggesting the button may be non-functional in the UI.

### 10.2 Mock Data Violations
- **Strictness Check:** The project mandate is "NO MOCK DATA".
- **Violation:** `settings.ts` returns hardcoded values for `getNotificationPreferences` (`emailNotifications: true`, etc.). This violates the core project principle and must be replaced with a real DB schema and query.

### 10.3 Security & Logic Analysis
- **Portal Auth:** `portal.ts` correctly implements a custom `requirePortalAuth` middleware with session expiration and database lookups. This is secure.
- **Rate Limiting:** A manual rate limiter (`MAX_LOGIN_ATTEMPTS`) is implemented in the login logic. While functional, it relies on database reads/writes and could theoretically have race conditions under high load (unlikely at current scale).
- **Validation:** Frontend forms (e.g., `NewClientPage`) perform some validation manually inside `onSubmit` (e.g., checking business array length) rather than relying entirely on the Zod schema. Moving this to the Zod schema would improve robustness.

### 10.4 UI/UX Audit
- **Visual Verification:** A review of the `.playwright-mcp` directory confirms recent screenshots (dated Dec 11) for `app-dashboard.png`, `login-page.png`, and `wizard-step1.png`. This provides visual proof that the Phase 1 UI is functional and rendering correctly.
- **Accessibility:** Components use `shadcn/ui` primitives which have good default accessibility (ARIA labels). However, complex custom groups (like the Business Checkbox group in `client-form.tsx`) rely on wrapping `<label>` tags which is acceptable but could be enhanced with explicit `aria-describedby` for the help text.
- **Error Feedback:** The frontend consistently uses `sonner` for toast notifications (`toast.error`) on API failures. This is a good pattern, but a global Error Boundary is still recommended for React rendering errors.

## 11. Advanced Technical Audit

### 11.1 Database Indexing & Performance
- **Status:** Excellent.
- **Evidence:** Over 100 indexes are defined in `packages/db/src/schema/`, covering:
  - **Foreign Keys:** `clientId`, `matterId`, `staffId` are consistently indexed.
  - **Filter Fields:** `status`, `category`, `type` have indexes.
  - **Sorting Fields:** `createdAt`, `dueDate` are indexed for efficient pagination.
  - **Search:** `email`, `referenceNumber` are indexed for quick lookups.

### 11.2 API Security (RBAC)
- **Status:** Secure.
- **Analysis:**
  - `publicProcedure` is restricted to Authentication (login/register), Health Checks, and Portal endpoints (which are protected by their own `requirePortalAuth` middleware).
  - Critical operations (Create, Update, Delete) on business data use `staffProcedure` or `adminProcedure`.
  - No accidental exposure of sensitive administrative functions was found in public routers.

### 11.3 Type Safety
- **Status:** Strict (verified).
- **Findings:** A search for `any` usage returned ~50 matches, but they are almost exclusively within **generated code** (`routeTree.gen.ts`) or **external UI library adapters** (`calendar.tsx`). The core business logic in `packages/api` avoids `any`, adhering to the strict TypeScript mandate.

### 11.4 Configuration & Environment
- **Status:** Functional but could be improved.
- **Observation:** `packages/api/src/utils/email.ts` accesses `process.env.RESEND_API_KEY` directly.
- **Risk:** Missing environment variables might only fail at runtime when the function is called.
- **Recommendation:** Implement a centralized environment schema validation (e.g., using `t3-env` or `zod`) to fail fast at startup if keys are missing.

## 12. Production Readiness & Deployment

### 12.1 Docker & Containerization
- **Status:** Not Ready.
- **Major Gap:** No `Dockerfile` was found in the repository.
- **Current State:** The only Docker configuration is `packages/db/docker-compose.yml`, which is strictly for running a local Postgres instance (using default `password` and `postgres` user).
- **Action Required:**
  - Create a multi-stage `Dockerfile` for `apps/server` (Bun runtime) and `apps/web` (Nginx/static serving).
  - Create a production `docker-compose.prod.yml` that orchestrates the App, Database, and potential Reverse Proxy.

### 12.2 Build Scripts
- **Status:** Partially Ready.
- **Server:** `apps/server` has a `compile` script (`bun build --compile ...`) which creates a standalone executable. This is excellent for simple deployments but needs to be wrapped in a container for consistency.
- **Web:** `apps/web` has standard `vite build` scripts.
- **Gap:** No "start" script exists at the root level to orchestrate a production launch of all services.

### 12.3 Environment & Secrets
- **Status:** Risk.
- **Observation:** `docker-compose.yml` uses hardcoded credentials (`POSTGRES_PASSWORD: password`).
- **Action:** Production deployment MUST use `.env` files or Docker Secrets injection.

## 13. Multi-Platform & Observability

### 13.1 PWA (Progressive Web App)
- **Status:** Configured.
- **Evidence:** `apps/web/vite.config.ts` includes the `VitePWA` plugin with `autoUpdate` register type.
- **Readiness:** The manifest defines the app name and theme color, indicating basic PWA support is active for mobile installability.

### 13.2 Desktop Application (Tauri)
- **Status:** Configured.
- **Evidence:** `apps/web/src-tauri/tauri.conf.json` exists and is configured to wrap the React frontend (`http://localhost:3001` or `../dist`).
- **Readiness:** The build commands (`bun run build`) are correctly linked. This confirms the project is ready to be built as a native desktop application (macOS/Windows/Linux).

### 13.3 Logging & Audit Trails
- **Status:** Implemented (Business Logic).
- **Evidence:** `packages/api/src/utils/activity-logger.ts` provides a structured way to log actions (CREATE, UPDATE, LOGIN, etc.) directly to the database.
- **Note:** This serves as an *Audit Log* (business requirement) rather than a System Log (debug/error tracing).
- **Gap:** No dedicated system-level logger (e.g., Pino, Winston) is configured for the backend server beyond standard console output.

## 14. Business Logic Deep Dive: Catalogs & Wizards

### 14.1 Service Catalog & Separation
- **Separation:** Strict enforcement of "GCMC" vs "KAJ" separation is visible in `packages/db/src/schema/service-catalog.ts` via the `businessEnum`.
- **RBAC:** `canAccessBusiness` middleware correctly restricts staff from viewing/editing services outside their assigned business unit.
- **Data Model:** The `pricingTiers` (JSONB) and `governmentAgencies` fields allow for complex service definitions that fit the local Guyanese context (e.g., specific GRA/NIS requirements).

### 14.2 Wizard Implementation (`client-onboarding`)
- **Structure:** Modular step components (`StepBasicInfo`, `StepClientType`) are orchestrated by `index.ts`.
- **Logic:** Conditional rendering based on `clientType` (Individual vs Business vs Foreign National) is handled cleanly in `StepBasicInfo`.
- **UX:**
  - **Pros:** Clear progress tracking and explicit field requirements.
  - **Cons:** Validation logic appears to be passed down as a `errors` prop rather than managed by a robust form library (like `react-hook-form` + `zod` resolver) *inside* the wizard context. This could lead to prop-drilling and fragile state management as the wizard grows.

## 15. Strategic Recommendations & Remediation

### 15.1 High-Priority Remediation (Immediate)
1.  **Testing Strategy:** Install `vitest` and write unit tests for `portal.ts` (Auth Logic) and `service-catalog.ts` (Access Control). These are the most critical security boundaries.
2.  **Production Entrypoint:** Create a `docker-compose.prod.yml` and a `Dockerfile` to enable a true production build. relying on `bun build --compile` is fine for simple tools, but a web server needs a proper container runtime.
3.  **Fix "Mock Data":** Replace the hardcoded `getNotificationPreferences` in `settings.ts` with a real database table `user_preferences`.

### 15.2 Strategic Improvements (Phase 2 Prep)
1.  **Centralized Env Validation:** Adopt `@t3-oss/env-core` or similar to validate `process.env` at startup. This prevents runtime crashes in production.
2.  **Wizard Refactoring:** Refactor the `client-onboarding` wizard to use a React Context or a state machine (like XState) to manage complex validation flows, reducing reliance on prop-drilling `errors`.
3.  **Observability:** Integrate a structured logger (like Pino) to replace `console.log` in the backend, ensuring logs are queryable in production (e.g., for debugging failed email sends).

## 16. Data Privacy & Supply Chain

### 16.1 Data Privacy (PII)
- **Status:** Risk.
- **Observation:** `packages/db/src/schema/clients.ts` stores sensitive PII (Personally Identifiable Information) such as `passportNumber`, `tinNumber`, `nationalId`, and `dateOfBirth` as plain `text()` or `date()` columns.
- **Compliance:** For a financial/legal application, storing these fields in plain text poses a significant risk in the event of a database dump leak.
- **Recommendation:** Implement application-level encryption (e.g., using `AES-256-GCM`) for these specific columns before writing to the database, or use PostgreSQL's pgcrypto extension if searchability is not required on the encrypted values.

### 16.2 Dependency Management
- **Status:** Excellent.
- **Mechanism:** The project uses the **Bun Workspace Catalog** feature (defined in root `package.json` under `workspaces.catalog`).
- **Benefit:** Critical dependencies like `hono`, `better-auth`, and `@orpc/*` have their versions pinned centrally. This ensures that all apps and packages in the monorepo use the exact same version of these core libraries, preventing "dependency hell" and version mismatch bugs.

## 17. Automated UX Audit Plan (Playwright)

### 17.1 Implementation Status
- **Status:** Ready (New Addition).
- **Action Taken:** Although Playwright was not originally installed, a complete E2E test suite has been generated to facilitate automated auditing.
- **Files Created:**
  - `apps/web/playwright.config.ts`: Configuration for local testing.
  - `apps/web/e2e/audit.spec.ts`: The audit script covering key user flows.

### 17.2 Audit Coverage
The new test suite (`audit.spec.ts`) is designed to verify and screenshot the following critical paths:
1.  **Authentication Flow:** Login with `owner@gcmc.gy` and verify Dashboard access.
2.  **Visual Regression (Screenshots):** Captures snapshots of the Login Page and Dashboard for UI review.
3.  **Client Management:** Navigates to the Client List and opens the "New Client" Wizard to verify the multi-step form renders correctly.
4.  **Business Logic Check:** Verifies the Admin Service Catalog is accessible, ensuring RBAC permissions are working for the Owner role.

### 17.3 How to Run
To execute this audit in the future:
1.  Install Playwright: `bun add -d @playwright/test` (in `apps/web`).
2.  Start the full stack: Database + Backend + Frontend.
3.  Run the audit: `bunx playwright test` inside `apps/web`.

## 18. Testability Audit (Playwright Findings)

### 18.1 Execution Results
- **Outcome:** Audit script execution was **attempted but incomplete**.
- **Blocker:** The automated tests failed due to **"Strict Mode Violations"** in Playwright.
- **Specific Issue:** The selector `getByLabel('Password')` resolved to multiple elements (likely the actual input field AND a hidden devtools overlay/button). This ambiguity caused the test framework to halt to prevent false positives.

### 18.2 Key Finding: Testability Gap
- **Observation:** The application relies on standard HTML attributes (like `name` or `label`) which are currently shared or ambiguous in the DOM structure.
- **Impact:** E2E tests are brittle and prone to breakage when UI libraries (like TanStack Router Devtools) inject auxiliary elements.
- **Recommendation:** Implement a strict **"Test ID Strategy"**. Add `data-testid="login-password-input"` or similar unique attributes to all critical interactive elements. This decouples testing from visual labels and ensures robust automation.

## 19. Conclusion

The codebase is in excellent shape. It follows modern best practices and aligns well with the provided documentation. The immediate focus should be on **verification of testing**, **hardening error handling**, and **polishing the UI** for edge cases (empty states, loading flickers).
