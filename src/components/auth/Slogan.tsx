"use client";

import React from "react";
import { useTranslations } from "next-intl";

const Slogan = () => {
  const t = useTranslations('Auth');
  return <p className="text-center text-gray-400 dark:text-white/60">
    {t('slogan')}
  </p>
}

export default Slogan;
