"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Active state is driven by the actual current route (not a hardcoded
// "current page" flag), so this only works correctly for real navigable
// hrefs — not in-page anchors like "#section". `icon` takes a rendered
// element (e.g. <BookOpen className="h-4 w-4" />), not a component
// reference — component references can't cross the server/client
// boundary from a Server Component caller.
export function SidebarNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // "/dashboard" itself needs an exact match (every dashboard route
  // starts with it), but deeper hrefs like "/dashboard/courses" should
  // also stay active on nested routes like "/dashboard/courses/x/content".
  const active =
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
        active
          ? "bg-indigo-600 text-white"
          : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
