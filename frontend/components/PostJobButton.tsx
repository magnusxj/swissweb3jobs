import Link from "next/link";

/** Header-CTA: führt direkt zum Inserate-Formular mit Stripe-Checkout. */
export function PostJobButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/post-a-job"
      className={`inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-slate-900 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:gap-1.5 sm:px-3.5 sm:text-sm ${className}`}
    >
      <span aria-hidden="true">+</span>
      Job inserieren
    </Link>
  );
}
