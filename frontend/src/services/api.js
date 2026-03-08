import axios from 'axios';

// ── Node URLs ──────────────────────────────────────────────────────────────
export const TEACHER_URL = 'http://192.168.0.106:4000';
export const STUDENT_URL = 'http://192.168.0.106:3001';
export const SERVER_URL  = 'http://192.168.0.106:5000';

// ── Axios instances ────────────────────────────────────────────────────────
export const teacherAPI = axios.create({ baseURL: TEACHER_URL, timeout: 10000 });
export const studentAPI = axios.create({ baseURL: STUDENT_URL, timeout: 10000 });
export const serverAPI  = axios.create({ baseURL: SERVER_URL,  timeout: 10000 });

// ── Auth ───────────────────────────────────────────────────────────────────
// POST /auth/login  { rollNo, password }
export const login = (credentials) =>
  teacherAPI.post('/auth/login', credentials);

// ── Attendance ─────────────────────────────────────────────────────────────
// Teacher marks a student  → Teacher Node (port 4000)
export const markAttendanceTeacher = (studentID) =>
  teacherAPI.post('/attendance/mark', { role: 'teacher', studentID });

// Student marks own attendance → Student Node (port 3000)
export const markAttendanceStudent = (rollNo) =>
  studentAPI.post('/attendance/mark', { role: 'student', rollNo });

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
// Create new student → Server Node (port 5000)
export const createStudent = (data) =>
  serverAPI.post('/admin/create-student', data);
