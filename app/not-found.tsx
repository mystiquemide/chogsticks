import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-4 px-4 py-20"
    >
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="font-display text-5xl uppercase">No Chog here</h1>
      <p className="text-muted">
        Chog ids run from <span className="font-mono">1</span> to{" "}
        <span className="font-mono">1969</span>. Pick one and see its pack.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/try"
          className="ink-border press rounded-full bg-chog-pink px-5 py-2 font-display text-lg uppercase text-white shadow-hard"
        >
          Try a pack
        </Link>
        <Link
          href="/"
          className="ink-border press rounded-full bg-white px-5 py-2 font-display text-lg uppercase shadow-hard"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
