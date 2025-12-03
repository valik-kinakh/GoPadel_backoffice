import { type Metadata } from "next/types";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  icons: [{ rel: "icon", url: "/icon" }],
};

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
