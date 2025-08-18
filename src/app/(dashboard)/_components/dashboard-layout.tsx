"use client";
import { ReactNode, useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Collapsible.Root
        className="fixed top-0 left-0 h-screen"
        open={open}
        onOpenChange={setOpen}
      >
        <div className="ml-0 flex items-center">
          <Collapsible.Trigger asChild>
            <Button size={"icon"} variant="outline">
              <Menu />
            </Button>
          </Collapsible.Trigger>
        </div>
      </Collapsible.Root>

      <Collapsible.Root
        open={open}
        onOpenChange={setOpen}
        className="fixed top-0 left-0 z-20 h-dvh"
      >
        <Collapsible.Content forceMount>
          <div
            className={`bg-background fixed top-0 left-0 h-screen w-64 border p-4 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex items-center justify-center">
              <h1>Admin Dashboard</h1>
              <Collapsible.Trigger asChild>
                <Button size={"icon"} variant="outline">
                  <ChevronLeft />
                </Button>
              </Collapsible.Trigger>
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
      <main
        className={`transition-marigin mt-13 flex-1 p-4 duration-300 ${open ? "ml-64" : "ml-0"}`}
      >
        {children}
      </main>
    </div>
  );
}
