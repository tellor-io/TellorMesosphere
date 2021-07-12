async function main() {

    let quorum = 2
    let timeLimit = 60 //1 minute
    let maximumDeviation = 2000 //20%

    // We get the contract to deploy
    const MesosphereDepl = await ethers.getContractFactory("TellorMesosphere");
    const mesosphere = await MesosphereDepl.deploy(
      quorum,
      timeLimit,
      maximumDeviation
    );
  
    console.log("Mesosphere deployed to:", mesosphere.address);
    console.log("quorum: ", quorum)

    //add reporters
    await mesosphere.addReporter("0x8c3bf3EB2639b2326fF937D041292dA2e79aDBbf")
    await mesosphere.addReporter("0x2cFC5bCE14862D46fBA3bb46A36A8b2d7E4aC040")
    await mesosphere.addReporter("0x6ffd0DFE81308794357F0F83339a4529e5564695")
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  