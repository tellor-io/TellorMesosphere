require("hardhat-gas-reporter");
// require('hardhat-contract-sizer');
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const web3 = require('web3');

//const dotenv = require('dotenv').config()
//npx hardhat run scripts/01_DeployTellorFlexwithExistingStakingToken.js --network rinkeby

var tellorAddress= '0x002e861910d7f87baa832a22ac436f25fb66fa24'

async function deployTellorMesosphere(_network, _pk, _nodeURL, tellorAdd) {
    console.log("deploy TellorMesosphere")
    await run("compile")

    var net = _network

    ///////////////Connect to the network
    let privateKey = _pk;
    var provider = new ethers.providers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider)

    /////////// Deploy Tellor flex
    console.log("deploy tellor mesosphere")

    /////////////TellorFlex
    console.log("Starting deployment for TellorMesosphere contract...")
    const Mesosphere = await ethers.getContractFactory("contracts/TellorMesosphere.sol:TellorMesosphere", wallet)
    const mesospherewithsigner = await Mesosphere.connect(wallet)
    const mesosphere = await mesospherewithsigner.deploy(tellorAddress)
    await mesosphere.deployed();

    if (net == "mainnet"){
        console.log("TellorMesosphere contract deployed to:", "https://etherscan.io/address/" + mesosphere.address);
        console.log("    transaction hash:", "https://etherscan.io/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "rinkeby") {
        console.log("TellorMesosphere contract deployed to:", "https://rinkeby.etherscan.io/address/" + mesosphere.address);
        console.log("    transaction hash:", "https://rinkeby.etherscan.io/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "bsc_testnet") {
        console.log("TellorMesosphere contract deployed to:", "https://testnet.bscscan.com/address/" + mesosphere.address);
        console.log("    transaction hash:", "https://testnet.bscscan.com/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "bsc") {
        console.log("TellorMesosphere contract deployed to:", "https://bscscan.com/address/" + mesosphere.address);
        console.log("    transaction hash:", "https://bscscan.com/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "polygon") {
        console.log("TellorMesosphere contract deployed to:", "https://explorer-mainnet.maticvigil.com/" + mesosphere.address);
        console.log("    transaction hash:", "https://explorer-mainnet.maticvigil.com/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "polygon_testnet") {
        console.log("TellorMesosphere contract deployed to:", "https://explorer-mumbai.maticvigil.com/" + mesosphere.address);
        console.log("    transaction hash:", "https://explorer-mumbai.maticvigil.com/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "arbitrum_testnet"){
        console.log("TellorMesosphere contract deployed to:","https://rinkeby-explorer.arbitrum.io/#/"+ mesosphere.address)
        console.log("    transaction hash:", "https://rinkeby-explorer.arbitrum.io/#/tx/" + mesosphere.deployTransaction.hash);
    }  else if (net == "xdaiSokol"){ //https://blockscout.com/poa/xdai/address/
      console.log("TellorMesosphere contract deployed to:","https://blockscout.com/poa/sokol/address/"+ mesosphere.address)
      console.log("    transaction hash:", "https://blockscout.com/poa/sokol/tx/" + mesosphere.deployTransaction.hash);
    } else if (net == "xdai"){ //https://blockscout.com/poa/xdai/address/
      console.log("TellorMesosphere contract deployed to:","https://blockscout.com/xdai/mainnet/address/"+ mesosphere.address)
      console.log("    transaction hash:", "https://blockscout.com/xdai/mainnet/tx/" + mesosphere.deployTransaction.hash);
    } else {
        console.log("Please add network explorer details")
    }


    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for TellorMesosphere tx confirmation...');
    await mesosphere.deployTransaction.wait(7)

    console.log('submitting TellorMesosphere contract for verification...');

    await run("verify:verify",
        {
            address: mesosphere.address,
            constructorArguments: [tellorAddress]
        },
    )

    console.log("TellorMesosphere contract verified")

}


deployTellorMesosphere("polygon_testnet", process.env.TESTNET_PK, process.env.NODE_URL_MUMBAI,tellorAddress)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
