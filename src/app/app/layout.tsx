import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { SidebarSkeleton } from "@/components/app/sidebar-skeleton";
import { getAccount } from "@/lib/data";

export const metadata: Metadata = {
  title: "Espace agent",
  robots: { index: false },
};

async function SidebarWithAccount() {
  const account = await getAccount();
  return <Sidebar account={account} />;
}

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarWithAccount />
      </Suspense>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
