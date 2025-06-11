const axios = require("axios");
console.log("GOGET_API:", process.env.GOGET_TOKEN);
const apiClient = axios.create({
  baseURL: process.env.GOGET_API,
//   timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token token=${process.env.GOGET_TOKEN}`,
  },
});

// apiClient.interceptors.request.use(
//   (config) => {
//     config.metadata = { startTime: new Date() };
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// apiClient.interceptors.response.use(
//   (response) => {
//     const duration = new Date() - response.config.metadata.startTime;

//     console.log("✅ Response received:", {
//       status: response.status,
//       statusText: response.statusText,
//       duration: `${duration}ms`,
//       url: response.config.url,
//     });

//     return response;
//   },
//   (error) => {
//     if (error.response) {
//       const { status, data } = error.response;

//       console.error("❌ Response error:", {
//         status,
//         message: data?.message || "Unknown error",
//         url: error.config?.url,
//       });

//       switch (status) {
//         case 400:
//           console.warn("Bad request");
//           break;
//         case 403:
//           console.warn("Access forbidden");
//           break;
//         case 404:
//           console.warn("Resource not found");
//           break;
//         case 500:
//           console.error("Internal server error");
//           break;
//         case 502:
//           console.error("Bad gateway");
//           break;
//         case 503:
//           console.error("Service unavailable");
//           break;
//         default:
//           console.error(`HTTP Error: ${status}`);
//       }
//     } else if (error.request) {
//       console.error("❌ Network error:", error.message);
//     } else {
//       console.error("❌ Request setup error:", error.message);
//     }

//     return Promise.reject(error);
//   }
// );

module.exports = apiClient;