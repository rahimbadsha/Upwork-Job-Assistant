"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Tag,
  Briefcase,
  BarChart3,
  LogOut,
  Bookmark,
  Eye,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "All Jobs", icon: Briefcase },
  { href: "/jobs?status=SAVED", label: "Saved", icon: Bookmark },
  { href: "/jobs?status=VIEWED", label: "Viewed", icon: Eye },
  { href: "/jobs?status=SKIPPED", label: "Skipped", icon: SkipForward },
  { href: "/keywords", label: "Keywords", icon: Tag },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-slate-100 px-3 py-6">
      <div className="px-3 mb-8">
        <h1 className="text-xl font-bold text-white">Upwork Assistant</h1>
        <p className="text-xs text-slate-400 mt-1">Job Finder</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href.split("?")[0] && !item.href.includes("?")
            ? pathname === item.href
            : pathname + (typeof window !== "undefined" ? window.location.search : "") === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href.split("?")[0] && item.href === "/jobs"
                  ? "bg-slate-700 text-white"
                  : isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4 bg-slate-700" />

      <Button
        variant="ghost"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3"
      >
        <LogOut size={16} />
        Sign Out
      </Button>
    </aside>
  );
}
