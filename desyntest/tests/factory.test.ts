import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { LOG_BLABS } from "../generated/schema"
import { LOG_BLABS as LOG_BLABSEvent } from "../generated/Factory/Factory"
import { handleLOG_BLABS } from "../src/factory"
import { createLOG_BLABSEvent } from "./factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let blabs = Address.fromString("0x0000000000000000000000000000000000000001")
    let newLOG_BLABSEvent = createLOG_BLABSEvent(caller, blabs)
    handleLOG_BLABS(newLOG_BLABSEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("LOG_BLABS created and stored", () => {
    assert.entityCount("LOG_BLABS", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "LOG_BLABS",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "caller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "LOG_BLABS",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "blabs",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
