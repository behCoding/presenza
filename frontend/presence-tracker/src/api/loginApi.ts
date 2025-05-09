import axios from "axios";
import { LoginResponse, RegisterApiBody } from "../types";
import { handleApiCall } from "../utils/apiUtils";

const baseUrl: string = "/api";

export const LoginUser = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  return handleApiCall<LoginResponse>(
    () =>
      axios.post(
        `${baseUrl}/token`,
        new URLSearchParams({
          username: username,
          password: password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      ),
    "Login"
  );
};

export const SendOtp = async (email: string): Promise<void> => {
  return handleApiCall<void>(
    () => axios.post(`${baseUrl}/send_otp`, { email }),
    "SendOtp"
  );
};

export const VerifyOtp = async (email: string, otp: string): Promise<void> => {
  return handleApiCall<void>(
    () => axios.post(`${baseUrl}/verify_otp`, { email, otp }),
    "VerifyOtp"
  );
};

export const UpdatePassword = async (
  email: string,
  password: string
): Promise<void> => {
  return handleApiCall<void>(
    () =>
      axios.put(`${baseUrl}/users/change-password`, {
        work_email: email,
        new_password: password,
      }),
    "UpdatePassword"
  );
};

export const RegisterUser = async (data: RegisterApiBody): Promise<void> => {
  return handleApiCall<void>(
    () => axios.post(`${baseUrl}/register`, data),
    "Register"
  );
};
