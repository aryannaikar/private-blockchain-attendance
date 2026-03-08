import axios from "axios";

// Node URLs
export const TEACHER_URL = "http://192.168.0.106:4000";
export const STUDENT_URL = "http://192.168.0.106:3001";
export const SERVER_URL  = "http://192.168.0.106:5000";

// Backwards-compatible exports (used by AttendanceList default, NetworkStatus, etc.)
export const NODE_NAME = "Teacher Node";
export const BASE_URL  = TEACHER_URL;

// Axios instance for Teacher Node (port 4000)
const TEACHER_API = axios.create({
  baseURL: TEACHER_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Axios instance for Student Node (port 3000)
export const STUDENT_API = axios.create({
  baseURL: STUDENT_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Axios instance for Server/Admin Node (port 5000)
export const SERVER_API = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Default export = Teacher API (keeps existing imports working)
export default TEACHER_API;
