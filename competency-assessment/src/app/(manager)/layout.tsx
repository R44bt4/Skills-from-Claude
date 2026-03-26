import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

interface ManagerLayoutProps {
  children: ReactNode;
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Mobile top bar spacer */}
      <div className="lg:hidden h-14" />
      {/* Content offset for desktop sidebar */}
      <main className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
