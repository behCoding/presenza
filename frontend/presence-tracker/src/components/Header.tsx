import type React from "react";
import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ThemeContext from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  showThemeToggle?: boolean;
  showSignOut?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showThemeToggle = true,
  showSignOut = true,
}) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const buttonText = () => {
    if (showSignOut) {
      return "Sign Out";
    } else if (title === "Login") {
      return "Register";
    } else if (title === "Register") {
      return "Login";
    }
  };

  const handleButtonClick = () => {
    if (showSignOut) {
      navigate("/login", { replace: true });
      setTimeout(() => logout(), 0);
    } else if (title === "Login") {
      navigate("/register");
    } else if (title === "Register") {
      navigate("/login");
    }
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Function to render the appropriate icon based on the page title
  const renderHeaderIcon = () => {
    if (title.includes("Employee")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${isDark ? "text-teal-400" : "text-teal-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    } else if (title.includes("Admin")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${isDark ? "text-teal-400" : "text-teal-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    } else if (title === "Login") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${isDark ? "text-teal-400" : "text-teal-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      );
    } else if (title === "Register") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${isDark ? "text-teal-400" : "text-teal-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      );
    } else {
      // Default icon (clock)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${isDark ? "text-teal-400" : "text-teal-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  return (
    <header
      className={`${
        isDark
          ? "bg-gray-800 border-gray-700"
          : "bg-gradient-to-r from-blue-50 to-white border-gray-200"
      } border-b shadow-sm sticky top-0 z-20 transition-colors duration-200`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`h-10 w-10 rounded-lg ${
                  isDark ? "bg-teal-600/20" : "bg-teal-100"
                } flex items-center justify-center`}
              >
                {renderHeaderIcon()}
              </div>
            </div>
            <div
              className={`ml-3 border-l-4 ${
                isDark ? "border-teal-400" : "border-teal-500"
              } pl-3`}
            >
              <h1
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                {title}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {showThemeToggle && (
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  isDark
                    ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                } transition-colors duration-200`}
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              >
                {isDark ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            )}
            {!showSignOut && (
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {title === "Login"
                  ? `Don't have an account?`
                  : `Have an account?`}
              </p>
            )}
            <button
              onClick={handleButtonClick}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white transition-all duration-200 ease-in-out shadow-sm cursor-pointer ${
                showSignOut
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  : "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
              }`}
              aria-label={buttonText()}
            >
              {showSignOut ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              ) : title === "Login" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              )}
              {buttonText()}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {showThemeToggle && (
              <button
                onClick={toggleTheme}
                className={`p-2 mr-2 rounded-full ${
                  isDark
                    ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                } transition-colors duration-200`}
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              >
                {isDark ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-md ${
                isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div
            className={`px-2 pt-2 pb-3 space-y-1 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            {!showSignOut && (
              <p
                className={`block px-3 py-2 text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {title === "Login"
                  ? `Don't have an account?`
                  : `Have an account?`}
              </p>
            )}
            <button
              onClick={handleButtonClick}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white ${
                showSignOut
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  : "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
              }`}
            >
              {buttonText()}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
