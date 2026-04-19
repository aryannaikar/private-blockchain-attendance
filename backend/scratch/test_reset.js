const axios = require('axios');

async function testReset() {
  try {
    const url = 'http://127.0.0.1:4000/attendance/reset';
    console.log(`📡 Sending RESET request to ${url}...`);
    const res = await axios.post(url);
    console.log('✅ Response:', res.data);
  } catch (err) {
    console.error('❌ Reset Failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error('Message:', err.message);
    }
  }
}

testReset();
