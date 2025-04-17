import { useContext, useRef, useEffect, useState, useMemo } from "react";
import type React from "react";
import ThemeContext from "../context/ThemeContext";
import { SendOtp } from "../api/loginApi";

interface OtpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  email: string;
}

const OtpPopup: React.FC<OtpPopupProps> = ({
  isOpen,
  onClose,
  onVerify,
  email,
}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const popupRef = useRef<HTMLDivElement>(null);
  const [isResending, setIsResending] = useState(false);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRef3 = useRef<HTMLInputElement>(null);
  const inputRef4 = useRef<HTMLInputElement>(null);
  const inputRef5 = useRef<HTMLInputElement>(null);
  const inputRef6 = useRef<HTMLInputElement>(null);

  const inputRefs = useMemo(
    () => [inputRef1, inputRef2, inputRef3, inputRef4, inputRef5, inputRef6],
    []
  );

  // Focus first input when popup opens
  useEffect(() => {
    if (isOpen && inputRefs[0].current) {
      // Prevent scrolling when popup is open
      document.body.style.overflow = "hidden";

      // Focus the first input when popup opens
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, inputRefs]);

  const handleInputChange = (index: number, value: string) => {
    // Move to next input if current input is filled
    if (value && index < inputRefs.length - 1 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Move to previous input on backspace if current input is empty
    if (
      e.key === "Backspace" &&
      !inputRefs[index].current?.value &&
      index > 0
    ) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = () => {
    const otp = inputRefs.map((ref) => ref.current?.value || "").join("");
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      pastedData.split("").forEach((char, index) => {
        if (index < inputRefs.length && inputRefs[index].current) {
          inputRefs[index].current!.value = char;
        }
      });

      // Focus the input after the last pasted character
      const focusIndex = Math.min(pastedData.length, inputRefs.length - 1);
      inputRefs[focusIndex].current?.focus();
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    await SendOtp(email);

    // Clear existing inputs
    inputRefs.forEach((ref) => {
      if (ref.current) ref.current.value = "";
    });
    // Focus first input
    if (inputRefs[0].current) inputRefs[0].current.focus();

    setIsResending(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
      {/* Backdrop without click handler */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div
        ref={popupRef}
        className={`${
          isDark ? "bg-gray-800" : "bg-white"
        } rounded-xl shadow-xl w-full max-w-md p-6 text-center relative`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-full cursor-pointer ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          } z-10`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h2
          className={`text-2xl font-semibold ${
            isDark ? "text-white" : "text-gray-800"
          } mb-4`}
        >
          Verify Your Email
        </h2>

        <p className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-6`}>
          We've sent a verification code to{" "}
          <span className="font-medium">{email}</span>
        </p>

        <div className={`flex justify-center gap-2 mb-6 ${isDark && "dark"}`}>
          {inputRefs.map((ref, index) => (
            <input
              key={index}
              ref={ref}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className={`w-12 h-14 text-center text-xl font-bold rounded-md ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:border-teal-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-teal-600"
              } border-2 focus:outline-none focus:ring-1 focus:ring-teal-500`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // Allow only numbers
                const value = e.target.value.replace(/[^0-9]/g, "");
                e.target.value = value;
                handleInputChange(index, value);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                handleKeyDown(index, e)
              }
              onPaste={index === 0 ? handlePaste : undefined}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-medium w-full transition-all duration-200 shadow-sm cursor-pointer"
        >
          Verify
        </button>

        <div className="mt-4 text-sm">
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Didn't receive the code?{" "}
            <button
              className={`${
                isDark ? "text-teal-400" : "text-teal-600"
              } font-medium hover:underline ${
                isResending ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleResendOtp}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpPopup;
