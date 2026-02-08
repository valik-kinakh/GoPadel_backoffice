"use client";

import React from "react";
import { useTranslations } from "next-intl";

export const GlobalLoader: React.FC = () => {
  const t = useTranslations("Shared");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-md dark:bg-gray-900/90">
      <div className="flex flex-col items-center gap-4">
        <div 
          className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-500"
          style={{
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t("loading")}
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
