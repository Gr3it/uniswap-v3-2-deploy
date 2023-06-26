require("dotenv").config();

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",

  networks: {
    sepolia: {
      url: `${process.env.RPC}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    mainnet: {
      url: `${process.env.RPC_MAINNET}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
