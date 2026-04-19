const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.teacher" });

async function checkConnection() {
  console.log(`📡 Checking connection to: ${process.env.RPC_URL}`);
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  try {
    const blockNum = await provider.getBlockNumber();
    console.log(`✅ Success! Current block number: ${blockNum}`);
  } catch (err) {
    console.error(`❌ Connection Failed: ${err.message}`);
    console.error("\nTIP: Make sure your Hardhat node is running in another terminal:");
    console.error("     npx hardhat node");
  }
}

checkConnection();
