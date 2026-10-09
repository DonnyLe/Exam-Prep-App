"use client";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  BookOpen,
  CalendarDays,
  Home,
  BarChart3,
  GraduationCap,
  Moon,
  Sun,
  Plus,
  ArrowUpRight,
} from "lucide-react";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const demo = pathname === "/demo";
  const base = demo ? "/demo" : "/dashboard";
  const view = params.get("view") ?? "today";
  useEffect(() => {
    const theme = localStorage.getItem("exam-prep-theme") === "dark";
    setDark(theme);
    document.documentElement.classList.toggle("dark", theme);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const encoded = encodeURIComponent(timezone);
    if (!document.cookie.split("; ").includes(`study_timezone=${encoded}`)) {
      document.cookie = `study_timezone=${encoded}; path=/; SameSite=Lax`;
      router.refresh();
    }
  }, [router]);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("exam-prep-theme", next ? "dark" : "light");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href={base} className="brand">
          <span className="brand-mark">
            <Sparkles size={30} strokeWidth={2.5} />
          </span>{" "}
          Exam Prep<span className="brand-dot">•</span>
        </Link>
        <button
          className="mobile-theme icon-button"
          aria-label={dark ? "Use light mode" : "Use dark mode"}
          onClick={toggleTheme}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="nav-label">YOUR WORKSPACE</span>
        <nav>
          {[
            ["today", "Today", Home],
            ["exams", "Exams", GraduationCap],
            ["schedule", "Schedule", CalendarDays],
            ["progress", "Progress", BarChart3],
          ].map(([key, label, Icon]) => {
            const I = Icon as typeof Home;
            return (
              <Link
                key={key as string}
                href={`${base}?view=${key}`}
                className={`nav-item ${view === key && pathname === base ? "active" : ""}`}
              >
                <I size={20} />
                {label as string}
                {key === "today" && <span className="nav-pill">✦</span>}
              </Link>
            );
          })}
        </nav>
        <Link
          className="sidebar-create"
          href={demo ? "/login" : "/create-exam"}
        >
          <Plus size={17} /> New exam
        </Link>
        <div className="sidebar-bottom">
          <div className="pep-card">
            <span className="pep-star">✦</span>
            <strong>
              Small steps.
              <br />
              Big possibilities.
            </strong>
            <p>Your future self will thank you.</p>
            <span className="pep-line" />
          </div>
          <button className="theme-button" onClick={toggleTheme}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}{" "}
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <Link className="account-link" href="/login">
            <BookOpen size={16} /> Account <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}
