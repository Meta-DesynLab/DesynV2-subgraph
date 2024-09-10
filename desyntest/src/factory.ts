import {
  LOG_BLABS as LOG_BLABSEvent,
  LOG_DEL_WHITELIST as LOG_DEL_WHITELISTEvent,
  LOG_MANAGER as LOG_MANAGEREvent,
  LOG_NEW_POOL as LOG_NEW_POOLEvent,
  LOG_ORACLE as LOG_ORACLEEvent,
  LOG_ROUTER as LOG_ROUTEREvent,
  LOG_USER_VAULT as LOG_USER_VAULTEvent,
  LOG_VAULT as LOG_VAULTEvent,
  LOG_WHITELIST as LOG_WHITELISTEvent,
  MODULE_STATUS_CHANGE as MODULE_STATUS_CHANGEEvent,
  PAUSED_STATUS as PAUSED_STATUSEvent
} from "../generated/Factory/Factory"
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
} from "../generated/schema"

export function handleLOG_BLABS(event: LOG_BLABSEvent): void {
  let entity = new LOG_BLABS(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.caller = event.params.caller
  entity.blabs = event.params.blabs

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_DEL_WHITELIST(event: LOG_DEL_WHITELISTEvent): void {
  let entity = new LOG_DEL_WHITELIST(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.spender = event.params.spender
  entity.sort = event.params.sort
  entity.caller = event.params.caller
  entity.token = event.params.token

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_MANAGER(event: LOG_MANAGEREvent): void {
  let entity = new LOG_MANAGER(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.manager = event.params.manager
  entity.caller = event.params.caller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_NEW_POOL(event: LOG_NEW_POOLEvent): void {
  let entity = new LOG_NEW_POOL(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.caller = event.params.caller
  entity.pool = event.params.pool

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_ORACLE(event: LOG_ORACLEEvent): void {
  let entity = new LOG_ORACLE(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.caller = event.params.caller
  entity.oracle = event.params.oracle

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_ROUTER(event: LOG_ROUTEREvent): void {
  let entity = new LOG_ROUTER(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.caller = event.params.caller
  entity.router = event.params.router

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_USER_VAULT(event: LOG_USER_VAULTEvent): void {
  let entity = new LOG_USER_VAULT(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.vault = event.params.vault
  entity.caller = event.params.caller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_VAULT(event: LOG_VAULTEvent): void {
  let entity = new LOG_VAULT(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.vault = event.params.vault
  entity.caller = event.params.caller

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLOG_WHITELIST(event: LOG_WHITELISTEvent): void {
  let entity = new LOG_WHITELIST(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.spender = event.params.spender
  entity.sort = event.params.sort
  entity.caller = event.params.caller
  entity.token = event.params.token

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMODULE_STATUS_CHANGE(
  event: MODULE_STATUS_CHANGEEvent
): void {
  let entity = new MODULE_STATUS_CHANGE(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.etf = event.params.etf
  entity.module = event.params.module
  entity.status = event.params.status

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePAUSED_STATUS(event: PAUSED_STATUSEvent): void {
  let entity = new PAUSED_STATUS(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.state = event.params.state

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
