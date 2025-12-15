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
          label: "Guides",
          items: [
            { label: "Getting Started", slug: "guides/getting-started" },
            { label: "Example Guide", slug: "guides/example" },
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
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
