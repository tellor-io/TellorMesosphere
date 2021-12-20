const { expect } = require("chai");
const { ethers } = require("hardhat");
const h = require("./helpers/helpers");
const web3 = require('web3');

describe("TellorMesosphere", function() {

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

	it("try it", async function() {
    let valueCount = 100
		max = 10
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), i, '0x')
    }
    median = await mesosphere.getMedianNow(QUERYID1, timeLimit, max)
		// expect(median).to.equal(4000)
    console.log("median: " + median[0]);
    console.log("count : " + median[1]);
	});

	it("Value count = 1, max = 10", async function() {
    let valueCount = 1
		max = 10
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), i, '0x')
    }
    median = await mesosphere.getMedianNow(QUERYID1, timeLimit, max)
		expect(median[0]).to.equal(4000)
		expect(median[1]).to.equal(1)
	});

	it("Value count = 2, max = 10", async function() {
    let valueCount = 2
		max = 10
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), i, '0x')
    }
    median = await mesosphere.getMedianNow(QUERYID1, timeLimit, max)
		expect(median[0]).to.equal(4000)
		expect(median[1]).to.equal(2)
	});

	it("Value count = 10, max = 10", async function() {
    let valueCount = 10
		max = 10
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), i, '0x')
    }
    median = await mesosphere.getMedianNow(QUERYID1, timeLimit, max)
		expect(median[0]).to.equal(4004)
		expect(median[1]).to.equal(10)
	});

	it("Value count = 11, max = 10", async function() {
    let valueCount = 11
		max = 10
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), i, '0x')
    }
    median = await mesosphere.getMedianNow(QUERYID1, timeLimit, max)
		expect(median[0]).to.equal(4005)
		expect(median[1]).to.equal(10)
	});

	it("Value count = 50, max = 5", async function() {
    let valueCount = 50
		max = 5
		timeLimit = 60
    for(let i=0; i<=valueCount; i++) {
      await tellor.connect(accounts[1]).submitValue(QUERYID1, h.uintTob32(4000 + i), i, '0x')
    }
    median = await mesosphere.getMedianNow(QUERYID1, timeLimit, max)
		expect(median[0]).to.equal(4047)
		expect(median[1]).to.equal(5)
	});

});
