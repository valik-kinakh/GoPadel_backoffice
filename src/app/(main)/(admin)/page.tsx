import type { Metadata } from "next";
import React from "react";
import {useTranslations} from "next-intl";

export const metadata: Metadata = {
  title:
    "Dashboard",
};

export default function Ecommerce() {
  const t = useTranslations('Shared');
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      Admin dashboard
        {t('test')}
    </div>
  );
}
