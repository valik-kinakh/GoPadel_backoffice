import { defineConfig } from "sanity";
import { env } from "@/env";
import { colorInput } from "@sanity/color-input";
import { documentInternationalization } from "@sanity/document-internationalization";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { visionTool } from "@sanity/vision";
import { media } from "sanity-plugin-media";
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash";
import documentSchemas from "@/lib/sanity/schemas/documents";
import { structureTool } from "sanity/structure";
import { structure } from './structure';


export const apiVersion = "2025-02-06";

export default defineConfig({
  title: `PadelNet [${env.NEXT_PUBLIC_SANITY_DATASET}]`,
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  basePath: "/studio",
  schema: {
    types: documentSchemas,
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    colorInput(),
    structureTool({ structure }),
    documentInternationalization({
      supportedLanguages: [{ id: 'uk-UA', title: "UK (Ukrainian)" }],
      schemaTypes: ['questionnaire'],
      languageField: "locale",
    }),
    internationalizedArray({
      languages: [{ id: 'uk-UA', title: "UK (Ukrainian)" }],
      defaultLanguages: ["uk-UA"],
      fieldTypes: ["string", "text", "image"],
    }),
    visionTool({ defaultApiVersion: apiVersion }),
    media(),
    unsplashImageAsset(),
  ],
})
