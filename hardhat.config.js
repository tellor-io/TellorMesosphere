require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');
const privateKey = fs.readFileSync(".env").toString().trim();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
   defaultNetwork: "matic",
   networks: {
     hardhat: {
     },
     matic: {
       url: "https://rpc-mumbai.maticvigil.com",
       accounts: [privateKey]
     }
   },
   solidity: {
     version: "0.7.0",
     settings: {
       optimizer: {
         enabled: true,
         runs: 200
       }
     }
   },
   paths: {
     sources: "./contracts",
     tests: "./test",
     cache: "./cache",
     artifacts: "./artifacts"
   },
   mocha: {
     timeout: 20000
   }
 }
