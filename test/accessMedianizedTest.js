const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

const TIME_LIMIT = 60;
const QUORUM = 2;
const REQUEST_ID_1 = 1;
const REQUEST_ID_2 = 2;


describe("TellorAccessMedianized", function() {
  let accessMedianized;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    const AccessMedianized = await ethers.getContractFactory("TellorAccessMedianized");
    accessMedianized = await AccessMedianized.deploy(QUORUM, TIME_LIMIT);
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    await accessMedianized.deployed();
  });

  it("Should have set quorum", async function() {
    expect(await accessMedianized.quorum()).to.equal(QUORUM);
  });

  it("Should get median", async function() {
    await accessMedianized.addReporter(addr1.address);
    await accessMedianized.addReporter(addr2.address);

    await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 100);
    await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 200);
    let getCurrentValueResponse = await accessMedianized.getCurrentValue1(REQUEST_ID_1);
    expect(getCurrentValueResponse[1]).to.equal(150);
  });

  // it("Should get median2", async function() {
  //   await accessMedianized.addReporter(addr1.address);
  //   await accessMedianized.addReporter(addr2.address);
  //
  //   await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 100);
  //   await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 200);
  //   let getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
  //   expect(getCurrentValueResponse[1]).to.equal(150);
  //
  //   await time.increase(TIME_LIMIT + 1);
  //
  //   await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 300);
  //   await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 400);
  //   getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
  //   // expect(getCurrentValueResponse[1]).to.equal(350);
  //   console.log("Result2: " + getCurrentValueResponse);
  //
  //   await time.increase(TIME_LIMIT + 1);
  //
  //   await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 300);
  //   await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 400);
  //   getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
  //   // expect(getCurrentValueResponse[1]).to.equal(350);
  //   console.log("Result3: " + getCurrentValueResponse);
  //
  // });
});
