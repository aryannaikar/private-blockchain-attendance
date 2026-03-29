import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import FrameScrollAnimation from '../../components/FrameScrollAnimation/FrameScrollAnimation';
import { Shield, Fingerprint, Database, Cpu, Network, Lock, Server, Link as LinkIcon, Code } from 'lucide-react';
import './Landing.css';

const features = [
  { icon: Database, title: "Blockchain Storage", desc: "Immutable and secure attendance records stored on the Ethereum blockchain." },
  { icon: Fingerprint, title: "ESP32 Verification", desc: "Hardware level verification using IoT devices inside classrooms." },
  { icon: Shield, title: "Role Based Access", desc: "Granular access controls for Students, Teachers, and Administrators." },
  { icon: Code, title: "Smart Contracts", desc: "Automated logic for attendance verification and record keeping." },
  { icon: Network, title: "Real Time Dashboard", desc: "Live tracking of attendance sessions and historical data analytics." },
  { icon: Lock, title: "Instant Recording", desc: "Lightning fast attendance marking with zero paperwork." }
];

const technologies = [
  { name: "React", bg: "#61DAFB" },
  { name: "Node.js", bg: "#339933" },
  { name: "Ethereum", bg: "#3C3C3D" },
  { name: "Solidity", bg: "#363636" },
  { name: "ESP32", bg: "#E7352C" },
  { name: "Hardhat", bg: "#FFF454", color: "#000" }
];

const Landing = () => {
  const heroRef = useRef(null);

  return (
    <div className="landing-page">
      <Navbar />

      <section ref={heroRef} className="hero-scroll-wrapper">
        <div className="hero-sticky-content">
          {/* Background Frame Scroll Animation */}
          <FrameScrollAnimation scrollTarget={heroRef} />

          <div className="hero-content">
            <div className="badge">
              Next Generation Attendance
            </div>
            <h1 className="hero-title">
              <span>Blockchain + IoT</span><br/>
              Smart Attendance
            </h1>
            <p className="hero-subtitle">
              Secure, immutable, and automated attendance tracking system leveraging Ethereum smart contracts and ESP32 hardware verification.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn-primary-large">Get Started <Shield size={18}/></Link>
              <Link to="/login" className="btn-secondary-large">View Dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-container">
          <div className="landing-section-header">
            <h2>Key Features</h2>
            <p>Everything you need for bulletproof attendance tracking</p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -5, borderColor: 'var(--primary)' }}
              >
                <div className="feature-icon"><feature.icon size={24} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="technology" className="technology-section">
        <div className="section-container">
          <div className="landing-section-header">
            <h2>Powered By</h2>
            <p>Built with enterprise-ready technologies</p>
          </div>
          <div className="tech-flex">
            {technologies.map((tech, i) => (
              <motion.div 
                key={i} 
                className="tech-badge"
                style={{ border: `1px solid ${tech.bg}44`, color: '#fff' }}
                whileHover={{ scale: 1.05, backgroundColor: `${tech.bg}11`, borderColor: tech.bg }}
              >
                {tech.name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="architecture-section">
        <div className="section-container">
          <div className="landing-section-header">
            <h2>Architecture</h2>
            <p>How the system works silently in the background</p>
          </div>
          
          <div className="architecture-diagram glass-card">
            <div className="arch-node">
              <div className="arch-circle student-node"><Fingerprint className="arch-icon" /></div>
              <span>Student Device</span>
            </div>
            <div className="arch-link"><LinkIcon size={20}/></div>
            <div className="arch-node">
              <div className="arch-circle esp-node"><Cpu className="arch-icon" /></div>
              <span>ESP32 IoT</span>
            </div>
            <div className="arch-link"><LinkIcon size={20}/></div>
            <div className="arch-node">
              <div className="arch-circle backend-node"><Server className="arch-icon" /></div>
              <span>Backend Server</span>
            </div>
            <div className="arch-link"><LinkIcon size={20}/></div>
            <div className="arch-node">
              <div className="arch-circle block-node"><Database className="arch-icon" /></div>
              <span>Smart Contract</span>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Shield size={24} color="var(--primary)" />
            <span>BlockAttend</span>
          </div>
          <p>© 2026 Private Blockchain Attendance System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
