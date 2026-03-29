const axios = require('axios');

async function testDelete() {
  try {
    console.log("Adding STU_TEST user...");
    await axios.post('http://localhost:5000/admin/create-user', {
      name: "Test",
      rollNo: "STU_TEST",
      password: "123",
      role: "student"
    });
    
    console.log("Attempting to delete STU_TEST user...");
    const res = await axios.delete('http://localhost:5000/admin/delete-user/STU_TEST');
    console.log("Delete success:", res.data);
  } catch (err) {
    console.error("Error payload:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testDelete();
