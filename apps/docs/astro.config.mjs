// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "GK-Nexus Documentation",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/kareemschultz/SYNERGY-GY",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [{ label: "Overview", slug: "guides/getting-started" }],
        },
        {
          label: "Staff Guides",
          items: [{ label: "Staff Training", slug: "guides/staff/training" }],
        },
        {
          label: "Client Portal",
          items: [
            { label: "Portal Access", slug: "guides/clients/portal-access" },
          ],
        },
        {
          label: "GCMC Services",
          items: [
            { label: "Training Programs", slug: "services/gcmc/training" },
            {
              label: "Company Incorporation",
              slug: "services/gcmc/incorporation",
            },
            { label: "Paralegal Services", slug: "services/gcmc/paralegal" },
            {
              label: "Immigration Services",
              slug: "services/gcmc/immigration",
            },
            {
              label: "Business Proposals",
              slug: "services/gcmc/business-proposals",
            },
          ],
        },
        {
          label: "KAJ Services",
          items: [
            { label: "Income Tax Returns", slug: "services/kaj/tax-returns" },
            {
              label: "Compliance Services",
              slug: "services/kaj/compliance",
            },
            { label: "PAYE Returns", slug: "services/kaj/paye" },
            {
              label: "Financial Statements",
              slug: "services/kaj/statements",
            },
            { label: "NIS Services", slug: "services/kaj/nis-services" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "System Reference", slug: "reference/system-reference" },
            { label: "Forms & Templates", slug: "reference/forms-templates" },
          ],
        },
      ],
    }),
  ],
});
