import { StructureResolver } from "sanity/structure";
import { env } from "@/env";
import { BlockquoteIcon } from "@sanity/icons";

export const structure: StructureResolver = async (S) => {
  return S.list()
    .title(`Padel.NET [${env.NEXT_PUBLIC_SANITY_DATASET}]`).items([
      S.listItem()
        .title("Questionnaire")
        .icon(BlockquoteIcon)
        .child(S.document().schemaType("questionnaire").documentId("questionnaire")),
    ])
}
