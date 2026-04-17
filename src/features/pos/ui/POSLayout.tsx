import type { ReactNode } from "react";

export function POSLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="lg:col-span-2">{left}</section>
      <aside className="lg:col-span-1">{right}</aside>
    </div>
  );
}
