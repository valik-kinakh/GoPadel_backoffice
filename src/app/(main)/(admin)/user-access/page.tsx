import { hasServerPermission } from "@/lib/utils/auth/serverPermissions";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("UserAccess");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const UserAccessPage = async () => {
  const t = await getTranslations("UserAccess");

  // Check if user has ADMIN_CREATION permission
  const hasAdminCreationPermission = await hasServerPermission("ADMIN_CREATION");

  return (
    <div>
      <PageBreadcrumb pageTitle={t("pageTitle")} />

      <div className="flex flex-col gap-5">
        {hasAdminCreationPermission && (
          <div className="flex justify-end">
            <Link href="/user-access/create">
              <Button variant="primary" size="md">
                {t("createAdminUser")}
              </Button>
            </Link>
          </div>
        )}

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <p className="text-gray-600 dark:text-gray-400">{t("content")}</p>
        </div>
      </div>
    </div>
  );
}

export default UserAccessPage;
