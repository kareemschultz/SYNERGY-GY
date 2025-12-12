import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { activityRouter } from "./activity";
import { adminRouter } from "./admin";
import { appointmentsRouter } from "./appointments";
import { clientServicesRouter } from "./client-services";
import { clientsRouter } from "./clients";
import { dashboardRouter } from "./dashboard";
import { deadlinesRouter } from "./deadlines";
import { documentsRouter } from "./documents";
import { invoicesRouter } from "./invoices";
import { knowledgeBaseRouter } from "./knowledge-base";
import { mattersRouter } from "./matters";
import { portalRouter } from "./portal";
import { reportsRouter } from "./reports";
import { serviceCatalogRouter } from "./service-catalog";
import { settingsRouter } from "./settings";
import { staffSetupRouter } from "./staff-setup";
import { taxCalculatorsRouter } from "./tax-calculators";
import { trainingRouter } from "./training";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  appointments: appointmentsRouter,
  clients: clientsRouter,
  clientServices: clientServicesRouter,
  matters: mattersRouter,
  documents: documentsRouter,
  deadlines: deadlinesRouter,
  invoices: invoicesRouter,
  dashboard: dashboardRouter,
  activity: activityRouter,
  admin: adminRouter,
  reports: reportsRouter,
  settings: settingsRouter,
  portal: portalRouter,
  knowledgeBase: knowledgeBaseRouter,
  serviceCatalog: serviceCatalogRouter,
  staffSetup: staffSetupRouter,
  taxCalculators: taxCalculatorsRouter,
  training: trainingRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
