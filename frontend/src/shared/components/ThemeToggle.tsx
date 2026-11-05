import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface ThemeToggleProps {
  variant?: "sidebar" | "surface";
}

export default function ThemeToggle({ variant = "sidebar" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const styles = variant === "sidebar"
    ? "text-white/85 hover:bg-white/10 hover:text-white"
    : "text-heading hover:bg-surface-cream";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${styles}`}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
