import axiosInstance from "../utils/axiosInstance";
import { DefaultHours, PresenceData } from "../types";
import { handleApiCall } from "../utils/apiUtils";

export const GetDefaultTimes = async (
  userId: string
): Promise<DefaultHours> => {
  return handleApiCall<DefaultHours>(
    () =>
      axiosInstance.get(`/get-default-hours`, {
        params: { user_id: userId, submitted_by_id: userId },
      }),
    "GetDefaultTimes"
  );
};

export const PostMonthlyPresence = async (
  userId: string,
  data: PresenceData[]
): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.post(`/employee-dashboard?user_id=${userId}`, data),
    "PostMonthlyPresence"
  );
};

export const UpdataDefaultTimes = async (data: DefaultHours): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.put(`/default-hours`, data),
    "UpdataDefaultTimes"
  );
};

export const SaveDefaultTimes = async (data: DefaultHours): Promise<void> => {
  return handleApiCall<void>(
    () => axiosInstance.put(`/default-hours`, data),
    "UpdataDefaultTimes"
  );
};
