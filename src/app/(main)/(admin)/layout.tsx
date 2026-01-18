import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/utils/auth/tokenStorage";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();

  if (!token) {
    redirect("/signin");
  }

  return <AdminShell>{children}</AdminShell>;
}
