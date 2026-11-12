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

/** Un membre désactivé ne voit aucune donnée : on lui explique pourquoi plutôt que d'afficher une application vide. */
async function ActiveGate({ children }: { children: React.ReactNode }) {
  const account = await getAccount();
  if (!account.inactive) return <>{children}</>;
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">Votre accès est désactivé</h1>
      <p className="text-muted">Le responsable de votre agence a suspendu votre accès à Immolia. Contactez-le pour le rétablir.</p>
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarWithAccount />
      </Suspense>
      <main className="min-w-0 flex-1">
        <Suspense>
          <ActiveGate>{children}</ActiveGate>
        </Suspense>
      </main>
    </div>
  );
}
