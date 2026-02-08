"use client";
import React from "react";
import { useAdmin } from "@/context/AdminContext";
import { UserCircleIcon } from "@/icons";


export default function UserMetaCard() {
  const { admin } = useAdmin();

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <UserCircleIcon className="text-gray-400 dark:text-gray-500" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {admin?.fullName || "User"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {admin?.email || "No email"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
