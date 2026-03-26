import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Mobile top bar spacer */}
      <div className="lg:hidden h-14" />
      {/* Content offset for desktop sidebar */}
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
