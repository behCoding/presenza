import { AxiosResponse } from "axios";

export const handleApiCall = async <T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  endpointName: string
): Promise<T> => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error(`Error at ${endpointName} endpoint`, error);
    throw error; // Re-throw the error for further handling if needed
  }
};
