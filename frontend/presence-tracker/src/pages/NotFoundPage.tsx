import { useContext } from "react";
import { Link } from "react-router-dom";
import ThemeContext from "../context/ThemeContext";

const NotFoundPage = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${
        isDark ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="text-center max-w-md md:max-w-lg">
        <div className="text-7xl md:text-8xl mb-6">😕</div>

        <h1
          className={`text-4xl md:text-5xl font-bold ${
            isDark ? "text-gray-50" : "text-gray-800"
          } mb-4`}
        >
          404 - Page Not Found
        </h1>

        <p
          className={`text-lg ${
            isDark ? "text-gray-400" : "text-gray-600"
          } mb-8`}
        >
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to={"/"}
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md transition duration-300"
        >
          Go Back Home
        </Link>

        <p
          className={`mt-8 text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Need help?{" "}
          <a
            href="mailto:support@example.com"
            className={`${
              isDark ? "text-blue-400" : "text-blue-600"
            } hover:underline`}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
