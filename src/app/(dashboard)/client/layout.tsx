import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type layoutProps = {
  children: ReactNode;
};
const layout = async ({ children }: layoutProps) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  if (session?.user?.role !== "ADMIN")
    redirect("/admin/foods-management/foods");
  return <div className="mx-auto max-w-7xl p-6">{children}</div>;
};
export default layout;
