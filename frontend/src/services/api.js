import axios from 'axios';

// ── Node URLs ──────────────────────────────────────────────────────────────
// Helper to determine base URL (localhost for dev, IP or hostname for others)
const getBaseURL = (port) => {
  const hostname = window.location.hostname;
  return `http://${hostname}:${port}`;
};

export const TEACHER_URL = process.env.REACT_APP_TEACHER_URL || getBaseURL(4000);
export const STUDENT_URL = process.env.REACT_APP_STUDENT_URL || getBaseURL(3001);
export const SERVER_URL  = process.env.REACT_APP_SERVER_URL  || getBaseURL(5000);

// ── Axios instances ────────────────────────────────────────────────────────
export const teacherAPI = axios.create({ baseURL: TEACHER_URL, timeout: 10000 });
export const studentAPI = axios.create({ baseURL: STUDENT_URL, timeout: 10000 });
export const serverAPI  = axios.create({ baseURL: SERVER_URL,  timeout: 10000 });

const API = {
  teacher: teacherAPI,
  student: studentAPI,
  server: serverAPI
};

// ── Auth ───────────────────────────────────────────────────────────────────
// POST /auth/login  { rollNo, password }
export const login = (credentials) =>
  teacherAPI.post('/auth/login', credentials);

// ── Attendance ─────────────────────────────────────────────────────────────
// Teacher marks a student  → Teacher Node (port 4000)
export const markAttendanceTeacher = (studentID) =>
  teacherAPI.post('/attendance/mark', { role: 'teacher', studentID });

// Student marks own attendance → Student Node (port 3000)
export const markAttendanceStudent = (rollNo, deviceID, sessionID) =>
  studentAPI.post('/attendance/mark', { role: 'student', rollNo, deviceID, sessionID });

// All records (teacher view) → Teacher Node (port 4000)
export const getAllAttendance = () =>
  teacherAPI.get('/attendance/all');

// Student's own records → Student Node (port 3000)
export const getMyAttendance = (rollNo) =>
  studentAPI.get(`/attendance/my/${rollNo}`);

// ── Network ────────────────────────────────────────────────────────────────
export const getNetworkStatus = (apiInstance) =>
  apiInstance.get('/network/status');

// ── Admin ──────────────────────────────────────────────────────────────────
// Create new user (student/teacher) → Server Node (port 5000)
export const createUser = (data) =>
  serverAPI.post('/admin/create-user', data);

// Get all users (admin) → Server Node (port 5000)
export const getUsers = () =>
  serverAPI.get('/admin/users');

// ── Session Management ─────────────────────────────────────────────────────
// Get active session (teacher) → Teacher Node (port 4000)
export const getActiveSession = () => teacherAPI.get('/attendance/active-session');
// Set active session (teacher) → Teacher Node (port 4000)
export const setActiveSession = (data) => teacherAPI.post('/attendance/active-session', data);
// Reset attendance for current session (teacher) → Teacher Node (port 4000)
export const resetAttendance = () => teacherAPI.post('/attendance/reset');

// ── Proxy Detection ─────────────────────────────────────────────────────────
// Get proxy alerts (teacher) → Teacher Node (port 4000)
export const getProxyAlerts = () =>
  teacherAPI.get('/attendance/proxy-alerts');

// Get bunk alerts (teacher) → Teacher Node (port 4000)
export const getBunkAlerts = () =>
  teacherAPI.get('/attendance/bunk-alerts');

// Dismiss proxy alert (teacher) → Teacher Node (port 4000)
export const dismissProxyAlert = (deviceID, sessionID) =>
  teacherAPI.post('/attendance/proxy-dismiss', { deviceID, sessionID });

export default API;
