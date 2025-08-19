"use client";
import { ReactNode, useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ChevronLeft,
  Menu,
  Apple,
  Boxes,
  Ruler,
  Utensils,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: ReactNode;
};

type RouterGroupsProps = {
  group: string;
  items: {
    label: string;
    href: string;
    icon: ReactNode;
  }[];
};
const ROUTE_GROUPS: RouterGroupsProps[] = [
  {
    group: "Foods Management",
    items: [
      {
        href: "/admin/foods-management/foods",
        label: "Foods",
        icon: <Apple className="mr-2 size-3" />,
      },
      {
        href: "/admin/foods-management/categories",
        label: "Categories",
        icon: <Boxes className="mr-2 size-3" />,
      },
      {
        href: "/admin/foods-management/serving-units",
        label: "Serving Units",
        icon: <Ruler className="mr-2 size-3" />,
      },
    ],
  },
  {
    group: "Meals Management",
    items: [
      {
        href: "/client",
        label: "Meals",
        icon: <Utensils className="mr-2 size-3" />,
      },
    ],
  },
];

const RouteGroup = ({ group, items }: RouterGroupsProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger asChild>
          <Button
            className={cn(
              "text-foreground/80",
              "flex",
              "w-full",
              "justify-between",
              "font-normal",
            )}
            variant="ghost"
            onClick={() => setOpen(!open)}
          >
            {group}
            <div>
              <ChevronDown
                className={`duration-300 ${open ? "rotate-180" : "rotate-0"}`}
              />
            </div>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content forceMount>
          <motion.div
            className={`flex flex-col gap-2 ${!open ? "pointer-events-none" : ""}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {items?.map((item) => (
              <Button
                className={cn(
                  `w-full cursor-pointer justify-start font-normal`,
                )}
                variant="link"
                key={item.href}
                asChild
              >
                <Link
                  className={`flex items-center rounded-md px-4 py-1 !text-green-500 transition-all ${
                    pathname === item.href
                      ? "bg-foreground/10 hover:bg-foreground/5"
                      : "hover:bg-foreground/10"
                  }`}
                  href={item.href}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Link>
              </Button>
            ))}
          </motion.div>
        </Collapsible.Content>
      </Collapsible.Root>
    </>
  );
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-background fixed z-10 flex h-13 w-screen items-center justify-between border px-2">
      <Collapsible.Root className="h-full" open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger className="m-2" asChild>
          <Button size={"icon"} variant="outline">
            <Menu />
          </Button>
        </Collapsible.Trigger>
      </Collapsible.Root>
      <div className="flex"></div>

      <Collapsible.Root
        open={open}
        onOpenChange={setOpen}
        className="fixed top-0 left-0 z-20 h-dvh"
      >
        <Collapsible.Content forceMount>
          <div
            className={`bg-background fixed top-0 left-0 h-screen w-64 border p-4 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <h1 className="font-semibold">Admin Dashboard</h1>
              <Collapsible.Trigger asChild>
                <Button size={"icon"} variant="outline">
                  <ChevronLeft />
                </Button>
              </Collapsible.Trigger>
            </div>
            <Separator className="my-2">
              <div className="mt-4">
                {ROUTE_GROUPS.map((group) => (
                  <RouteGroup
                    key={group.group}
                    group={group.group}
                    items={group.items}
                  />
                ))}
              </div>
            </Separator>
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
