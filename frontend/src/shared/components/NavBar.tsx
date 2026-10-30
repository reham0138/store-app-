import { GitBranch, House } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="border-b border-border-subtle bg-surface-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-offset-4"
          aria-label="The Crown & Anchor home"
        >
          <img
            src="/brand/logo/the-crown-anchor-logo-black.png"
            alt=""
            className="size-12 shrink-0 object-contain"
          />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-brand-navy">
              The Crown &amp; Anchor
            </span>
            <span className="hidden text-xs tracking-[0.16em] text-text-slate sm:block">
              MORE THAN JUST A STORE
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-surface-cream focus-visible:outline-offset-2"
          >
            <House aria-hidden="true" size={18} />
            <span>Home</span>
          </Link>
          <Link
            to="/branch-test"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-surface-cream focus-visible:outline-offset-2"
          >
            <GitBranch aria-hidden="true" size={18} />
            <span>Branch</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
