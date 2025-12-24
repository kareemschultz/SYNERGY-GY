# API Endpoints Reference

Auto-generated from `packages/api/src/routers/`

**Generated:** 2025-12-24

---


## activity

- `list: adminProcedure`
- `getByEntity: staffProcedure`
- `getRecent: staffProcedure`
- `getStats: adminProcedure`

## admin

- `list: adminProcedure.input(listStaffSchema).handler(async ({ input }) => {`
- `getById: adminProcedure`
- `create: adminProcedure`
- `update: adminProcedure`
- `toggleActive: adminProcedure`
- `stats: adminProcedure.handler(async () => {`
- `resendSetupLink: adminProcedure`
- `resetPassword: adminProcedure`
- `checkPasswordStatus: adminProcedure`

## aml-compliance

- `calculateRiskScore: staffProcedure`
- `createAssessment: staffProcedure`
- `getAssessment: staffProcedure`
- `getAssessmentHistory: staffProcedure`
- `approveAssessment: adminProcedure`
- `getPendingReviews: adminProcedure`
- `getClientsRequiringReview: staffProcedure`
- `screenSanctions: staffProcedure`

## analytics

- `getKPIs: staffProcedure.handler(async ({ context }) => {`
- `getMonthlyTrends: staffProcedure`
- `getMattersByCategory: staffProcedure.handler(async ({ context }) => {`
- `getRevenueByBusiness: staffProcedure.handler(async ({ context }) => {`
- `getStaffWorkload: adminProcedure.handler(async ({ context }) => {`
- `getDeadlineDistribution: staffProcedure.handler(async ({ context }) => {`
- `getClientTypeDistribution: staffProcedure.handler(async ({ context }) => {`

## appointments

