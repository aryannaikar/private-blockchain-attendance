const contract = require("../contract");

async function test() {
  try {
    console.log("Testing markAttendance...");
    const studentID = "STU_TEST_123";
    const tx = await contract.markAttendance(studentID);
    console.log("Transaction Sent!");
    console.log("Transaction Hash:", tx.hash);
    
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction Confirmed in block:", receipt.blockNumber);
    
    console.log("Verifying record...");
    const records = await contract.getAttendance();
    const lastRecord = records[records.length - 1];
    console.log("Last record studentID:", lastRecord.studentID);
    
    if (lastRecord.studentID === studentID) {
      console.log("SUCCESS: Real transaction hash generated and verified.");
    } else {
      console.log("FAILURE: Record mismatch.");
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

test();
