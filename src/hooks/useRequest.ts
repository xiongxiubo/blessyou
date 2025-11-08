import axios from "axios";

export default function useRequest() {
  const { currentLang } = useLang();
  const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    timeout: 600000,
  });
  request.interceptors.request.use(
    config => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = token;
      }
      config.headers["language"] = currentLang;
      return config;
    },
    error => {
      return Promise.reject(error);
    },
  );
  request.interceptors.response.use(
    response => {
      return response.data;
    },
    error => {
      return Promise.reject(error);
    },
  );

  return { request };
}
