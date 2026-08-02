import { Link } from "react-router-dom";

export function AccessUnavailablePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[1920px] items-center justify-center page-px py-12">
      <section className="max-w-[760px] rounded-xl border border-black/10 bg-white p-8 text-center">
        <h1 className="text-[20px] font-semibold text-(--color-wildbook-text) sm:text-[22px] md:text-[26px]">
          Access Restricted
        </h1>
        <p className="mt-4 text-(--color-wildbook-muted)">
          Sign in with Google to access the application.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded bg-(--color-wildbook-teal) px-5 py-2 text-[10px] font-semibold text-(--color-wildbook-cream)"
        >
          Login
        </Link>
      </section>
    </main>
  );
}