- `list: staffProcedure`
- `getById: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `confirm: staffProcedure`
- `complete: staffProcedure`
- `markNoShow: staffProcedure`
- `cancel: staffProcedure`
- `reschedule: staffProcedure`
- `getUpcoming: staffProcedure`
- `getToday: staffProcedure.handler(async ({ context }) => {`
- `list: staffProcedure`
- `create: adminProcedure`
- `update: adminProcedure`
- `delete: adminProcedure`
- `getForStaff: staffProcedure`
- `setWeeklySchedule: staffProcedure`
- `getOverrides: staffProcedure`
- `createOverride: staffProcedure`
- `deleteOverride: staffProcedure`

## backup

- `create: adminProcedure`
- `estimateSize: adminProcedure`
- `list: adminProcedure.input(listBackupsSchema).handler(async ({ input }) => {`
- `getById: adminProcedure`
- `delete: adminProcedure`
- `previewRestore: adminProcedure`
- `restore: adminProcedure`
- `getStats: adminProcedure`
- `cleanupFailed: adminProcedure.handler(async () => {`
- `list: adminProcedure.handler(async () => {`
- `create: adminProcedure`
- `update: adminProcedure`
- `toggle: adminProcedure`
- `delete: adminProcedure`
- `listDiskFiles: adminProcedure.handler(async () => {`
- `getStatus: adminProcedure.handler(async () => {`
- `getAuthUrl: adminProcedure.handler(async () => {`
- `exchangeCode: adminProcedure`
- `disconnect: adminProcedure.handler(async () => {`
- `createFolder: adminProcedure`

## beneficial-owners

- `list: staffProcedure`
- `get: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `delete: staffProcedure`
- `verify: staffProcedure`
- `getTotalOwnership: staffProcedure`

## client-services

- `saveSelections: staffProcedure`
- `getByClient: staffProcedure`
- `updateStatus: staffProcedure`
- `linkDocument: staffProcedure`
- `getFulfillmentProgress: staffProcedure`
- `getPopularServices: adminProcedure`
- `getCompletionMetrics: adminProcedure`
- `delete: staffProcedure`

## clients

- `list: staffProcedure`
- `listWithStats: staffProcedure`
- `getById: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `search: staffProcedure`
- `list: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `delete: staffProcedure`
- `list: staffProcedure`
- `create: staffProcedure`
- `delete: staffProcedure`
- `list: staffProcedure`
- `create: staffProcedure`
- `getDashboard: staffProcedure`
- `updateStatus: staffProcedure`
- `archive: staffProcedure`
- `export: staffProcedure`
- `assignStaff: staffProcedure`

## dashboard

- `getStats: staffProcedure.handler(async ({ context }) => {`
- `getMattersByStatus: staffProcedure.handler(async ({ context }) => {`
- `getRecentMatters: staffProcedure`
- `getUpcomingDeadlines: staffProcedure`
- `getRecentClients: staffProcedure`
- `getMattersByBusiness: staffProcedure.handler(async ({ context }) => {`

## deadlines

- `list: staffProcedure`
- `getCalendarData: staffProcedure`
- `getById: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `delete: staffProcedure`
- `complete: staffProcedure`
- `uncomplete: staffProcedure`
- `getUpcoming: staffProcedure`
- `getOverdue: staffProcedure.handler(async ({ context }) => {`
- `getStats: staffProcedure.handler(async ({ context }) => {`
- `getRecurrencePattern: staffProcedure`
- `updateRecurringSeries: staffProcedure`
- `generateMoreInstances: staffProcedure`
- `getRecurringInstances: staffProcedure`
- `getGuyanaTemplates: staffProcedure.handler(() => {`

## documents

- `list: staffProcedure`
- `getById: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `archive: staffProcedure`
- `restore: staffProcedure`
- `getExpiring: staffProcedure`
- `getByClient: staffProcedure`
- `getByMatter: staffProcedure`
- `list: staffProcedure`
- `getById: staffProcedure`
- `create: adminProcedure`
- `update: adminProcedure`
- `delete: adminProcedure`
- `preview: staffProcedure`
- `generate: staffProcedure`
- `prepareUpload: staffProcedure`
- `getDownloadUrl: staffProcedure`
- `getStats: staffProcedure.handler(async ({ context }) => {`
- `archive: staffProcedure`

## document-verification

- `create: staffProcedure`
- `get: staffProcedure`
- `verify: staffProcedure`
- `update: staffProcedure`
- `getExpiringDocuments: staffProcedure`
- `markNotificationSent: staffProcedure`
- `checkExpiredDocuments: staffProcedure.handler(async () => {`
- `getStatistics: staffProcedure.handler(async () => {`

## invites

- `create: ownerProcedure`
- `list: ownerProcedure.input(listInvitesSchema).handler(async ({ input }) => {`
- `getById: ownerProcedure`
- `revoke: ownerProcedure`
- `resend: ownerProcedure`
- `validate: publicProcedure`
- `stats: ownerProcedure.handler(async () => {`
- `bootstrapStatus: publicProcedure.handler(async () => {`

## invoices

- `list: staffProcedure`
- `getById: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `recordPayment: staffProcedure`
- `generatePdf: staffProcedure`
- `getSummary: staffProcedure.handler(async ({ context }) => {`
- `getClientBalance: staffProcedure`
- `getAgingReport: staffProcedure`
- `applyDiscount: staffProcedure`
- `updateStatus: staffProcedure`
- `export: staffProcedure`
- `markAsPaid: staffProcedure`

## knowledge-base

- `list: publicProcedure`
- `getById: publicProcedure`
- `download: publicProcedure`
- `autoFill: staffProcedure`
- `create: adminProcedure`
- `update: adminProcedure`
- `delete: adminProcedure`
- `getDownloadStats: adminProcedure`
- `getPopularItems: adminProcedure`
- `seedForms: adminProcedure.handler(async ({ context }) => {`
- `downloadFormFromAgency: adminProcedure`
- `downloadAllFormsFromAgencies: adminProcedure`
- `getFormDownloadStatus: adminProcedure.handler(async () => {`
- `updateDirectPdfUrl: adminProcedure`

## matters

- `list: staffProcedure`
- `getById: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `getServiceTypes: staffProcedure`
- `addItem: staffProcedure`
- `toggleItem: staffProcedure`
- `deleteItem: staffProcedure`
- `create: staffProcedure`
- `getByStatus: staffProcedure.handler(async ({ context }) => {`
- `updateStatus: staffProcedure`
- `export: staffProcedure`
- `assignStaff: staffProcedure`
- `updatePriority: staffProcedure`

## notifications

- `create: staffProcedure`
- `cleanup: staffProcedure`

## portal

- `send: staffProcedure`
- `verify: publicProcedure`
- `list: staffProcedure`
- `revoke: staffProcedure`
- `resend: staffProcedure`
- `register: publicProcedure`
- `login: publicProcedure`
- `logout: portalProcedure.handler(async ({ context }) => {`
- `requestPasswordReset: publicProcedure`
- `resetPassword: publicProcedure`
- `changePassword: portalProcedure`
- `getNotificationPreferences: portalProcedure.handler(async ({ context }) => {`
- `updateNotificationPreferences: portalProcedure`
- `list: portalProcedure`
- `get: portalProcedure`
- `list: portalProcedure`
- `download: portalProcedure`
- `me: portalProcedure.handler(async ({ context }) => {`
- `profile: portalProcedure.handler(async ({ context }) => {`
- `summary: portalProcedure.handler(async ({ context }) => {`

## reports

- `list: staffProcedure.input(listReportsSchema).handler(({ input }) => {`
- `execute: staffProcedure`
- `history: staffProcedure`
- `categories: staffProcedure.handler(async () => [`
- `export: staffProcedure`
- `listCustomReports: staffProcedure.handler(async () => {`
- `createCustomReport: staffProcedure`
- `updateCustomReport: staffProcedure`
- `deleteCustomReport: staffProcedure`
- `listSchedules: staffProcedure.handler(async () => {`
- `createSchedule: staffProcedure`
- `updateSchedule: staffProcedure`
- `deleteSchedule: staffProcedure`
- `runScheduleNow: staffProcedure`

## service-catalog

- `list: staffProcedure`
- `getById: staffProcedure`
- `create: adminProcedure`
- `update: adminProcedure`
- `delete: adminProcedure`
- `list: staffProcedure`
- `getById: staffProcedure`
- `getByCategory: staffProcedure`
- `getFeatured: staffProcedure`
- `create: adminProcedure`
- `update: adminProcedure`
- `delete: adminProcedure`
- `search: staffProcedure`
- `getForWizard: staffProcedure`

## settings


## staff-setup

- `verifyToken: publicProcedure`
- `completeSetup: publicProcedure`

## tags

- `list: staffProcedure`
- `create: staffProcedure`
- `delete: adminProcedure`
- `seed: adminProcedure.handler(async ({ context }) => {`

## tax-calculators.test


## tax-calculators


## time-tracking

- `list: staffProcedure`
- `getById: staffProcedure`
- `getByMatter: staffProcedure`
- `create: staffProcedure`
- `update: staffProcedure`
- `delete: staffProcedure`
- `getActiveTimer: staffProcedure.handler(async ({ context }) => {`
- `startTimer: staffProcedure`
- `stopTimer: staffProcedure`
- `cancelTimer: staffProcedure.handler(async ({ context }) => {`
- `getSummary: staffProcedure`
- `getHourlyRates: staffProcedure`
- `setHourlyRate: staffProcedure`

## training

- `createCourse: adminProcedure`
- `updateCourse: adminProcedure`
- `deleteCourse: adminProcedure`
- `createSchedule: staffProcedure`
- `updateSchedule: staffProcedure`
- `cancelSchedule: staffProcedure`
- `createEnrollment: staffProcedure`
- `updateEnrollment: staffProcedure`
- `issueCertificate: staffProcedure`

---

**Total Routers:** 27
