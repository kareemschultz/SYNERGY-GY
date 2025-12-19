import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { activityRouter } from "./activity";
import { adminRouter } from "./admin";
import { amlComplianceRouter } from "./aml-compliance";
import { analyticsRouter } from "./analytics";
import { appointmentsRouter } from "./appointments";
import { backupRouter } from "./backup";
import { beneficialOwnersRouter } from "./beneficial-owners";
import { clientServicesRouter } from "./client-services";
import { clientsRouter } from "./clients";
import { dashboardRouter } from "./dashboard";
import { deadlinesRouter } from "./deadlines";
import { documentVerificationRouter } from "./document-verification";
import { documentsRouter } from "./documents";
import { invitesRouter } from "./invites";
import { invoicesRouter } from "./invoices";
import { knowledgeBaseRouter } from "./knowledge-base";
import { mattersRouter } from "./matters";
import { notificationsRouter } from "./notifications";
import { portalRouter } from "./portal";
import { reportsRouter } from "./reports";
import { serviceCatalogRouter } from "./service-catalog";
import { settingsRouter } from "./settings";
import { staffSetupRouter } from "./staff-setup";
import { tagsRouter } from "./tags";
import { taxCalculatorsRouter } from "./tax-calculators";
import { timeTrackingRouter } from "./time-tracking";
import { trainingRouter } from "./training";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  activity: activityRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  amlCompliance: amlComplianceRouter,
  appointments: appointmentsRouter,
  backup: backupRouter,
  beneficialOwners: beneficialOwnersRouter,
  clientServices: clientServicesRouter,
  clients: clientsRouter,
  dashboard: dashboardRouter,
  deadlines: deadlinesRouter,
  documentVerification: documentVerificationRouter,
  documents: documentsRouter,
  invites: invitesRouter,
  invoices: invoicesRouter,
  knowledgeBase: knowledgeBaseRouter,
  matters: mattersRouter,
  portal: portalRouter,
  reports: reportsRouter,
  serviceCatalog: serviceCatalogRouter,
  settings: settingsRouter,
  staffSetup: staffSetupRouter,
  tags: tagsRouter,
  taxCalculators: taxCalculatorsRouter,
  training: trainingRouter,
  notifications: notificationsRouter,
  timeTracking: timeTrackingRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
