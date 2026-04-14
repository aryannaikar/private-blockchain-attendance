import React, { useState } from 'react';
import { Search, ShieldCheck, Clock, Layers, User, Smartphone, Hash } from 'lucide-react';
import './AttendanceTable.css';

const AttendanceTable = ({ data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const cleanValue = (val) => {
    if (!val || val === '...' || val === 'live' || val === 'default') return '—';
    return val;
  };

  // Calculate duplicate device IDs within the same session
  const duplicateMap = {};
  data.forEach(r => {
    if (!r.deviceID || r.deviceID === 'unknown' || !r.sessionID) return;
    const key = `${r.deviceID}||${r.sessionID}`;
    if (!duplicateMap[key]) {
      duplicateMap[key] = new Set();
    }
    duplicateMap[key].add(r.studentID);
  });

  const filteredData = data.filter(item => 
    item.studentID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sessionID?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-container premium-shadow">
      <div className="table-header">
        <div className="title-section">
          <h3 className="table-title">Attendance Log</h3>
          <p className="table-subtitle">{filteredData.length} records found</p>
        </div>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Filter by Student, Teacher, or Slot..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th><User size={14} /> Student ID</th>
              <th><Layers size={14} /> Class Slot</th>
              <th><User size={14} /> Teacher</th>
              <th><Clock size={14} /> Date & Time</th>
              <th><Smartphone size={14} /> Device</th>
              <th className="status-th"><Hash size={14} /> Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((record, index) => {
                const proxyKey = `${record.deviceID}||${record.sessionID}`;
                const isProxy = duplicateMap[proxyKey] && duplicateMap[proxyKey].size > 1;

                return (
                  <tr key={index} className={`table-row ${isProxy ? 'proxy-row' : ''}`}>
                    <td className="student-id-cell">
                      {record.studentID}
                      {isProxy && (
                        <div className="proxy-mini-badge">
                           <Hash size={8} /> PROXY
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`session-pill ${!record.sessionID || record.sessionID === '...' ? 'placeholder' : ''}`}>
                        {cleanValue(record.sessionID)}
                      </span>
                    </td>
                    <td className="teacher-name">{cleanValue(record.teacherName)}</td>
                    <td className="timestamp-cell">
                      {record.timestamp ? (
                        <div className="time-display">
                          <span className="date-part">{new Date(record.timestamp).toLocaleDateString()}</span>
                          <span className="time-part">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className={`device-id-cell ${isProxy ? 'proxy-hardware' : ''}`}>
                      <div className="device-id-wrapper">
                        {isProxy && <Smartphone size={10} className="hazard-icon" />}
                        <span title={record.deviceID}>
                          {record.deviceID && record.deviceID !== 'unknown' 
                            ? `${record.deviceID.substring(0, 10)}...` 
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {record.blockNumber && record.blockNumber !== '—' ? (
                        <div className="status-badge on-chain">
                          <ShieldCheck size={14} />
                          <span>#{record.blockNumber}</span>
                        </div>
                      ) : (
                        <div className="status-badge local-fallback">
                          <Clock size={12} />
                          <span>LOCAL</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-content">
                    <Search size={48} opacity={0.2} />
                    <p>No matching attendance records found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;

