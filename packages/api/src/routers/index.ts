import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { activityRouter } from "./activity";
import { adminRouter } from "./admin";
import { clientsRouter } from "./clients";
import { dashboardRouter } from "./dashboard";
import { deadlinesRouter } from "./deadlines";
import { documentsRouter } from "./documents";
import { invoicesRouter } from "./invoices";
import { mattersRouter } from "./matters";
import { portalRouter } from "./portal";
import { serviceCatalogRouter } from "./service-catalog";
import { settingsRouter } from "./settings";
import { taxCalculatorsRouter } from "./tax-calculators";
import { trainingRouter } from "./training";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  clients: clientsRouter,
  matters: mattersRouter,
  documents: documentsRouter,
  deadlines: deadlinesRouter,
  invoices: invoicesRouter,
  dashboard: dashboardRouter,
  activity: activityRouter,
  admin: adminRouter,
  settings: settingsRouter,
  portal: portalRouter,
  serviceCatalog: serviceCatalogRouter,
  taxCalculators: taxCalculatorsRouter,
  training: trainingRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
