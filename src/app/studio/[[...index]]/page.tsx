import { Studio } from "./Studio";

// Set the right `viewport`, `robots` and `referer` meta tags
export { metadata, viewport } from "next-sanity/studio";

export const dynamic = "force-dynamic";
export const revalidate = 86_400; // 24 hours

/**
 * Sanity defined studio setup, we don't touch it.
 * @see https://github.com/sanity-io/next-sanity?tab=readme-ov-file#studio-route-with-app-router
 */
export default function StudioPage() {
  return <Studio />;
}
