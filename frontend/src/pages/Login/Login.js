import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Lock, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import { login } from '../../services/api';
import './Login.css';

const Login = () => {
  const [rollNo,   setRollNo]   = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ rollNo, password });
      const { role, rollNo: rno, name } = res.data;

      // Persist session
      localStorage.setItem('role',   role);
      localStorage.setItem('rollNo', rno);
      localStorage.setItem('name',   name || rno);

      if (role === 'student') navigate('/student');
      else if (role === 'teacher') navigate('/teacher');
      else if (role === 'admin') navigate('/admin');

    } catch (err) {
      const msg = err?.response?.data?.error || 'Login failed. Check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Navbar />

      <div className="login-container">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="login-header">
            <div className="login-logo">
              <Shield size={40} className="logo-icon-large" />
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to access your portal</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Roll Number / ID</label>
              <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="e.g. STU001 or TEACH01"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? Contact Admin</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
