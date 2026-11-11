import axios from "axios";
import { useToastStore } from "../stores/toast";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const toastStore = useToastStore();

    if (!error.response) {
      toastStore.error("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি!");
    } else if (error.response.status === 500) {
      toastStore.error("সার্ভারে অভ্যন্তরীণ সমস্যা দেখা দিয়েছে।");
    } else if (error.response.status === 403) {
      toastStore.error(
        error.response.data?.message || "আপনার এই কাজটি করার অনুমতি নেই!",
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
