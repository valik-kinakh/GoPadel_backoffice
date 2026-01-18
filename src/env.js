
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

// const booleanStrictCoerce = z
//   .enum(["true", "false"])
//   .transform((v) => v === "true");

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    SANITY_PROJECT_ID: z.string().min(1),
    SANITY_DATASET: z.string().min(1),
    SANITY_VIEW_TOKEN: z.string().min(1),
    SECRET_SANITY_EDIT_TOKEN: z.string().min(1),
  },

  /**
   * Used exclusively for public system/framework values that exist on both environments.
   * They don't require `NEXT_PUBLIC_` prefix, but are definitely publicly available!
   */
  shared: {
    NODE_ENV: z.enum(["development", "test", "preview", "production"]),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // Server
    SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    SANITY_VIEW_TOKEN: process.env.SECRET_SANITY_VIEW_TOKEN,
    SECRET_SANITY_EDIT_TOKEN: process.env.SECRET_SANITY_EDIT_TOKEN,
    // Shared
    NODE_ENV:
      process.env.VERCEL_ENV ??
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",
    // Client
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
  extends: [vercel()],
});
