import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminShell from "@/components/admin/shell";

export const metadata: Metadata = {
  title: "Medora Control Centre",
  description: "Admin dashboard for the Medora pharmacy store.",
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
