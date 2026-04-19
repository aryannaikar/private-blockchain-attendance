require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("./AttendanceABI.json");

// Hardhat's default chainId is 31337. Using staticNetwork prevents crashes on startup if the node is temporarily unavailable.
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
  chainId: 31337,
  name: "hardhat"
}, {
  staticNetwork: true
});

const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

// ensure valid address
const contractAddress = ethers.getAddress(process.env.CONTRACT_ADDRESS);

const contract = new ethers.Contract(
  contractAddress,
  abi,
  wallet
);

module.exports = contract;