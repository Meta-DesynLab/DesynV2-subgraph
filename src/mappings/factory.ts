import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { LOG_NEW_POOL } from '../types/Factory/Factory'
import { Desyn, Pool } from '../types/schema'
import { Pool as PoolContract, CrpController as CrpControllerContract } from '../types/templates'
import {
  ZERO_BD,
  isCrp,
  getCrpController,
  getCrpSymbol,
  getCrpName,
  getCrpRights,
  getUpperCap,
  getFloorCap,
  getStartClaimFeeTime,
  getCrpEtype,
  getCrpEtfStatusCollectPeriod,
  getCrpEtfStatusCollectEndTime,
  getCrpEtfStatusClosurePeriod,
  getCrpEtfStatusClosureEndTime
} from './helpers'
import { ConfigurableRightsPool } from '../types/Factory/ConfigurableRightsPool';

export function handleNewPool(event: LOG_NEW_POOL): void {
  let factory = Desyn.load('1')

  // if no factory yet, set up blank initial
  if (factory == null) {
    factory = new Desyn('1')
    factory.color = 'Bronze'
    factory.poolCount = 0
    factory.finalizedPoolCount = 0
    factory.crpCount = 0
    factory.txCount = BigInt.fromI32(0)
    factory.totalLiquidity = ZERO_BD
    factory.totalSwapVolume = ZERO_BD
    factory.totalSwapFee = ZERO_BD
  }

  let pool = new Pool(event.params.pool.toHexString())
  pool.crp = isCrp(event.params.caller, event.block)
  pool.rights = []

  if (pool.crp) {
    factory.crpCount += 1
    let crp = ConfigurableRightsPool.bind(event.params.caller)
    pool.symbol = getCrpSymbol(crp)
    pool.name = getCrpName(crp)
    let crpCon = getCrpController(crp)
    if(crpCon === null) {
      pool.crpController = Address.fromString('')
    }else{
      pool.crpController = Address.fromString(crpCon)
    }
   
    pool.rights = getCrpRights(crp)
    pool.upperCap = getUpperCap(crp)
    pool.floorCap = getFloorCap(crp)
    pool.startClaimFeeTime = getStartClaimFeeTime(crp)
    pool.etype = getCrpEtype(crp)
    pool.collectPeriod = getCrpEtfStatusCollectPeriod(crp)
    pool.collectEndTime = getCrpEtfStatusCollectEndTime(crp)
    pool.closurePeriod = getCrpEtfStatusClosurePeriod(crp)
    pool.closureEndTime = getCrpEtfStatusClosureEndTime(crp)
    // Listen for any future crpController changes.
    CrpControllerContract.create(event.params.caller)
  }
  pool.controller = event.params.caller
  pool.publicSwap = false
  pool.finalized = false
  pool.active = true
  pool.swapFee = BigDecimal.fromString('0.000001')
  pool.totalWeight = ZERO_BD
  pool.totalShares = ZERO_BD
  pool.totalSwapVolume = ZERO_BD
  pool.totalSwapFee = ZERO_BD
  pool.liquidity = ZERO_BD
  pool.createTime = event.block.timestamp.toI32()
  pool.tokensCount = BigInt.fromI32(0)
  pool.holdersCount = BigInt.fromI32(0)
  pool.joinsCount = BigInt.fromI32(0)
  pool.count = BigInt.fromI32(0)
  pool.exitsCount = BigInt.fromI32(0)
  pool.swapsCount = BigInt.fromI32(0)
  pool.factoryID = event.address.toHexString()
  pool.tokensList = []
  pool.tokensOriginalList = []
  pool.tx = event.transaction.hash
  pool.save()

  factory.poolCount = factory.poolCount + 1
  factory.save()

  PoolContract.create(event.params.pool)
}
