import {
  client,
  clientServiceSelection,
  db,
  document,
  serviceCatalog,
} from "@SYNERGY-GY/db";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, router, staffProcedure } from "../index";

export const clientServicesRouter = router({
  /**
   * Save service selections from onboarding wizard
   */
  saveSelections: staffProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        gcmcServices: z.array(z.string()),
        kajServices: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { clientId, gcmcServices, kajServices } = input;

      // Verify client exists
      const clientExists = await db.query.client.findFirst({
        where: eq(client.id, clientId),
      });

      if (!clientExists) {
        throw new Error("Client not found");
      }

      // Fetch service definitions from service catalog
      const allServiceCodes = [...gcmcServices, ...kajServices];

      const serviceDefinitions = await db.query.serviceCatalog.findMany({
        where: inArray(serviceCatalog.id, allServiceCodes),
      });

      if (serviceDefinitions.length !== allServiceCodes.length) {
        throw new Error("Some service codes are invalid");
      }

      // Create service selection records
      const serviceSelections = [];

      for (const serviceCode of gcmcServices) {
        const serviceDef = serviceDefinitions.find((s) => s.id === serviceCode);
        if (!serviceDef) continue;

        serviceSelections.push({
          clientId,
          business: "GCMC" as const,
          serviceCode: serviceDef.id,
          serviceName: serviceDef.name,
          requiredDocuments: serviceDef.documentRequirements || [],
          uploadedDocuments: [],
          status: "INTERESTED" as const,
        });
      }

      for (const serviceCode of kajServices) {
        const serviceDef = serviceDefinitions.find((s) => s.id === serviceCode);
        if (!serviceDef) continue;

        serviceSelections.push({
          clientId,
          business: "KAJ" as const,
          serviceCode: serviceDef.id,
          serviceName: serviceDef.name,
          requiredDocuments: serviceDef.documentRequirements || [],
          uploadedDocuments: [],
          status: "INTERESTED" as const,
        });
      }

      // Insert all service selections
      const created = await db
        .insert(clientServiceSelection)
        .values(serviceSelections)
        .returning();

      return {
        success: true,
        count: created.length,
        selections: created,
      };
    }),

  /**
   * Get all service selections for a client
   */
  getByClient: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input }) => {
      const selections = await db.query.clientServiceSelection.findMany({
        where: eq(clientServiceSelection.clientId, input.clientId),
        orderBy: (t, { desc }) => desc(t.selectedAt),
      });

      // Calculate fulfillment percentage for each service
      return selections.map((selection) => {
        const totalRequired = selection.requiredDocuments.length;
        const totalUploaded = selection.uploadedDocuments.length;
        const percentage =
          totalRequired > 0
            ? Math.round((totalUploaded / totalRequired) * 100)
            : 100;

        return {
          ...selection,
          fulfillment: {
            total: totalRequired,
            uploaded: totalUploaded,
            percentage,
          },
        };
      });
    }),

  /**
   * Update service status
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        selectionId: z.string().uuid(),
        status: z.enum(["INTERESTED", "ACTIVE", "COMPLETED", "INACTIVE"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { selectionId, status, notes } = input;

      // Prepare update data with appropriate timestamp
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Set appropriate timestamp based on status
      if (status === "ACTIVE") {
        updateData.activatedAt = new Date();
      } else if (status === "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (status === "INACTIVE") {
        updateData.inactivatedAt = new Date();
      }

      const [updated] = await db
        .update(clientServiceSelection)
        .set(updateData)
        .where(eq(clientServiceSelection.id, selectionId))
        .returning();

      return updated;
    }),

  /**
   * Link uploaded document to service requirement
   */
  linkDocument: staffProcedure
    .input(
      z.object({
        selectionId: z.string().uuid(),
        documentId: z.string().uuid(),
        requirementName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { selectionId, documentId, requirementName } = input;

      // Fetch the service selection
      const selection = await db.query.clientServiceSelection.findFirst({
        where: eq(clientServiceSelection.id, selectionId),
      });

      if (!selection) {
        throw new Error("Service selection not found");
      }

      // Fetch the document
      const doc = await db.query.document.findFirst({
        where: eq(document.id, documentId),
      });

      if (!doc) {
        throw new Error("Document not found");
      }

      // Add to uploadedDocuments array
      const uploadedDocs = [
        ...selection.uploadedDocuments,
        {
          documentId,
          fileName: doc.fileName,
          uploadedAt: new Date().toISOString(),
          requirementName,
        },
      ];

      const [updated] = await db
        .update(clientServiceSelection)
        .set({ uploadedDocuments: uploadedDocs })
        .where(eq(clientServiceSelection.id, selectionId))
        .returning();

      return updated;
    }),

  /**
   * Get document fulfillment progress for a client
   */
  getFulfillmentProgress: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input }) => {
      const selections = await db.query.clientServiceSelection.findMany({
        where: eq(clientServiceSelection.clientId, input.clientId),
      });

      let totalRequired = 0;
      let totalUploaded = 0;

      const byService = selections.map((selection) => {
        const required = selection.requiredDocuments.length;
        const uploaded = selection.uploadedDocuments.length;

        totalRequired += required;
        totalUploaded += uploaded;

        return {
          selectionId: selection.id,
          serviceCode: selection.serviceCode,
          serviceName: selection.serviceName,
          business: selection.business,
          status: selection.status,
          required,
          uploaded,
          percentage:
            required > 0 ? Math.round((uploaded / required) * 100) : 100,
          requiredDocuments: selection.requiredDocuments,
          uploadedDocuments: selection.uploadedDocuments,
        };
      });

      return {
        total: totalRequired,
        uploaded: totalUploaded,
        percentage:
          totalRequired > 0
            ? Math.round((totalUploaded / totalRequired) * 100)
            : 100,
        byService,
      };
    }),

  /**
   * Analytics: Get popular services
   */
  getPopularServices: adminProcedure
    .input(
      z.object({
        business: z.enum(["GCMC", "KAJ"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const { business, startDate, endDate } = input;

      const conditions = [];

      if (business) {
        conditions.push(eq(clientServiceSelection.business, business));
      }

      if (startDate) {
        conditions.push(
          sql`${clientServiceSelection.selectedAt} >= ${startDate}`
        );
      }

      if (endDate) {
        conditions.push(
          sql`${clientServiceSelection.selectedAt} <= ${endDate}`
        );
      }

      // Group by service code and count
      const results = await db
        .select({
          serviceCode: clientServiceSelection.serviceCode,
          serviceName: clientServiceSelection.serviceName,
          business: clientServiceSelection.business,
          count: count(clientServiceSelection.id),
        })
        .from(clientServiceSelection)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(
          clientServiceSelection.serviceCode,
          clientServiceSelection.serviceName,
          clientServiceSelection.business
        )
        .orderBy(({ count }) => sql`${count} DESC`);

      return results;
    }),

  /**
   * Analytics: Get completion metrics
   */
  getCompletionMetrics: adminProcedure
    .input(
      z.object({
        serviceCode: z.string().optional(),
        business: z.enum(["GCMC", "KAJ"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { serviceCode, business } = input;

      const conditions = [eq(clientServiceSelection.status, "COMPLETED")];

      if (serviceCode) {
        conditions.push(eq(clientServiceSelection.serviceCode, serviceCode));
      }

      if (business) {
        conditions.push(eq(clientServiceSelection.business, business));
      }

      const completedServices = await db.query.clientServiceSelection.findMany({
        where: and(...conditions),
      });

      // Calculate average completion time
      const completionTimes = completedServices
        .filter((s) => s.selectedAt && s.completedAt)
        .map((s) => {
          const start = new Date(s.selectedAt).getTime();
          const end = new Date(s.completedAt!).getTime();
          return (end - start) / (1000 * 60 * 60 * 24); // Days
        });

      const avgDays =
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;

      const minDays =
        completionTimes.length > 0 ? Math.min(...completionTimes) : 0;
      const maxDays =
        completionTimes.length > 0 ? Math.max(...completionTimes) : 0;

      return {
        totalCompleted: completedServices.length,
        avgCompletionDays: Math.round(avgDays),
        minCompletionDays: Math.round(minDays),
        maxCompletionDays: Math.round(maxDays),
        byService: serviceCode
          ? undefined
          : // Group by service if no specific service requested
            Object.entries(
              completedServices.reduce(
                (acc, s) => {
                  const key = s.serviceCode;
                  if (!acc[key]) {
                    acc[key] = {
                      serviceCode: s.serviceCode,
                      serviceName: s.serviceName,
                      business: s.business,
                      count: 0,
                      times: [],
                    };
                  }
                  acc[key].count++;
                  if (s.selectedAt && s.completedAt) {
                    const start = new Date(s.selectedAt).getTime();
                    const end = new Date(s.completedAt).getTime();
                    acc[key].times.push((end - start) / (1000 * 60 * 60 * 24));
                  }
                  return acc;
                },
                {} as Record<
                  string,
                  {
                    serviceCode: string;
                    serviceName: string;
                    business: string;
                    count: number;
                    times: number[];
                  }
                >
              )
            ).map(([_, data]) => ({
              serviceCode: data.serviceCode,
              serviceName: data.serviceName,
              business: data.business,
              count: data.count,
              avgDays:
                data.times.length > 0
                  ? Math.round(
                      data.times.reduce((a, b) => a + b, 0) / data.times.length
                    )
                  : 0,
            })),
      };
    }),

  /**
   * Delete service selection
   */
  delete: staffProcedure
    .input(z.object({ selectionId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db
        .delete(clientServiceSelection)
        .where(eq(clientServiceSelection.id, input.selectionId));

      return { success: true };
    }),
});
