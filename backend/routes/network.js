const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");

// connect to Hardhat blockchain
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

router.get("/status", async (req, res) => {
  try {

    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    res.json({
      blockchain: "Private Ethereum",
      chainId: network.chainId.toString(),
      blockNumber: blockNumber,
      rpc: "http://127.0.0.1:8545",
      message: "Connected to private blockchain network"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

module.exports = router;