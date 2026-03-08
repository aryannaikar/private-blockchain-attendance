import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './AttendanceTable.css';

const AttendanceTable = ({ data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => 
    item.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.teacherAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">Recent Attendance Records</h3>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search records..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Teacher Address</th>
              <th>Block Number</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((record, index) => (
                <tr key={index}>
                  <td className="fw-600">{record.studentId}</td>
                  <td>{record.date}</td>
                  <td>{record.time}</td>
                  <td className="mono">{record.teacherAddress}</td>
                  <td className="mono accent-text">#{record.blockNumber}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No attendance records found.
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
