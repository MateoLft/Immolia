import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

/** Affiché le temps de charger le compte (sans dépendre de l'URL). */
export function SidebarSkeleton() {
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-line bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-none lg:border-r lg:border-b-0 lg:py-5">
      <div className="px-2"><Logo href="/app" /></div>
      <div className="hidden flex-col gap-3 px-3 lg:flex">
        {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-5 w-40" />)}
      </div>
    </aside>
  );
}
