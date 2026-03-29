const axios = require('axios');
async function test() {
  const res = await axios.get('http://localhost:5000/attendance/proxy-alerts');
  console.log(JSON.stringify(res.data, null, 2));
}
test().catch(console.error);
