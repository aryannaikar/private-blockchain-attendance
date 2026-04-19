import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import MarkAttendance from './pages/MarkAttendance/MarkAttendance';
import AttendanceHistory from './pages/AttendanceHistory/AttendanceHistory';
import TeacherDashboard from './pages/TeacherDashboard/TeacherDashboard';
import StartSession from './pages/StartSession/StartSession';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ManageUsers from './pages/ManageUsers/ManageUsers';
import ParentDashboard from './pages/ParentDashboard/ParentDashboard';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/mark" element={<MarkAttendance />} />
          <Route path="/student/history" element={<AttendanceHistory />} />
          
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/session" element={<StartSession />} />
          <Route path="/teacher/history" element={<AttendanceHistory />} />
          
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/history" element={<AttendanceHistory />} />

          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/history" element={<AttendanceHistory />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
