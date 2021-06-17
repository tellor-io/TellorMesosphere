const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

const TIME_LIMIT = 60;
const QUORUM = 5;
const MAX_DEVIATION = 2000;
const REQUEST_ID_1 = 1;
const REQUEST_ID_2 = 2;



describe("TellorMesosphere Quorum 5 Miners 5", function() {
  let mesosphere;
  let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9;

  beforeEach(async function () {
    const TellorMesosphere = await ethers.getContractFactory("TellorMesosphere");
    mesosphere = await TellorMesosphere.deploy(QUORUM, TIME_LIMIT, MAX_DEVIATION);
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9] = await ethers.getSigners();
    await mesosphere.deployed();

    await mesosphere.addReporter(addr1.address);
    await mesosphere.addReporter(addr2.address);
    await mesosphere.addReporter(addr3.address);
    await mesosphere.addReporter(addr4.address);
    await mesosphere.addReporter(addr5.address);
  });

  it("Test quorum", async function() {
    expect(await mesosphere.quorum()).to.equal(QUORUM);
  });

  it("Test update quorum", async function() {
    expect(await mesosphere.quorum()).to.equal(QUORUM);
    await mesosphere.updateQuorum(QUORUM+1);
    expect(await mesosphere.quorum()).to.equal(QUORUM+1);
  });

  it("Test one miner updates", async function() {
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 100);
    let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(0);
  });

  it("Test all miners update", async function() {
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 95);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 110);

    let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);
  });

  it("Test all miners update with wild values", async function() {
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 95);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 110);

    let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await time.increase(TIME_LIMIT+1);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 900);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 9500);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 1);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 5);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 17000000);

    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await time.increase(TIME_LIMIT+1);

    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);
  });

  it("Test two malicious miners and one honest miner", async function() {
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 95);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 110);

    let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await time.increase(TIME_LIMIT+1);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 155);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 150);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 102);

    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await time.increase(TIME_LIMIT+1);

    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);
  });

  it("Test fast updates", async function() {
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 95);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 110);

    let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await time.increase(TIME_LIMIT+1);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 103);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 104);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 106);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 107);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(105);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 108);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 109);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 110);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 111);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 112);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(110);

    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 95);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 94);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 93);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 92);
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 91);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(93);

    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 120);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 119);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 118);
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 117);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 116);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    // expect(currentValue[1]).to.equal(118);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 103);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 104);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 106);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 107);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(105);

    await time.increase(TIME_LIMIT+1);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(105);
  });

  it("Test fast drop", async function() {
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 95);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 105);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 110);
    let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await time.increase(TIME_LIMIT+1);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 97);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 98);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 101);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 102);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 88);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 89);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 91);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 92);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(90);

    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 90);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 98);
    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 101);
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 102);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);

    await mesosphere.connect(addr3).submitValue(REQUEST_ID_1, 98);
    await mesosphere.connect(addr1).submitValue(REQUEST_ID_1, 99);
    await mesosphere.connect(addr5).submitValue(REQUEST_ID_1, 100);
    await mesosphere.connect(addr2).submitValue(REQUEST_ID_1, 101);
    await mesosphere.connect(addr4).submitValue(REQUEST_ID_1, 102);
    currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1);
    expect(currentValue[1]).to.equal(100);
  });
});
