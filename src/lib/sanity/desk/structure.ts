import { StructureResolver } from "sanity/structure";
import { env } from "@/env";
import { BlockquoteIcon } from "@sanity/icons";

type Role = "administrator" | "editor" | "viewer" | "developer" | "contributor";


export const structure: StructureResolver = async (
  S,
  { currentUser, getClient },
) => {
  const isRole = (role: Role): boolean =>
    !!currentUser?.roles.find((r) => r?.name === role);

  return S.list()
    .title(`Padel.NET [${env.NEXT_PUBLIC_SANITY_DATASET}]`).items([
      S.listItem()
        .title("Questionnaire")
        .icon(BlockquoteIcon)
        .child(S.document().schemaType("questionnaire").documentId("questionnaire")),
    ])
}
