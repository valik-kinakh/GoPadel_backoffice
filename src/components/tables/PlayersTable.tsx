"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import Pagination from "./Pagination";
import Select from "../form/Select";
import type { ClientResponse, ClientResponsePaginatedResponse } from "@/lib/webApi/generated/models";
import { useQuery } from "@tanstack/react-query";
import { getApiPlayerClients } from "@/lib/webApi/generated/requests";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface PlayersTableProps {
  initialData: ClientResponse[];
  initialPage: number;
  initialCount: number;
  initialTotalPages: number;
}

const PlayersTable: React.FC<PlayersTableProps> = ({
  initialData,
  initialPage,
  initialCount,
  initialTotalPages,
}) => {
  const t = useTranslations("Players");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(initialPage);
  const [count, setCount] = useState(initialCount);

  // Use tanstack query for fetching data
  const { data, isLoading, isError } = useQuery({
    queryKey: ["players", page, count],
    queryFn: async () => {
      const { payload, error } = await getApiPlayerClients(
        { page, count },
        { safeFetch: true }
      );
      if (error || !payload) throw new Error("Failed to fetch players");
      return payload as ClientResponsePaginatedResponse;
    },
    placeholderData: (previousData) => {
      // Only use initial data for the first load with matching page/count
      if (page === initialPage && count === initialCount) {
        return {
          items: initialData,
          page: initialPage,
          count: initialCount,
          totalPages: initialTotalPages,
          totalCount: initialData.length,
          hasNextPage: initialPage < initialTotalPages,
          hasPreviousPage: initialPage > 1,
        };
      }
      return previousData;
    },
    staleTime: 30_000, // 30 seconds
  });

  const players = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("count", count.toString());
    router.push(`/players?${params.toString()}`);
  };

  const handleCountChange = (newCount: string) => {
    const newCountValue = parseInt(newCount, 10);
    setCount(newCountValue);
    setPage(1); // Reset to first page when changing items per page
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("count", newCount);
    router.push(`/players?${params.toString()}`);
    setPage(1); // Reset to first page when changing items per page
  };

  const itemsPerPageOptions = [
    { value: "20", label: t("perPage", { count: 20 }) },
    { value: "50", label: t("perPage", { count: 50 }) },
    { value: "100", label: t("perPage", { count: 100 }) },
  ];

  return (
    <div className="space-y-4">
      {/* Items per page selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t("show")}
          </span>
          <div className="w-40">
            <Select
              options={itemsPerPageOptions}
              defaultValue={count.toString()}
              onChange={handleCountChange}
              placeholder={t("itemsPerPage")}
            />
          </div>
        </div>
        {data?.totalCount && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("total", { count: data.totalCount })}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">{t("loading")}</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600 dark:text-red-400">
              {t("loadingError")}
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[800px]">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/5">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {t("tableHeaders.id")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {t("tableHeaders.player")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {t("tableHeaders.level")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {t("tableHeaders.rating")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {t("tableHeaders.actions")}
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                    {players.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                          {t("noPlayersFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                            {player.id}
                          </TableCell>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                {player.photoUrl ? (
                                  <Image
                                    width={40}
                                    height={40}
                                    src={player.photoUrl}
                                    alt={`${player.name} ${player.surname}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <svg
                                      className="w-6 h-6"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                  {player.name} {player.surname}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                            {player.level ?? "N/A"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                            {player.rating ?? "N/A"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <button
                              onClick={() => console.log('Player details:', player)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            >
                              {t("details")}
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-gray-100 dark:border-white/5">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlayersTable;
