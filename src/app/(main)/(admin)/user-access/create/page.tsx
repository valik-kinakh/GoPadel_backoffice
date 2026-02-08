import { redirect } from "next/navigation";
import { hasServerPermission } from "@/lib/utils/auth/serverPermissions";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import CreateAdminUserForm from "@/components/user-access/CreateAdminUserForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CreateAdminUser");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CreateAdminUserPage() {
  const t = await getTranslations("CreateAdminUser");
  
  // Check if user has ADMIN_CREATION permission
  const hasAdminCreationPermission = await hasServerPermission("ADMIN_CREATION");

  if (!hasAdminCreationPermission) {
    redirect("/unauthorized");
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={t("pageTitle")} />
      
      <div className="flex flex-col gap-5">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {t("formTitle")}
            </h3>
          </div>
          <div className="p-6.5">
            <CreateAdminUserForm />
          </div>
        </div>
      </div>
    </div>
  );
}
