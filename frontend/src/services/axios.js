import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// ── Response Interceptor ──
// Centralized error handling for all API responses.
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (server down / offline)
    if (!error.response) {
      console.error(
        "[Axios] Network error — server may be unreachable:",
        error.message
      );
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Session expired or unauthorized — redirect to login
        // Only redirect if not already on an auth page to avoid infinite loops
        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register") &&
          !window.location.pathname.startsWith("/forgot-password") &&
          !window.location.pathname.startsWith("/reset-password")
        ) {
          console.warn("[Axios] 401 Unauthorized — redirecting to login");
          window.location.href = "/login";
        }
        break;

      case 403:
        console.warn(
          "[Axios] 403 Forbidden:",
          data?.message || "Access denied"
        );
        break;

      case 500:
      case 502:
      case 503:
        console.error(
          `[Axios] ${status} Server Error:`,
          data?.message || "Internal server error"
        );
        break;

      default:
        // 4xx client errors — let components handle them
        break;
    }

    return Promise.reject(error);
  }
);

export default instance;
