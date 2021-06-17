// const { expect } = require("chai");
// const { time } = require("@openzeppelin/test-helpers");
//
// const TIME_LIMIT = 60;
// const QUORUM = 3;
// const MAX_DEVIATION = 2000;
// const REQUEST_ID_1 = 1;
// const REQUEST_ID_2 = 2;
//
//
// describe("TellorMesosphere", function() {
//   let accessMedianized;
//   let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9;
//
//   beforeEach(async function () {
//     const TellorMesosphere = await ethers.getContractFactory("TellorMesosphere");
//     accessMedianized = await TellorMesosphere.deploy(QUORUM, TIME_LIMIT, MAX_DEVIATION);
//     [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9] = await ethers.getSigners();
//     await accessMedianized.deployed();
//   });
//
//   it("Should have set quorum", async function() {
//     expect(await accessMedianized.quorum()).to.equal(QUORUM);
//   });
//
//   it("Should get median", async function() {
//     await accessMedianized.addReporter(addr1.address);
//     await accessMedianized.addReporter(addr2.address);
//     await accessMedianized.addReporter(addr3.address);
//     await accessMedianized.addReporter(addr4.address);
//     await accessMedianized.addReporter(addr5.address);
//
//     await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 100);
//     let getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     console.log("Current value1: " + getCurrentValueResponse[1]);
//     await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 100);
//     getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     console.log("Current value2: " + getCurrentValueResponse[1]);
//     await accessMedianized.connect(addr3).submitValue(REQUEST_ID_1, 150);
//     getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     console.log("Current value3: " + getCurrentValueResponse[1]);
//     await accessMedianized.connect(addr4).submitValue(REQUEST_ID_1, 200);
//     getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     console.log("Current value4: " + getCurrentValueResponse[1]);
//     await accessMedianized.connect(addr5).submitValue(REQUEST_ID_1, 200);
//     getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     console.log("Current value5: " + getCurrentValueResponse[1]);
//
//     await time.increase(TIME_LIMIT + 1);
//     console.log("Current value00: " + getCurrentValueResponse[1]);
//     expect(getCurrentValueResponse[1]).to.equal(150);
//
//
//   });
//
//   it("Test Set Value", async function() {
//     await accessMedianized.addReporter(addr1.address);
//     await accessMedianized.addReporter(addr2.address);
//     await accessMedianized.addReporter(addr3.address);
//
//     await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 100);
//     await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 200);
//     await accessMedianized.connect(addr3).submitValue(REQUEST_ID_1, 150);
//     let getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     expect(getCurrentValueResponse[1]).to.equal(150);
//
//     await time.increase(TIME_LIMIT + 1);
//
//     await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 300);
//     await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 400);
//     getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     expect(getCurrentValueResponse[1]).to.equal(150);
//
//     await time.increase(TIME_LIMIT + 1);
//
//     await accessMedianized.connect(addr1).submitValue(REQUEST_ID_1, 170);
//     await accessMedianized.connect(addr2).submitValue(REQUEST_ID_1, 160);
//     getCurrentValueResponse = await accessMedianized.getCurrentValue(REQUEST_ID_1);
//     expect(getCurrentValueResponse[1]).to.equal(165);
//   });
// });
