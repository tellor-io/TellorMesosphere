const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

const TIME_LIMIT = 60;
const QUORUM = 3;
const MAX_DEVIATION = 2000;
const REQUEST_ID_1 = 1;
const REQUEST_ID_2 = 2;

describe("Tellor Mesosphere E2E Tests", function() {

    let mesosphere;
    let owner, acc1, acc2, acc3, acc4, acc5;

    beforeEach(async function() {
        
        const MesosphereDepl = await ethers.getContractFactory("TellorMesosphere")
        mesosphere = await MesosphereDepl.deploy(QUORUM, TIME_LIMIT, MAX_DEVIATION);
        [owner, acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners()
        await mesosphere.deployed()

        await mesosphere.addReporter(acc1.address)
        await mesosphere.addReporter(acc2.address)
        await mesosphere.addReporter(acc3.address)
        await mesosphere.addReporter(acc4.address)
        await mesosphere.addReporter(acc5.address)
    })

    it("fewer reporters than quorum permits", async function() {

        await mesosphere.removeReporter(acc2.address)
        await mesosphere.removeReporter(acc3.address)
        await mesosphere.removeReporter(acc4.address)
        await mesosphere.removeReporter(acc5.address)
        
        await expect(
            mesosphere.connect(acc1).submitValue(REQUEST_ID_1, 100),
            "reporter is wasting gas, num_reporters < quorum"
        ).to.be.reverted
    })

    it("num_reporters == quorum", async function() {


        await mesosphere.removeReporter(acc4.address)
        await mesosphere.removeReporter(acc5.address)

        await mesosphere.connect(acc1).submitValue(REQUEST_ID_1, 100)
        await mesosphere.connect(acc2).submitValue(REQUEST_ID_1, 100)
        await mesosphere.connect(acc3).submitValue(REQUEST_ID_1, 100)

        let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        expect(currentValue[1]).to.equal(
            100,
            "current value doesnt match submitted value"
        )
    })

    it("mean has to be calculated instead of median", async function() {

        await mesosphere.removeReporter(acc5.address)

        //two submit 100
        await mesosphere.connect(acc1).submitValue(REQUEST_ID_1, 100)
        await mesosphere.connect(acc2).submitValue(REQUEST_ID_1, 100)

        //two submit 200
        await mesosphere.connect(acc3).submitValue(REQUEST_ID_1, 200)
        await mesosphere.connect(acc4).submitValue(REQUEST_ID_1, 200)

        let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        expect(currentValue[1]).to.equal(
            150,
            "median calculated incorrectly from forced mean"
        )
    })
    
    it("sudden extreme price fluctuations", async function() {

        //two submit 1mil
        await mesosphere.connect(acc1).submitValue(REQUEST_ID_1, 1000000)
        await mesosphere.connect(acc2).submitValue(REQUEST_ID_1, 1000000)

        //three submit 100
        await mesosphere.connect(acc3).submitValue(REQUEST_ID_1, 100)
        await mesosphere.connect(acc4).submitValue(REQUEST_ID_1, 100)
        await mesosphere.connect(acc5).submitValue(REQUEST_ID_1, 100)

        let currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        expect(currentValue[1]).to.equal(
            100,
            "median calculated incorrectly from value discrepancy"
        )

        await network.provider.send("evm_increaseTime", [61]) //time limit + 1 second

        await mesosphere.connect(acc1).submitValue(REQUEST_ID_1, 1)
        currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        console.log("1--, ", Number(currentValue[1]))
        await mesosphere.connect(acc2).submitValue(REQUEST_ID_1, 1)
        currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        console.log("2--, ", Number(currentValue[1]))
        await mesosphere.connect(acc3).submitValue(REQUEST_ID_1, 1)
        currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        console.log("3--, ", Number(currentValue[1]))
        await mesosphere.connect(acc4).submitValue(REQUEST_ID_1, 1)
        currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        console.log("4--, ", Number(currentValue[1]))
        await mesosphere.connect(acc5).submitValue(REQUEST_ID_1, 1)
        currentValue = await mesosphere.getCurrentValue(REQUEST_ID_1)
        console.log("5--, ", Number(currentValue[1]))

    })

    it("reporter submits right as time limit expires", async function() {

    })


    it("a reporter becomes inactive", async function() {

        //reporters submitting 1mil
        await mesosphere.connect(acc1).submitValue(REQUEST_ID_1, 1000000)
        await mesosphere.connect(acc2).submitValue(REQUEST_ID_1, 1000000)
        await mesosphere.connect(acc3).submitValue(REQUEST_ID_1, 1000000)
        await mesosphere.connect(acc4).submitValue(REQUEST_ID_1, 1000000)
        await mesosphere.connect(acc5).submitValue(REQUEST_ID_1, 1000000)

        

    })
})