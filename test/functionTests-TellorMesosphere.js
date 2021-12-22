const { expect } = require("chai");
const { ethers } = require("hardhat");
const h = require("./helpers/helpers");
const web3 = require('web3');

describe("TellorMesosphere - function tests", function() {

	let tellor;
  let mesosphere;
	let accounts;
	const QUERYID1 = h.uintTob32(1)

	beforeEach(async function () {
		accounts = await ethers.getSigners();
		const TellorPlayground = await ethers.getContractFactory("TellorPlayground");
		tellor = await TellorPlayground.deploy();
		await tellor.deployed();
    const TellorMesosphere = await ethers.getContractFactory("TellorMesosphere");
    mesosphere = await TellorMesosphere.deploy(tellor.address)
    await mesosphere.deployed();
	});

	it("getMedian", async function() {
		valueCount = 1
		max = 10
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(1000 + i), 0, '0x')
    }
		blocky = await h.getBlock()
    median = await mesosphere.getMedian(QUERYID1, blocky.timestamp, timeLimit, max)
		expect(median[0]).to.equal(1000)
		expect(median[1]).to.equal(1)

		valueCount = 10
		max = 10
		timeLimit = 60
		await h.advanceTime(timeLimit)
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(2000 + i), 0, '0x')
    }
		blocky = await h.getBlock()
    median = await mesosphere.getMedian(QUERYID1, blocky.timestamp, timeLimit, max)
		expect(median[0]).to.equal(2004)
		expect(median[1]).to.equal(10)

		valueCount = 11
		max = 10
		timeLimit = 3600
		await h.advanceTime(timeLimit)
    for(let i=0; i<=valueCount; i++) {
			if(i % 2 == 0) {
				value = 3000 + i
			} else {
				value = 3000 - i
			}
      await tellor.connect(accounts[1]).submitValue(QUERYID1, value, 0, '0x')
    }
		blocky = await h.getBlock()
    median = await mesosphere.getMedian(QUERYID1, blocky.timestamp, timeLimit, max)
		expect(median[0]).to.equal(3000)
		expect(median[1]).to.equal(10)

		valueCount = 50
		max = 5
		timeLimit = 3600
		await h.advanceTime(timeLimit)
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), 0, '0x')
    }
		blocky = await h.getBlock()
    median = await mesosphere.getMedian(QUERYID1, blocky.timestamp, timeLimit, max)
		expect(median[0]).to.equal(4047)
		expect(median[1]).to.equal(5)
	})
});
