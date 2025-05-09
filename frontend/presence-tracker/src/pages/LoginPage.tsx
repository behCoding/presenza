import type React from "react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import AuthContext from "../context/AuthContext";
import ThemeContext from "../context/ThemeContext";
import { LoginUser } from "../api/loginApi";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import { jwtDecode } from "jwt-decode";
import { AxiosError } from "axios";

type LoginInputs = {
  username: string;
  password: string;
};

interface ApiErrorResponse {
  detail?: string;
}

const LoginPage: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<LoginInputs>({
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const emailSuffix = "@storelink.it";
  const [showPassword, setShowPassword] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setShowSuggestions(value.length > 3 && !value.includes("@"));
    setSuggestion(`${value}${emailSuffix}`);

    if (value.endsWith(emailSuffix)) {
      setValue("username", value);
      clearErrors("username");
    }
  };

  const handleSuggestionClick = () => {
    const name = getValues("username");
    setValue("username", `${name}${emailSuffix}`);
    setShowSuggestions(false);
    clearErrors("username");
  };

  const handleOnUsernameEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && showSuggestions) {
      e.preventDefault();
      setValue("username", suggestion);
      setShowSuggestions(false);
      clearErrors("username");
      setFocus("password");
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@storelink\.it$/;

    if (!emailRegex.test(value)) {
      toast.error(`Email must end with ${emailSuffix}`);
    }

    return emailRegex.test(value) || `Email must end with ${emailSuffix}`;
  };

  const handleOnPasswordEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin({
        username: getValues("username"),
        password: getValues("password"),
      });
    }
  };

  const handleLogin: SubmitHandler<LoginInputs> = async (data) => {
    // Create initial loading toast
    const toastId = toast.loading("Logging in...", {
      pauseOnFocusLoss: false,
      pauseOnHover: false,
      hideProgressBar: true,
    });

    try {
      const response = await LoginUser(data.username, data.password);
      const { access_token, role, user_id } = response;

      try {
        const decodedToken = jwtDecode(access_token);

        if (!decodedToken.exp) {
          throw new Error("Token expiration not found");
        }

        login(access_token, role, user_id, new Date(decodedToken.exp * 1000));

        toast.update(toastId, {
          render: "Login successful!",
          type: "success",
          isLoading: false,
          autoClose: 1000,
        });

        navigate("/", { replace: true });
      } catch (tokenError) {
        console.error("Token decoding error:", tokenError);
        toast.update(toastId, {
          render: "Invalid token received",
          type: "error",
          isLoading: false,
          autoClose: 2000,
        });
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      let errorMessage = "Login failed. Please try again.";

      if (axiosError.response && axiosError.response.status === 401) {
        errorMessage =
          axiosError.response.data.detail || "Invalid username or password";
      } else if (axiosError.message.includes("Network Error")) {
        errorMessage = "Network error - please check your connection";
      } else {
        errorMessage = "Login failed. Please try again.";
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });

      console.error("Login error:", error);
    }
  };

  return (
    <div
      className={`login flex flex-col flex-grow justify-center items-center ${
        isDark
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-gray-100"
      }`}
      onClick={() => setShowSuggestions(false)}
    >
      <div
        className={`flex flex-col ${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-xl shadow-2xl text-center gap-8 p-8 w-full max-w-md mx-4`}
      >
        <div>
          <h2
            className={`text-3xl ${
              isDark ? "text-white" : "text-gray-800"
            } font-semibold mb-2`}
          >
            Welcome Back
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Sign in to your account
          </p>
        </div>

        <form className="flex flex-col gap-5">
          <div className="w-full relative">
            <label
              className={`block text-left text-sm font-medium mb-1.5 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <div
              className={`flex items-center gap-2 rounded-lg ${
                emailFocus &&
                (errors.username
                  ? "ring-1 ring-red-500"
                  : "ring-1 ring-teal-500")
              } ${
                isDark
                  ? "bg-gray-700 border-gray-600 dark"
                  : "bg-white border-gray-300"
              } p-3 border ${errors.username ? "border-red-500" : ""}`}
              onClick={() => setFocus("username")}
            >
              <input
                type="text"
                placeholder="Enter your email"
                autoComplete="username"
                {...register("username", {
                  required: true,
                  validate: (value) => validateEmail(value),
                })}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                onChange={handleEmailChange}
                onKeyUp={handleOnUsernameEnter}
                className={`border-0 w-full focus:outline-none ${
                  isDark
                    ? "bg-gray-700 text-white placeholder-gray-400 !important"
                    : "bg-white text-gray-900"
                }`}
              />
            </div>
            {showSuggestions && (
              <div
                className={`${
                  isDark
                    ? "bg-teal-900 text-teal-100"
                    : "bg-teal-100 text-teal-800"
                } p-2.5 rounded-b-lg w-full -mt-1 absolute box-border cursor-pointer overflow-hidden truncate border-t-0 border ${
                  isDark ? "border-teal-800" : "border-teal-200"
                }`}
                onClick={handleSuggestionClick}
              >
                {suggestion}
              </div>
            )}
          </div>

          <div className="w-full relative">
            <div className="flex justify-between items-center mb-1.5">
              <label
                className={`block text-left text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className={`text-sm ${
                  isDark
                    ? "text-teal-400 hover:text-teal-300"
                    : "text-teal-600 hover:text-teal-800"
                } font-medium focus:outline-none`}
              >
                Forgot Password?
              </button>
            </div>
            <div
              className={`flex items-center gap-2 rounded-lg ${
                passwordFocus &&
                (errors.password
                  ? "ring-1 ring-red-500"
                  : "ring-1 ring-teal-500")
              } ${
                isDark
                  ? "bg-gray-700 border-gray-600 dark"
                  : "bg-white border-gray-300"
              } p-3 border ${errors.password ? "border-red-500" : ""}`}
              onClick={() => setFocus("password")}
            >
              <input
                type={!showPassword ? "password" : "text"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password", { required: true })}
                onFocus={() => {
                  setPasswordFocus(true);
                  setShowSuggestions(false);
                }}
                onBlur={() => setPasswordFocus(false)}
                onKeyUp={handleOnPasswordEnter}
                className={`border-0 w-full focus:outline-none ${
                  isDark
                    ? "bg-gray-700 text-white placeholder-gray-400"
                    : "bg-white text-gray-900"
                }`}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className={`focus:outline-none ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {!showPassword ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z"
                      fill="currentColor"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2 12C2 13.6394 2.42496 14.1915 3.27489 15.2957C4.97196 17.5004 7.81811 20 12 20C16.1819 20 19.028 17.5004 20.7251 15.2957C21.575 14.1915 22 13.6394 22 12C22 10.3606 21.575 9.80853 20.7251 8.70433C19.028 6.49956 16.1819 4 12 4C7.81811 4 4.97196 6.49956 3.27489 8.70433C2.42496 9.80853 2 10.3606 2 12ZM12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25Z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1.60603 6.08062C2.11366 5.86307 2.70154 6.09822 2.9191 6.60585L1.99995 6.99977C2.9191 6.60585 2.91924 6.60618 2.9191 6.60585L2.91858 6.60465C2.9183 6.604 2.91851 6.60447 2.91858 6.60465L2.9225 6.61351C2.92651 6.62253 2.93339 6.63785 2.94319 6.65905C2.96278 6.70147 2.99397 6.76735 3.03696 6.85334C3.12302 7.02546 3.25594 7.27722 3.43737 7.58203C3.80137 8.19355 4.35439 9.00801 5.10775 9.81932C5.28532 10.0105 5.47324 10.2009 5.67173 10.3878C5.68003 10.3954 5.68823 10.4031 5.69633 10.4109C7.18102 11.8012 9.25227 12.9998 12 12.9998C13.2089 12.9998 14.2783 12.769 15.2209 12.398C16.4469 11.9154 17.4745 11.1889 18.3156 10.3995C19.2652 9.50815 19.9627 8.54981 20.4232 7.81076C20.6526 7.44268 20.8207 7.13295 20.9299 6.91886C20.9844 6.81192 21.0241 6.72919 21.0491 6.67538C21.0617 6.64848 21.0706 6.62884 21.0758 6.61704L21.0808 6.60585C21.2985 6.0985 21.8864 5.86312 22.3939 6.08062C22.9015 6.29818 23.1367 6.88606 22.9191 7.39369L22 6.99977C22.9191 7.39369 22.9192 7.39346 22.9191 7.39369L22.9169 7.39871L22.9134 7.40693L22.9019 7.43278C22.8924 7.4541 22.879 7.48354 22.8618 7.52048C22.8274 7.59434 22.7774 7.69831 22.7115 7.8275C22.5799 8.08566 22.384 8.44584 22.1206 8.86844C21.718 9.5146 21.152 10.316 20.4096 11.1241L21.2071 11.9215C21.5976 12.312 21.5976 12.9452 21.2071 13.3357C20.8165 13.7262 20.1834 13.7262 19.7928 13.3357L18.9527 12.4955C18.3884 12.9513 17.757 13.3811 17.0558 13.752L17.8381 14.9544C18.1393 15.4173 18.0083 16.0367 17.5453 16.338C17.0824 16.6392 16.463 16.5081 16.1618 16.0452L15.1763 14.5306C14.4973 14.7388 13.772 14.8863 13 14.9554V16.4998C13 17.0521 12.5522 17.4998 12 17.4998C11.4477 17.4998 11 17.0521 11 16.4998V14.9556C10.2253 14.8864 9.50014 14.7386 8.82334 14.531L7.83814 16.0452C7.53693 16.5081 6.91748 16.6392 6.45457 16.338C5.99165 16.0367 5.86056 15.4173 6.16177 14.9544L6.94417 13.7519C6.24405 13.3814 5.61245 12.9515 5.04746 12.4953L4.20706 13.3357C3.81654 13.7262 3.18337 13.7262 2.79285 13.3357C2.40232 12.9452 2.40232 12.312 2.79285 11.9215L3.59029 11.1241C2.74529 10.2043 2.12772 9.292 1.71879 8.605C1.5096 8.25356 1.35345 7.95845 1.2481 7.74776C1.19539 7.64234 1.15529 7.55783 1.12752 7.49771C1.11363 7.46765 1.10282 7.44366 1.09505 7.42618L1.08566 7.4049L1.08267 7.39801L1.0816 7.39553L1.08117 7.39453C1.08098 7.39409 1.08081 7.39369 1.99995 6.99977L1.08117 7.39453C0.863613 6.8869 1.0984 6.29818 1.60603 6.08062Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>

        <button
          type="submit"
          onClick={handleSubmit(handleLogin)}
          className={`w-full cursor-pointer p-3 text-white text-lg font-medium rounded-lg transition-all duration-300 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-sm`}
        >
          Sign In
        </button>

        <div
          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          Don't have an account?{" "}
          <a
            href="/register"
            className={`${
              isDark
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            } font-medium`}
          >
            Create an account
          </a>
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};

export default LoginPage;
