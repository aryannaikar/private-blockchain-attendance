const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

  const Attendance = await hre.ethers.getContractFactory("Attendance");

  const attendance = await Attendance.deploy();

  await attendance.waitForDeployment();

  const contractAddress = await attendance.getAddress();

  console.log("Attendance Contract Deployed To:", contractAddress);


  // --- AUTOMATION: Update Backend .env files ---
  const backendDir = path.join(__dirname, "../../backend");
  if (fs.existsSync(backendDir)) {
    const envFiles = fs.readdirSync(backendDir).filter(f => f.startsWith(".env"));
    
    envFiles.forEach(file => {
      const filePath = path.join(backendDir, file);
      let content = fs.readFileSync(filePath, "utf8");
      
      if (content.includes("CONTRACT_ADDRESS=")) {
        content = content.replace(/CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}/g, `CONTRACT_ADDRESS=${contractAddress}`);
        // Fallback for empty or different format
        if (!content.includes(`CONTRACT_ADDRESS=${contractAddress}`)) {
            content = content.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
        }
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file} with new contract address.`);
      }
    });
  }


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