"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PostJobButton } from "./PostJobButton";
import { Bookmark, Bell, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    const checkBookmarks = () => {
      try {
        const saved = localStorage.getItem("sw3_bookmarks");
        if (saved) {
          const ids = JSON.parse(saved);
          setBookmarkCount(Array.isArray(ids) ? ids.length : 0);
        }
      } catch (e) {}
    };
    checkBookmarks();
    window.addEventListener("storage", checkBookmarks);
    // Custom event to update counter when a bookmark is added/removed in the same window
    window.addEventListener("sw3_bookmarks_changed", checkBookmarks);
    return () => {
      window.removeEventListener("storage", checkBookmarks);
      window.removeEventListener("sw3_bookmarks_changed", checkBookmarks);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#231b42] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.svg" alt="Swiss Web3 Jobs" className="h-7 w-auto shrink-0" />
            
          </div>
          <div className="flex items-center gap-3">
            <PostJobButton />
            <button
              onClick={() => setIsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Open Menu"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setIsOpen(false)}></div>
          <div className="relative flex w-72 md:w-80 flex-col justify-between border-l border-white/10 bg-[#1c1836] p-6 shadow-2xl transition-transform">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Menü</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="mt-8 flex flex-col gap-4">
                <Link
                  href="/?bookmarked=true"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors font-medium text-base"
                >
                  <Bookmark className="w-5 h-5 text-slate-300" />
                  Gespeicherte Jobs
                  {bookmarkCount > 0 && (
                    <span className="bg-[#e04f38]/20 text-[#e04f38] px-2 py-0.5 rounded text-xs ml-auto font-bold">
                      {bookmarkCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setAlertOpen(true);
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors font-medium text-base text-left w-full"
                >
                  <Bell className="w-5 h-5 text-slate-300" />
                  Job-Alert einrichten
                </button>
              </nav>
            </div>
            
            <div className="border-t border-white/10 pt-6">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Für Arbeitgeber</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/post-a-job"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  + Inserat aufgeben
                </Link>
                <Link
                  href="/employer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors font-medium text-base"
                >
                  <LayoutDashboard className="w-5 h-5 text-slate-300" />
                  Employer Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertOpen && <JobAlertModal onClose={() => setAlertOpen(false)} />}
    </>
  );
}

function JobAlertModal({ onClose }: { onClose: () => void }) {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Suchabo aktiviert!</h3>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Verpasse keine Web3-Stellen</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="sr-only" htmlFor="email">E-Mail-Adresse</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Deine E-Mail-Adresse"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="category">Kategorie</label>
                <select
                  id="category"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                >
                  <option>Alle Kategorien</option>
                  <option>Dev & Smart Contracts</option>
                  <option>Legal & Compliance</option>
                  <option>Banking & Finance</option>
                  <option>Marketing & BD</option>
                </select>
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-[#ea580c] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d94e08]"
              >
                Suchabo speichern
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
