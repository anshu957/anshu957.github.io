import { useEffect, useState } from "react";

const PhaseIcon = ({ dark }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ display: "block", transition: "transform 400ms ease" }}
  >
    {/* outer ring */}
    <circle
      cx="12"
      cy="12"
      r="9.5"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    {/* filled half — right in light mode, left in dark */}
    <path
      d={dark
        ? "M12 2.5 A9.5 9.5 0 0 0 12 21.5 Z"
        : "M12 2.5 A9.5 9.5 0 0 1 12 21.5 Z"}
      fill="currentColor"
      opacity="0.9"
    />
    {/* sine-wave divider */}
    <path
      d="M12 2.5 C10 7 14 12 12 17 C10 19.5 12 21.5 12 21.5"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
    {/* small inner circle accent */}
    <circle
      cx={dark ? "9" : "15"}
      cy="12"
      r="2"
      fill={dark ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.2"
      opacity="0.7"
    />
  </svg>
);

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ac-dark") === "1";
    const prefDark = !stored && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = localStorage.getItem("ac-dark") !== null ? stored : prefDark;
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
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: "2.4rem",
        height: "2.4rem",
        borderRadius: "50%",
        border: `1.5px solid ${dark ? "rgba(136,152,192,0.32)" : "rgba(160,104,32,0.28)"}`,
        background: dark
          ? "rgba(136, 152, 192, 0.10)"
          : "rgba(200, 154, 82, 0.14)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: dark ? "#8898c0" : "#9a6018",
        transition: "all 280ms ease",
        boxShadow: dark
          ? "0 2px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 2px 10px rgba(200,154,82,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
        flexShrink: 0,
      }}
    >
      <PhaseIcon dark={dark} />
    </button>
  );
}
