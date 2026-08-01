import { Reveal } from "../motion";

export function PageScaffold({
  title,
}: {
  title: string;
}) {
  return (
    <main className="mx-auto max-w-[1920px] page-px py-12">
      <Reveal>
        <h1 className="text-[26px] font-semibold text-(--color-wildbook-text)">
          {title}
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-3 max-w-[820px] text-(--color-wildbook-muted)">
          This page is wired up with React Router. Replace this scaffold with the
          real content when you’re ready.
        </p>
      </Reveal>
    </main>
  );
}
