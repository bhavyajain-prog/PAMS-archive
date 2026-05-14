// Update the back button and check the forms submission process working perfectly!
// Create the new pages needed by the admin and mentor to finally accept the forms
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import axios from "../services/axios";

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
};

const Header = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed (non-blocking):", err);
    } finally {
      setUser(null);
      setShowDropdown(false);
      navigate("/login");
    }
  };

  const getDashboardRoute = () => {
    if (!user || !user.role) return "/";
    if (user.role === "admin") return "/admin/home";
    if (user.role === "mentor") return "/mentor/home";
    if (user.role === "student") return "/home";
    if (user.role === "dev") return "/dev";
    return "/";
  };

  const path = location.pathname;

  const isMinimalOnlyLogo = ["/login", "/notfound"].includes(path);
  const isResetFlow =
    path === "/forgot-password" || path.startsWith("/reset-password");
  const isHomePage = ["/admin/home", "/mentor/home", "/home"].includes(path);

  return (
    <header
      className={`bg-surface backdrop-blur-md py-3 px-6 relative min-h-[70px] z-10 border-b border-edge transition-all duration-300 ${
        scrolled ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <div className="max-w-screen-xl mx-auto relative min-h-[50px]">
        {isMinimalOnlyLogo ? (
          // Only logo centered
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <a href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                PAMS
              </span>
            </a>
          </div>
        ) : (
          <>
            {/* Left - Back button */}
            {!isHomePage && (
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                <button
                  onClick={() => {
                    isResetFlow
                      ? navigate("/login")
                      : navigate(getDashboardRoute());
                  }}
                  className="bg-primary-subtle text-primary font-medium py-2 px-4 rounded-lg hover:opacity-80 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{isResetFlow ? "Back to Login" : "Home"}</span>
                </button>
              </div>
            )}

            {/* Center - Logo */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <a href="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  PAMS
                </span>
              </a>
            </div>

            {/* Right - Theme Toggle + Profile */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-surface-alt border border-edge hover:border-primary/30 transition-all duration-200"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-yellow-400">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              {user && !isResetFlow && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 bg-surface border border-edge hover:border-primary/30 rounded-full py-2 px-4 shadow-sm hover:shadow transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white flex items-center justify-center font-semibold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="hidden md:block font-medium text-heading max-w-[120px] truncate">
                      {toTitleCase(user.name) || "User"}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-muted transition-transform duration-200"
                      style={{
                        transform: showDropdown
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface backdrop-blur-md rounded-lg shadow-lg py-1 z-20 border border-edge">
                      <div className="px-4 py-2 border-b border-edge">
                        <p className="text-sm font-medium text-heading">
                          {toTitleCase(user.name)}
                        </p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                      <div className="px-4 py-2 text-xs text-muted">
                        Role:{" "}
                        <span className="capitalize font-medium text-body">
                          {user.role}
                        </span>
                      </div>
                      <div className="px-2 py-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-2 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded font-medium"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
