import { ReactNode } from "react";
import DashboardLayout from "@/app/(dashboard)/_components/dashboard-layout";
type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <DashboardLayout> {children}</DashboardLayout>
    </>
  );
}
