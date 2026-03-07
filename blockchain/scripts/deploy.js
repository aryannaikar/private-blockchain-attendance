const hre = require("hardhat");

async function main() {

  const Attendance = await hre.ethers.getContractFactory("Attendance");

  const attendance = await Attendance.deploy();

  await attendance.waitForDeployment();

  const contractAddress = await attendance.getAddress();

  console.log("Attendance Contract Deployed To:", contractAddress);


  // Hardhat accounts
  const teacherAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const studentAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";


  // Register teacher
  const tx1 = await attendance.registerTeacher(teacherAddress);
  await tx1.wait();

  console.log("Teacher registered:", teacherAddress);


  // Register student
  const tx2 = await attendance.registerStudent(
    studentAddress,
    "STU001"
  );

  await tx2.wait();

  console.log("Student registered:", studentAddress, "→ STU001");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});