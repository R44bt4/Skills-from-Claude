"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Assessment", href: "/assessment", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { label: "My Growth Plan", href: "/my-growth-plan", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { label: "Reviews", href: "/reviews", roles: ["MANAGER", "ADMIN"] },
  { label: "Calibration", href: "/calibration", roles: ["MANAGER", "ADMIN"] },
  { label: "Cycles", href: "/admin/cycles", roles: ["ADMIN"] },
  { label: "Employees", href: "/admin/employees", roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = session?.user?.role ?? "EMPLOYEE";

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* App title */}
      <div className="px-4 py-5 border-b">
        <span className="text-lg font-semibold tracking-tight">Competency Assessment</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info + sign out */}
      {session?.user && (
        <div className="px-4 py-4 border-t space-y-2">
          <div className="text-sm">
            <p className="font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 border-b bg-background">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="p-2 rounded-md hover:bg-muted"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="ml-3 font-semibold text-sm">Competency Assessment</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-14 left-0 bottom-0 z-30 w-64 bg-background border-r transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-background">
        {sidebarContent}
      </aside>
    </>
  );
}
