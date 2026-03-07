const hre = require("hardhat");

async function main() {

  const Attendance = await hre.ethers.getContractFactory("Attendance");

  const attendance = await Attendance.deploy();

  await attendance.waitForDeployment();

  const contractAddress = await attendance.getAddress();

  console.log("Attendance Contract Deployed To:", contractAddress);

  // Hardhat Account #1 (Teacher)
  const teacherAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  // Register teacher
  const tx = await attendance.registerTeacher(teacherAddress);
  await tx.wait();

  console.log("Teacher registered:", teacherAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});