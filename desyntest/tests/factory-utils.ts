import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  LOG_BLABS,
  LOG_DEL_WHITELIST,
  LOG_MANAGER,
  LOG_NEW_POOL,
  LOG_ORACLE,
  LOG_ROUTER,
  LOG_USER_VAULT,
  LOG_VAULT,
  LOG_WHITELIST,
  MODULE_STATUS_CHANGE,
  PAUSED_STATUS
} from "../generated/Factory/Factory"

export function createLOG_BLABSEvent(
  caller: Address,
  blabs: Address
): LOG_BLABS {
  let logBlabsEvent = changetype<LOG_BLABS>(newMockEvent())

  logBlabsEvent.parameters = new Array()

  logBlabsEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  logBlabsEvent.parameters.push(
    new ethereum.EventParam("blabs", ethereum.Value.fromAddress(blabs))
  )

  return logBlabsEvent
}

export function createLOG_DEL_WHITELISTEvent(
  spender: Address,
  sort: BigInt,
  caller: Address,
  token: Address
): LOG_DEL_WHITELIST {
  let logDelWhitelistEvent = changetype<LOG_DEL_WHITELIST>(newMockEvent())

  logDelWhitelistEvent.parameters = new Array()

  logDelWhitelistEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  logDelWhitelistEvent.parameters.push(
    new ethereum.EventParam("sort", ethereum.Value.fromUnsignedBigInt(sort))
  )
  logDelWhitelistEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  logDelWhitelistEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )

  return logDelWhitelistEvent
}

export function createLOG_MANAGEREvent(
  manager: Address,
  caller: Address
): LOG_MANAGER {
  let logManagerEvent = changetype<LOG_MANAGER>(newMockEvent())

  logManagerEvent.parameters = new Array()

  logManagerEvent.parameters.push(
    new ethereum.EventParam("manager", ethereum.Value.fromAddress(manager))
  )
  logManagerEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return logManagerEvent
}

export function createLOG_NEW_POOLEvent(
  caller: Address,
  pool: Address
): LOG_NEW_POOL {
  let logNewPoolEvent = changetype<LOG_NEW_POOL>(newMockEvent())

  logNewPoolEvent.parameters = new Array()

  logNewPoolEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  logNewPoolEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool))
  )

  return logNewPoolEvent
}

export function createLOG_ORACLEEvent(
  caller: Address,
  oracle: Address
): LOG_ORACLE {
  let logOracleEvent = changetype<LOG_ORACLE>(newMockEvent())

  logOracleEvent.parameters = new Array()

  logOracleEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  logOracleEvent.parameters.push(
    new ethereum.EventParam("oracle", ethereum.Value.fromAddress(oracle))
  )

  return logOracleEvent
}

export function createLOG_ROUTEREvent(
  caller: Address,
  router: Address
): LOG_ROUTER {
  let logRouterEvent = changetype<LOG_ROUTER>(newMockEvent())

  logRouterEvent.parameters = new Array()

  logRouterEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  logRouterEvent.parameters.push(
    new ethereum.EventParam("router", ethereum.Value.fromAddress(router))
  )

  return logRouterEvent
}

export function createLOG_USER_VAULTEvent(
  vault: Address,
  caller: Address
): LOG_USER_VAULT {
  let logUserVaultEvent = changetype<LOG_USER_VAULT>(newMockEvent())

  logUserVaultEvent.parameters = new Array()

  logUserVaultEvent.parameters.push(
    new ethereum.EventParam("vault", ethereum.Value.fromAddress(vault))
  )
  logUserVaultEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return logUserVaultEvent
}

export function createLOG_VAULTEvent(
  vault: Address,
  caller: Address
): LOG_VAULT {
  let logVaultEvent = changetype<LOG_VAULT>(newMockEvent())

  logVaultEvent.parameters = new Array()

  logVaultEvent.parameters.push(
    new ethereum.EventParam("vault", ethereum.Value.fromAddress(vault))
  )
  logVaultEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )

  return logVaultEvent
}

export function createLOG_WHITELISTEvent(
  spender: Address,
  sort: BigInt,
  caller: Address,
  token: Address
): LOG_WHITELIST {
  let logWhitelistEvent = changetype<LOG_WHITELIST>(newMockEvent())

  logWhitelistEvent.parameters = new Array()

  logWhitelistEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  logWhitelistEvent.parameters.push(
    new ethereum.EventParam("sort", ethereum.Value.fromUnsignedBigInt(sort))
  )
  logWhitelistEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  logWhitelistEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )

  return logWhitelistEvent
}

export function createMODULE_STATUS_CHANGEEvent(
  etf: Address,
  module: Address,
  status: boolean
): MODULE_STATUS_CHANGE {
  let moduleStatusChangeEvent = changetype<MODULE_STATUS_CHANGE>(newMockEvent())

  moduleStatusChangeEvent.parameters = new Array()

  moduleStatusChangeEvent.parameters.push(
    new ethereum.EventParam("etf", ethereum.Value.fromAddress(etf))
  )
  moduleStatusChangeEvent.parameters.push(
    new ethereum.EventParam("module", ethereum.Value.fromAddress(module))
  )
  moduleStatusChangeEvent.parameters.push(
    new ethereum.EventParam("status", ethereum.Value.fromBoolean(status))
  )

  return moduleStatusChangeEvent
}

export function createPAUSED_STATUSEvent(state: boolean): PAUSED_STATUS {
  let pausedStatusEvent = changetype<PAUSED_STATUS>(newMockEvent())

  pausedStatusEvent.parameters = new Array()

  pausedStatusEvent.parameters.push(
    new ethereum.EventParam("state", ethereum.Value.fromBoolean(state))
  )

  return pausedStatusEvent
}
