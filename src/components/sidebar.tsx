"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Pesanan" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 h-screen sticky top-0 shrink-0 bg-warm-800 flex flex-col relative overflow-hidden">
      {/* ponytail: subtle steam pattern, CSS only */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, #FFF8F0 1px, transparent 1px), radial-gradient(circle at 70% 30%, #FFF8F0 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative p-5 border-b border-warm-700">
        <div className="flex items-center gap-2.5">
          {/* coffee cup mark */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            className="text-accent shrink-0"
          >
            <path
              d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 2.5c-.5.6-.5 1.4 0 2M11.5 2.5c-.5.6-.5 1.4 0 2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <h1 className="text-base font-bold text-cream tracking-tight leading-none">
              Kedai Ops
            </h1>
            <p className="text-[10px] text-warm-400 tracking-[0.2em] uppercase mt-1">
              Admin
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-accent/60 via-accent/20 to-transparent" />
      </div>

      <nav className="relative flex-1 p-3 space-y-1">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "text-cream font-medium"
                  : "text-warm-300 hover:text-cream hover:bg-warm-700"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent" />
              )}
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative p-3 border-t border-warm-700">
        <LogoutButton />
      </div>
    </aside>
  );
}