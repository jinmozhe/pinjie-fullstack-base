export default {
  dev: {
    "/api/v1": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
  test: {
    "/api/v1": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
};
