import type { ReactNode } from "react";

/** A page title in the mark gradient, with an optional line under it and optional parts between. */
export function PageHead({ title, lede, children }: { title: ReactNode; lede?: ReactNode; children?: ReactNode }): React.ReactElement {
  return (
    <header className="space-y-2">
      <h1 className="font-rs-bold text-4xl leading-tight text-mark md:text-5xl">{title}</h1>
      {children}
      {lede && <p className="max-w-3xl text-lg text-mk-body">{lede}</p>}
    </header>
  );
}
