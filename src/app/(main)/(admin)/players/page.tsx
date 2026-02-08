import { redirect } from "next/navigation";
import { hasServerPermission } from "@/lib/utils/auth/serverPermissions";
import { getApiPlayerClients } from "@/lib/webApi/generated/requests";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PlayersTable from "@/components/tables/PlayersTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players | GoPadel Backoffice",
  description: "View and manage players in the GoPadel platform",
};

interface PlayersPageProps {
  searchParams: Promise<{ page?: string; count?: string }>;
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  // Check for CLIENTS_OVERVIEW permission
  const hasPermission = await hasServerPermission("CLIENTS_OVERVIEW");

  if (!hasPermission) {
    redirect("/");
  }

  // Get page and count from search params
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const count = parseInt(resolvedParams.count || "20", 10);

  // Fetch players data
  const { payload, error } = await getApiPlayerClients(
    {
      page,
      count,
    },
    {
      safeFetch: true,
    }
  );

  // Handle error
  if (error || !payload) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Players" />
        <div className="mt-6 p-6 rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <p className="text-red-600 dark:text-red-400">
            Failed to load players. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const players = payload.items || [];
  const totalPages = payload.totalPages || 1;

  return (
    <div>
      <PageBreadcrumb pageTitle="Players" />

      <div className="mt-6">
        <PlayersTable
          initialData={players}
          initialPage={page}
          initialCount={count}
          initialTotalPages={totalPages}
        />
      </div>
    </div>
  );
}
