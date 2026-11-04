import type { Metadata } from "next";
import { Sidebar } from "@/components/app/sidebar";

export const metadata: Metadata = {
  title: "Espace agent",
  robots: { index: false },
};

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
