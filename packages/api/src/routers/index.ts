import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { activityRouter } from "./activity";
import { clientsRouter } from "./clients";
import { dashboardRouter } from "./dashboard";
import { deadlinesRouter } from "./deadlines";
import { documentsRouter } from "./documents";
import { mattersRouter } from "./matters";

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
  dashboard: dashboardRouter,
  activity: activityRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
