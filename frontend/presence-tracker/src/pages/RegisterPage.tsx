import type React from "react";
import { useState, useContext } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import IntlTelInput from "intl-tel-input/reactWithUtils";
import "intl-tel-input/build/css/intlTelInput.css";
import { RegisterUser, SendOtp, VerifyOtp } from "../api/loginApi";
import type { RegisterInputs } from "../types";
import ThemeContext from "../context/ThemeContext";
import OtpPopup from "../components/OtpPopup";

const RegisterPage: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterInputs>();
  const navigate = useNavigate();
  const emailSuffix = "@storelink.it";
  const [workEmail, setWorkEmail] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidPhone, setIsValidPhone] = useState<boolean | null>(null);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [phoneNumberFocus, setPhoneNumberFocus] = useState(false);
  const [workEmailFocus, setWorkEmailFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [confirmPasswordFocus, setConfirmPasswordFocus] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const formPassword = watch("password", "");
  const confirmFormPassword = watch("confirmPassword", "");

  const handleNumberChange = (number: string) => {
    setValue("phoneNumber", number);
  };

  const handleWorkEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWorkEmail(value);
    setShowSuggestions(value.length > 3 && !value.includes("@"));

    if (isEmailVerified) {
      setIsEmailVerified(false);
    }
  };

  const handleSuggestionClick = () => {
    const suggestedEmail = `${workEmail}${emailSuffix}`;
    setWorkEmail(suggestedEmail);
    setValue("workEmail", suggestedEmail);
    setShowSuggestions(false);
  };

  const handleOnUsernameEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && showSuggestions) {
      e.preventDefault();
      handleSuggestionClick();
      clearErrors("workEmail");
      setFocus("password");
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    await toast.promise(VerifyOtp(workEmail, otp), {
      pending: "Verifying...",
      success: "Email verified successfully!",
      error: "Email verification failed. Please try again.",
    });
    setIsEmailVerified(true);
    setShowOtpPopup(false);
    setIsRegistering(false);
  };

  const handleRegister: SubmitHandler<RegisterInputs> = async (data) => {
    if (formPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(formPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(formPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    if (!/[!@#$%^&*]/.test(formPassword)) {
      toast.error(
        "Password must contain at least one special character (!@#$%^&*)"
      );
      return;
    }

    if (formPassword !== confirmFormPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!isValidPhone) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setIsRegistering(true);

    if (!isEmailVerified) {
      if (!workEmail || !workEmail.endsWith(emailSuffix)) {
        toast.error(`Email must end with ${emailSuffix}`);
        return;
      }

      await SendOtp(workEmail);
      toast.info(`Verification code sent to ${workEmail}`);
      setShowOtpPopup(true);
      return;
    }

    const body = {
      name: data.name,
      surname: data.surname,
      job_start_date: new Date(data.jobStartDate).toLocaleDateString("en-CA"),
      full_time: data.fullTime,
      phone_number: data.phoneNumber,
      personal_email: data.personalEmail,
      work_email: data.workEmail,
      password: data.password,
    };

    try {
      console.log("Register", body);
      await toast.promise(RegisterUser(body), {
        pending: "Registering...",
        success: "Registration successfull! Please log in.",
        error: "Registration failed. Please try again.",
      });
      reset();
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const inputClasses = `w-full border ${
    isDark ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
  } rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500`;
  const labelClasses = `block text-left text-sm font-medium mb-1.5 ${
    isDark ? "text-gray-300" : "text-gray-700"
  }`;

  return (
    <div
      className={`login flex flex-col flex-grow justify-center items-center ${
        isDark
          ? "bg-gray-900 dark-input"
          : "bg-gradient-to-br from-blue-50 via-white to-gray-100"
      }`}
      onClick={() => setShowSuggestions(false)}
    >
      <div
        className={`${
          isDark ? "bg-gray-800" : "bg-white"
        } px-8 py-6 rounded-xl text-center flex flex-col gap-6 shadow-2xl w-full max-w-4xl mx-4 my-8`}
      >
        <div>
          <h2
            className={`font-semibold text-2xl ${
              isDark ? "text-white" : "text-gray-800"
            } mb-2`}
          >
            Create Your Account
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Fill in your information to get started
          </p>
        </div>

        <form
          className={`grid grid-cols-1 md:grid-cols-2 gap-5 text-start ${
            isDark && "dark"
          }`}
        >
          <div>
            <label className={labelClasses}>First Name</label>
            <input
              type="text"
              placeholder="Enter your first name"
              autoComplete="off"
              {...register("name", { required: true })}
              className={`${inputClasses} ${
                errors.name ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
          </div>
          <div>
            <label className={labelClasses}>Last Name</label>
            <input
              type="text"
              placeholder="Enter your last name"
              autoComplete="off"
              {...register("surname", { required: true })}
              className={`${inputClasses} ${
                errors.surname ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
          </div>
          <div>
            <label className={labelClasses}>Job Start Date</label>
            <input
              type="date"
              {...register("jobStartDate", { required: true })}
              className={`${inputClasses} ${
                errors.jobStartDate ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
          </div>
          <div>
            <label className={labelClasses}>Phone Number</label>
            <div
              className={`flex justify-between ${inputClasses} ${
                errors.phoneNumber ? "border-red-500 focus:ring-red-500" : ""
              } ${
                phoneNumberFocus && "ring-1 ring-teal-500 border-teal-500"
              } flex-grow`}
              onClick={() => setFocus("phoneNumber")}
            >
              <IntlTelInput
                onChangeNumber={handleNumberChange}
                onChangeValidity={setIsValidPhone}
                initOptions={{
                  initialCountry: "it",
                }}
                inputProps={{
                  onFocus: () => setPhoneNumberFocus(true),
                  onBlur: () => setPhoneNumberFocus(false),
                  className: `w-full border-0 outline-none ${
                    isDark ? "text-white" : "text-gray-900"
                  }`,
                }}
                {...register("phoneNumber", { required: true })}
              />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Personal Email</label>
            <input
              type="email"
              placeholder="Enter your personal email"
              autoComplete="off"
              {...register("personalEmail", { required: true })}
              className={`${inputClasses} ${
                errors.personalEmail ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
          </div>
          <div>
            <label className={labelClasses}>Work Email</label>
            <div className="relative">
              <div
                className={`flex justify-between ${inputClasses} ${
                  errors.workEmail ? "border-red-500 focus:ring-red-500" : ""
                } ${
                  workEmailFocus && "ring-1 ring-teal-500 border-teal-500"
                } flex-grow`}
                onClick={() => setFocus("workEmail")}
              >
                <input
                  type="email"
                  placeholder="Enter your work email"
                  autoComplete="off"
                  {...register("workEmail", { required: true })}
                  value={workEmail}
                  onChange={handleWorkEmailChange}
                  onFocus={() => setWorkEmailFocus(true)}
                  onBlur={() => {
                    setWorkEmailFocus(false);
                  }}
                  onKeyUp={handleOnUsernameEnter}
                  className={`border-0 w-full focus:outline-none ${
                    isDark ? "text-white placeholder-gray-400" : "text-gray-900"
                  }`}
                />
                {isEmailVerified && (
                  <div className="ml-2 text-green-500 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {showSuggestions && (
                <div
                  className={`${
                    isDark
                      ? "bg-teal-900 text-teal-100"
                      : "bg-teal-100 text-teal-800"
                  } p-2.5 rounded-b-lg w-full text-center -mt-1 absolute box-border cursor-pointer overflow-hidden truncate border-t-0 border ${
                    isDark ? "border-teal-800" : "border-teal-200"
                  }`}
                  onClick={handleSuggestionClick}
                >
                  {workEmail}@storelink.it
                </div>
              )}
            </div>
          </div>
          <div>
            <label className={labelClasses}>Password</label>
            <div
              className={`flex justify-between ${inputClasses} ${
                errors.password ? "border-red-500 focus:ring-red-500" : ""
              } ${
                passwordFocus ? "ring-1 ring-teal-500 border-teal-500" : ""
              } flex-grow`}
              onClick={() => setFocus("password")}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="off"
                {...register("password", { required: true })}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                className={`border-0 w-full focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
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
          <div>
            <label className={labelClasses}>Confirm Password</label>
            <div
              className={`flex justify-between ${inputClasses} ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500"
                  : ""
              } ${
                confirmPasswordFocus
                  ? "ring-1 ring-teal-500 border-teal-500"
                  : ""
              } flex-grow`}
              onClick={() => setFocus("confirmPassword")}
            >
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                autoComplete="off"
                {...register("confirmPassword", { required: true })}
                onFocus={() => setConfirmPasswordFocus(true)}
                onBlur={() => setConfirmPasswordFocus(false)}
                className={`border-0 w-full focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={`focus:outline-none ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {!showConfirmPassword ? (
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
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              id="fullTime"
              {...register("fullTime")}
              className={`h-4 w-4 ${
                isDark
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
              } rounded focus:ring-teal-500`}
            />
            <label
              htmlFor="fullTime"
              className={`${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Full Time employee
            </label>
          </div>
        </form>
        <button
          type="submit"
          onClick={handleSubmit(handleRegister)}
          disabled={isRegistering}
          className={`w-full cursor-pointer p-3 text-white text-lg font-medium rounded-lg transition-all duration-300 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-sm`}
        >
          {isRegistering ? "Registering..." : "Register"}
        </button>
      </div>

      {/* OTP Verification Popup */}
      <OtpPopup
        isOpen={showOtpPopup}
        onClose={() => setShowOtpPopup(false)}
        onVerify={handleVerifyOtp}
        email={workEmail}
      />
    </div>
  );
};

export default RegisterPage;
