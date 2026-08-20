const backendURL = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8000";

export default {
  dev: {
    "/api/v1": {
      target: backendURL,
      changeOrigin: false,
    },
  },
  test: {
    "/api/v1": {
      target: backendURL,
      changeOrigin: false,
    },
  },
};
