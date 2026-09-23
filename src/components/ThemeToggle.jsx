import { useEffect, useState } from "react";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.1" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
      <line x1="12" y1="2.5" x2="12" y2="5.2" />
      <line x1="12" y1="18.8" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5.2" y2="12" />
      <line x1="18.8" y1="12" x2="21.5" y2="12" />
      <line x1="5.3" y1="5.3" x2="7.2" y2="7.2" />
      <line x1="16.8" y1="16.8" x2="18.7" y2="18.7" />
      <line x1="16.8" y1="7.2" x2="18.7" y2="5.3" />
      <line x1="5.3" y1="18.7" x2="7.2" y2="16.8" />
    </g>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M 15.8 4.2 A 8.2 8.2 0 1 0 19.8 16.4 A 6.4 6.4 0 1 1 15.8 4.2 Z"
      fill="currentColor"
    />
    <circle cx="16.8" cy="9.2" r="0.75" fill="currentColor" opacity="0.28" />
    <circle cx="14.6" cy="12.8" r="0.55" fill="currentColor" opacity="0.22" />
  </svg>
);

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("ac-dark") === "1";
    setDark(isDark);
    setMounted(true);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("ac-dark", next ? "1" : "0");
      return next;
    });
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      className="ms-theme-switch"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
    >
      <span className="ms-theme-track" aria-hidden="true">
        <span className="ms-theme-end ms-theme-end--sun">
          <SunIcon />
        </span>
        <span className="ms-theme-end ms-theme-end--moon">
          <MoonIcon />
        </span>
        <span className="ms-theme-thumb">
          {dark ? <MoonIcon /> : <SunIcon />}
        </span>
      </span>
    </button>
  );
}
