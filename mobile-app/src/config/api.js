import axios from "axios";

// export const NODE_NAME = "Student Node";
// export const BASE_URL = "http://192.168.0.106:3000";

export const NODE_NAME = "Teacher Node";
export const BASE_URL = "http://192.168.0.106:4000";

// export const NODE_NAME = "Server Node";
// export const BASE_URL = "http://192.168.0.106:5000";

// export const NODE_NAME = "Unauthorized Node";
// export const BASE_URL = "http://192.168.0.106:6000";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export default API;

