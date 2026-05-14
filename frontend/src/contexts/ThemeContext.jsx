import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

/**
 * Resolves the effective theme ('light' or 'dark') from a preference.
 * If preference is 'system', checks the OS-level setting.
 */
function resolveTheme(preference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return preference;
}

/**
 * Applies the resolved theme to the <html> element by toggling the `dark` class.
 */
function applyTheme(resolvedTheme) {
  const root = document.documentElement;
  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem("pams-theme") || "system";
    } catch {
      return "system";
    }
  });

  const resolvedTheme = resolveTheme(preference);

  // Apply theme on mount and whenever preference changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for OS theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => applyTheme(e.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [preference]);

  // Persist preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pams-theme", preference);
    } catch {
      // Silently ignore storage errors (e.g. private browsing)
    }
  }, [preference]);

  const setTheme = useCallback((newPreference) => {
    setPreference(newPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = resolveTheme(prev);
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,    // 'light' | 'dark'
        preference,              // 'light' | 'dark' | 'system'
        setTheme,                // set explicit preference
        toggleTheme,             // flip between light ↔ dark
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
