const axios = require('axios');

async function testStartSession() {
  try {
    const res = await axios.post('http://localhost:5000/attendance/active-session', {
      activeSlot: "Class 1",
      teacherID: "T123",
      teacherName: "Lalita",
      isOpen: true
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

testStartSession();
