"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Date du jour, calculée dans le navigateur (fuseau horaire de l'agent). */
export function TodayLabel() {
  const label = useSyncExternalStore(
    subscribe,
    () => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    () => "Aujourd'hui",
  );
  return <span className="inline-block first-letter:uppercase">{label}</span>;
}
