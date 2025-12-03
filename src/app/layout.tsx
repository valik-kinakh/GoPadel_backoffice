import React from "react";

/**
 * A layout file is required, even if it's just passing children through.
 * @see https://next-intl-docs.vercel.app/docs/environments/error-files#catching-non-localized-requests
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children;
}
