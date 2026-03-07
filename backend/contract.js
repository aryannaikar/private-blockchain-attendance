require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("./AttendanceABI.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

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