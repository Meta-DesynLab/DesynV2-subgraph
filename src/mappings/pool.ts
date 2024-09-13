import { BigInt, Address, Bytes, store, log, } from '@graphprotocol/graph-ts'
import { LOG_CALL, LOG_JOIN, LOG_EXIT, GulpCall } from '../types/templates/Pool/Pool'
import { Rebalanced } from '../types/templates/RebalanceAdapter/RebalanceAdapter'
import { Pool as BPool } from '../types/templates/Pool/Pool'
import {
  Desyn,
  Pool,
  PoolToken,
  PoolShare,
  TokenWhiteList,
  InvestorList,
  ExcuteList,
  PoolTokenInitList
} from '../types/schema'
import {
  hexToDecimal,
  bigIntToDecimal,
  tokenToDecimal,
  createPoolShareEntity,
  createInvestListEntity,
  createTokenListEntity,
  createExcuteListEntity,
  createPoolTokenEntity,
  updatePoolLiquidity,
  getCrpUnderlyingPool,
  saveTransaction,
  ZERO_BD,
  decrPoolCount
} from './helpers'
import { 
  ConfigurableRightsPool, 
  OwnershipTransferred, 
  SetManagerFee, 
  Transfer as SmartPoolTransfer, 
  LogJoin, 
  LogExit,
  LogCall,
  LOG_WHITELIST,
  PoolTokenInit
} from '../types/Factory/ConfigurableRightsPool'

/************************************
 ********** Pool Controls ***********
 ************************************/

export function handleSetSwapFee(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)!
  if(pool == null) return
  let swapFee = hexToDecimal(event.params.data.toHexString().slice(-40), 18)
  pool.swapFee = swapFee
  pool.save()

  saveTransaction(event, 'setSwapFee')
}

export function handleSetController(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)

  if (pool == null) {
    pool = new Pool(poolId)
  }
  
  let controller = Address.fromString(event.params.data.toHexString().slice(-40))
  pool.controller = controller
  pool.save()

  saveTransaction(event, 'setController')
}

export function handleSetCrpController(event: OwnershipTransferred): void {
  // This event occurs on the CRP contract rather than the underlying pool so we must perform a lookup.
  let crp = ConfigurableRightsPool.bind(event.address)
  let pool = Pool.load(getCrpUnderlyingPool(crp)!)!

  if(pool == null) return

  pool.crpController = event.params.newOwner
  pool.save()

  // We overwrite event address so that ownership transfers can be linked to Pool entities for above reason.
  event.address = Address.fromString(pool.id)
  saveTransaction(event, 'setCrpController')
}

export function handleSetManagerFee(event: SetManagerFee): void {
  log.debug('managerFee: {}, issueFee: {}, redeemFee: {}, perfermanceFee : {}', [
    event.params.managerFee.toHexString(),
    event.params.issueFee.toHexString(),
    event.params.redeemFee.toHexString(),
    event.params.perfermanceFee.toHexString()
  ])
  log.debug('Block number: {}, block hash: {}, transaction hash: {}, address : {}, addr: {}', [
    event.block.number.toString(), // "47596000"
    event.block.hash.toHexString(), // "0x..."
    event.transaction.hash.toHexString(), // "0x..."
    event.address.toString(),
    event.address.toHexString(),
  ])

  let crp = ConfigurableRightsPool.bind(event.address)
  let bPoolCall = crp.try_bPool()
  let bPool = bPoolCall.value.toHexString()
 
  let pool = Pool.load(bPool)

  if(pool == null) {
    pool = new Pool(bPool)
    pool.managerFee = BigInt.zero()
    pool.issueFee =  BigInt.zero()
    pool.redeemFee =  BigInt.zero()
    pool.perfermanceFee =  BigInt.zero()
    pool.save()
    
  }else{
    pool.managerFee = event.params.managerFee
    pool.issueFee = event.params.issueFee
    pool.redeemFee = event.params.redeemFee
    pool.perfermanceFee = event.params.perfermanceFee
    pool.save()
  }
  saveTransaction(event, 'SetManagerFee')
}

export function handleSetPublicSwap(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)
  if(pool == null) return
  let publicSwap = event.params.data.toHexString().slice(-1) == '1'
  pool.publicSwap = publicSwap
  pool.save()

  saveTransaction(event, 'setPublicSwap')
}

export function handleFinalize(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)!
  if(pool == null) return
  // let balance = BigDecimal.fromString('100')
  pool.finalized = true
  pool.symbol = 'DPT'
  pool.publicSwap = true
  // pool.totalShares = balance
  pool.save()

  /*
  let poolShareId = poolId.concat('-').concat(event.params.caller.toHex())
  let poolShare = PoolShare.load(poolShareId)
  if (poolShare == null) {
    createPoolShareEntity(poolShareId, poolId, event.params.caller.toHex())
    poolShare = PoolShare.load(poolShareId)
  }
  poolShare.balance = balance
  poolShare.save()
  */

  let factory = Desyn.load('1')
  if(factory == null) return
  factory.finalizedPoolCount = factory.finalizedPoolCount + 1
  factory.save()

  saveTransaction(event, 'finalize')
}

/*
  address tokenA sell, 
  address tokenB buy,
  uint deltaWeight, 
  uint deltaBalance,
  bool isSoldout == true,oversell
  uint minAmountOut
*/

export function handleRebindSmart(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)!
  if(pool == null) return
  let tokenBytesA = Bytes.fromHexString(event.params.data.toHexString().slice(34,74)) as Bytes
  let tokenBytes = Bytes.fromHexString(event.params.data.toHexString().slice(98,138)) as Bytes
  let isSoldout = (event.params.data.toHexString().slice(266,330)).slice(63)
 
  let tokensList = pool.tokensList || []
  let isSoldoutFlag = isSoldout == '0' ? false : true 

  if(isSoldoutFlag) {
    let index = tokensList.indexOf(tokenBytesA)
    tokensList.splice(index, 1)
    
    if (tokensList.indexOf(tokenBytes) == -1 ) {
      tokensList.push(tokenBytes)
    }
    pool.tokensList = tokensList
    pool.tokensCount = BigInt.fromI32(tokensList.length)
    pool.save()
  }else {
    
    if (tokensList.indexOf(tokenBytes) == -1 ) {
      tokensList.push(tokenBytes)
    }

    pool.tokensList = tokensList
    pool.tokensCount = BigInt.fromI32(tokensList.length)
    pool.save()
  }
  
  let denormWeight = hexToDecimal(event.params.data.toHexString().slice(138, 202), 18) // 64

  let addressA = Address.fromString(event.params.data.toHexString().slice(34,74))
  let poolTokenAId = poolId.concat('-').concat(addressA.toHexString())
  let poolTokenA = PoolToken.load(poolTokenAId)

  if(poolTokenA == null) return

  let bpool = BPool.bind(Address.fromString(poolId))
  let balanceCall = bpool.try_getBalance(addressA)

  if (poolTokenA == null) {
    createPoolTokenEntity(poolTokenAId, poolId, addressA.toHexString())
    poolTokenA = PoolToken.load(poolTokenAId)
  }else{
    poolTokenA.denormWeight = poolTokenA.denormWeight.minus(denormWeight)
    let balanceA = ZERO_BD
    if (!balanceCall.reverted) {
      balanceA = bigIntToDecimal(balanceCall.value, poolTokenA.decimals)
    }
    poolTokenA.balance = balanceA
    poolTokenA.save()
  }

  let addressB = Address.fromString(event.params.data.toHexString().slice(98,138))
  let poolTokenBId = poolId.concat('-').concat(addressB.toHexString())
  let poolTokenB = PoolToken.load(poolTokenBId)

  if(poolTokenB == null) return

  let balanceBCall = bpool.try_getBalance(addressB)

  if (poolTokenB == null) {
    return
  }else{
    let balanceB = ZERO_BD
    balanceB = bigIntToDecimal(balanceBCall.value, poolTokenB.decimals)
    poolTokenB.balance = balanceB
    poolTokenB.denormWeight =  poolTokenB.denormWeight.plus(denormWeight)
    poolTokenB.save()
  }

  
  if(poolTokenA && poolTokenA.denormWeight.equals(ZERO_BD)){
    store.remove('PoolToken', poolTokenAId)
  }

  pool.save()
  updatePoolLiquidity(poolId)
  saveTransaction(event, 'rebindSmart')

}

/// @notice Event emited after rebalancing
/// @param token0 The token to sell
/// @param token1 The token to buy
/// @param newWeight0 New weight of token0
/// @param newWeight1 New weight of token1
/// @param newBalance0 New balance of token0
/// @param newBalance1 New balance of token1
/// @param isSoldOut Is sold out token0

export function handleRebalanceExcute(event: LOG_CALL): void {

  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)
  if(pool == null) return
  let hash = event.transaction.hash.toHexString()
  let excuteList = ExcuteList.load(hash)
  if (excuteList == null) {
    createExcuteListEntity(hash, poolId)
  }else{
    excuteList.id = hash
    excuteList.hash = poolId
    excuteList.save()
  }
  pool.save()
}

export function handleRebalanced(event: Rebalanced): void {

  let hash = event.transaction.hash.toHexString()
  let excuteList = ExcuteList.load(hash)!
  if(!excuteList) {
    return
  }

  let poolId = excuteList.hash!
  let pool = Pool.load(poolId)
  
  if(pool == null) return

  let token0 = event.params.token0 
  let token1 =  event.params.token1
  let newWeight0 = event.params.newWeight0
  let newWeight1 = event.params.newWeight1
  let newBalance0 = event.params.newBalance0
  let newBalance1 = event.params.newBalance1
  let isSoldOut = event.params.isSoldOut

  let tokensList = pool.tokensList || []

  if(isSoldOut) {
    let index = tokensList.indexOf(token0)
    tokensList.splice(index, 1)
    if (tokensList.indexOf(token1) == -1 ) {
      tokensList.push(token1)
    }
    pool.tokensList = tokensList
    pool.save()
  }else {
    if (tokensList.indexOf(token1) == -1 ) {
      tokensList.push(token1)
    }

    pool.tokensList = tokensList
    pool.save()
  }

  let addressA = event.params.token0.toHexString()
  let poolTokenAId = poolId.concat('-').concat(addressA)
  let poolTokenA = PoolToken.load(poolTokenAId)

  if (poolTokenA == null) {
    return
  }else{
    poolTokenA.denormWeight = bigIntToDecimal(newWeight0, 18)
    poolTokenA.balance =  bigIntToDecimal(newBalance0, poolTokenA.decimals)
    poolTokenA.save()
  }

  let addressB = event.params.token1.toHexString()
  let poolTokenBId = poolId.concat('-').concat(addressB)
  let poolTokenB = PoolToken.load(poolTokenBId)

  if (poolTokenB == null) {
    return
  }else{
    poolTokenB.denormWeight =  bigIntToDecimal(newWeight1, 18)
    poolTokenB.balance =  bigIntToDecimal(newBalance1, poolTokenB.decimals)
    poolTokenB.save()
  }

  if(poolTokenA.denormWeight.equals(ZERO_BD)){
    store.remove('PoolToken', poolTokenAId)
  }

  pool.save()
  updatePoolLiquidity(poolId)
}

export function handleRebind(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)!

  let tokenBytes = Bytes.fromHexString(event.params.data.toHexString().slice(34,74)) as Bytes
  let tokensList = pool.tokensList || []
  if (tokensList.indexOf(tokenBytes) == -1 ) {
    tokensList.push(tokenBytes)
  }
  pool.tokensList = tokensList
  pool.tokensCount = BigInt.fromI32(tokensList.length)

  let address = Address.fromString(event.params.data.toHexString().slice(34,74))
  let denormWeight = hexToDecimal(event.params.data.toHexString().slice(138), 18)

  let poolTokenId = poolId.concat('-').concat(address.toHexString())
  let poolToken = PoolToken.load(poolTokenId)

  if (poolToken == null) {
    return
  } else {
    let oldWeight = poolToken.denormWeight
    if (denormWeight > oldWeight) {
      pool.totalWeight = pool.totalWeight + (denormWeight - oldWeight)
    } else {
      pool.totalWeight = pool.totalWeight - (oldWeight - denormWeight)
    }
  }

  let balance = hexToDecimal(event.params.data.toHexString().slice(74,138), poolToken.decimals)

  poolToken.balance = balance
  poolToken.denormWeight = denormWeight
  poolToken.save()

  if (balance.equals(ZERO_BD)) {
    decrPoolCount(pool.active, pool.finalized, pool.crp)
    pool.active = false
  }
  pool.save()

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'rebind')
}

export function handleUnbind(event: LOG_CALL): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)

  if(pool == null) return

  let tokenBytes = Bytes.fromHexString(event.params.data.toHexString().slice(-40)) as Bytes
  let tokensList = pool.tokensList || []
  let index = tokensList.indexOf(tokenBytes)
  tokensList.splice(index, 1)
  pool.tokensList = tokensList
  pool.tokensCount = BigInt.fromI32(tokensList.length)

  let address = Address.fromString(event.params.data.toHexString().slice(-40))
  let poolTokenId = poolId.concat('-').concat(address.toHexString())
  let poolToken = PoolToken.load(poolTokenId)

  if(poolToken == null) return

  pool.totalWeight -= poolToken.denormWeight
  pool.save()
  store.remove('PoolToken', poolTokenId)

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'unbind')
}

export function handleGulp(call: GulpCall): void {
  let poolId = call.to.toHexString()
  let pool = Pool.load(poolId)

  let address = call.inputs.token.toHexString()

  let bpool = BPool.bind(Address.fromString(poolId))
  let balanceCall = bpool.try_getBalance(Address.fromString(address))

  let poolTokenId = poolId.concat('-').concat(address)
  let poolToken = PoolToken.load(poolTokenId)

  if (poolToken != null) {
    let balance = ZERO_BD
    if (!balanceCall.reverted) {
      balance = bigIntToDecimal(balanceCall.value, poolToken.decimals)
    }
    poolToken.balance = balance
    poolToken.save()
  }

  updatePoolLiquidity(poolId)
}

/************************************
 ********** JOINS & EXITS ***********
 ************************************/

export function handleJoinPool(event: LOG_JOIN): void {
  let poolId = event.address.toHex()
  let pool = Pool.load(poolId)

  if(pool == null) return

  pool.joinsCount.plus(BigInt.fromI32(1))
  pool.save()

  let address = event.params.tokenIn.toHex()
  let poolTokenId = poolId.concat('-').concat(address.toString())
  let poolToken = PoolToken.load(poolTokenId)

  if(poolToken == null) return

  let tokenAmountIn = tokenToDecimal(event.params.tokenAmountIn.toBigDecimal(), poolToken.decimals)
  let newAmount = poolToken.balance.plus(tokenAmountIn)
  poolToken.balance = newAmount
  poolToken.save()

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'join')
}

export function handleExitPool(event: LOG_EXIT): void {
  let poolId = event.address.toHex()

  let address = event.params.tokenOut.toHex()
  let poolTokenId = poolId.concat('-').concat(address.toString())
  let poolToken = PoolToken.load(poolTokenId)

  if(poolToken == null) return

  let tokenAmountOut = tokenToDecimal(event.params.tokenAmountOut.toBigDecimal(), poolToken.decimals)
  let newAmount = poolToken.balance.minus(tokenAmountOut)
  poolToken.balance = newAmount
  poolToken.save()

  let pool = Pool.load(poolId)

  if(pool == null) return

  pool.exitsCount += BigInt.fromI32(1)
  if (newAmount.equals(ZERO_BD)) {
    decrPoolCount(pool.active, pool.finalized, pool.crp)
    pool.active = false
  }
  pool.save()

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'exit')
}

export function handleSmartJoinPool(event: LogJoin): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)

  if(pool == null) return

  let address = event.params.tokenIn.toHex()
  let poolTypeId = poolId.concat('-').concat(address.toString())
  let poolType = PoolToken.load(poolTypeId)

  if(poolType == null) return

  let tokenAmountIn = tokenToDecimal(event.params.tokenAmountIn.toBigDecimal(), poolType.decimals)

  // let newAmount = poolType.balance.plus(tokenAmountIn)
  let newAmount = poolType.balance
  poolType.balance = newAmount
  poolType.save()
  pool.save()

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'LogJoin', poolId, address, tokenAmountIn, newAmount)
}

export function handleSmartExitPool(event: LogExit): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)

  if(pool == null) return

  let address = event.params.tokenOut.toHex()
  let poolTypeId = poolId.concat('-').concat(address.toString())
  let poolType = PoolToken.load(poolTypeId)
  if(poolType == null) return
  let tokenAmountOut = tokenToDecimal(event.params.tokenAmountOut.toBigDecimal(), poolType.decimals)
  // let newAmount = poolType.balance.minus(tokenAmountOut)
  let newAmount = poolType.balance
  poolType.balance = newAmount
  poolType.save()
  pool.save()

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'LogExit', poolId, address, tokenAmountOut, newAmount)
}

export function handleShareJoinPool(event: LogCall): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)

  if(pool == null) return

  let callData = event.params.data.toHexString()
  let splitString = callData.split("0x3befcde8")[1]
  let lpTokenShare = '0x'+splitString.slice(0, 64)
  let lpTokenHex = hexToDecimal(lpTokenShare, 18)

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'LogCallJoinPool', poolId, '', ZERO_BD, ZERO_BD, lpTokenHex)
  pool.save()
}

export function handleShareExitPool(event: LogCall): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)
  
  if(pool == null) return

  let callData = event.params.data.toHexString()
  let splitString = callData.split("0xb02f0b73")[1]
  let lpTokenShare = '0x'+splitString.slice(0, 64)
  let lpTokenHex = hexToDecimal(lpTokenShare, 18)

  updatePoolLiquidity(poolId)
  saveTransaction(event, 'LogCallExitPool', poolId, '', ZERO_BD, ZERO_BD, lpTokenHex)
  pool.save()
}

export function handleSmartTransfer(event: SmartPoolTransfer): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!

  let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  let isMint = event.params.from.toHex() == ZERO_ADDRESS
  // seller
  let isBurn = event.params.to.toHex() == ZERO_ADDRESS

  let poolShareFromId = poolId.concat('-').concat(event.params.from.toHex())
  let poolShareFrom = PoolShare.load(poolShareFromId)
  let poolShareFromBalance = poolShareFrom == null ? ZERO_BD : poolShareFrom.balance

  let poolShareToId = poolId.concat('-').concat(event.params.to.toHex())
  let poolShareTo = PoolShare.load(poolShareToId)
  let poolShareToBalance = poolShareTo == null ? ZERO_BD : poolShareTo.balance

  let pool = Pool.load(poolId)
  if(pool == null) return
  if (isMint) {
    if (poolShareTo == null) {
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)!
    }
    poolShareTo.balance += tokenToDecimal(event.params.value.toBigDecimal(), 18)
    poolShareTo.save()
    pool.totalShares += tokenToDecimal(event.params.value.toBigDecimal(), 18)
  } else if (isBurn) {
    if (poolShareFrom == null) {
    createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
    poolShareFrom = PoolShare.load(poolShareFromId)!
  }
    poolShareFrom.balance -= tokenToDecimal(event.params.value.toBigDecimal(), 18)
    poolShareFrom.save()
    pool.totalShares -= tokenToDecimal(event.params.value.toBigDecimal(), 18)
  } else {
    if (poolShareTo == null) {
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)!
    }
    poolShareTo.balance += tokenToDecimal(event.params.value.toBigDecimal(), 18)
    poolShareTo.save()

    if (poolShareFrom == null) {
      createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
      poolShareFrom = PoolShare.load(poolShareFromId)!
    }
    poolShareFrom.balance -= tokenToDecimal(event.params.value.toBigDecimal(), 18)
    poolShareFrom.save()
  }

  if (
    poolShareTo !== null
    && poolShareTo.balance.notEqual(ZERO_BD)
    && poolShareToBalance.equals(ZERO_BD)
  ) {
    pool.holdersCount += BigInt.fromI32(1)
  }

  if (
    poolShareFrom !== null
    && poolShareFrom.balance.equals(ZERO_BD)
    && poolShareFromBalance.notEqual(ZERO_BD)
  ) {
    pool.holdersCount -= BigInt.fromI32(1)
  }

  pool.save()
}

export function handleLogWhiteList(event: LOG_WHITELIST): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  if(poolId == null) return
  let pool = Pool.load(poolId)
  if(pool == null) return
  let poolWhiteListId = poolId.concat('-').concat(event.params.token.toHex())
  
  let whilteList = TokenWhiteList.load(poolWhiteListId)
  if(whilteList == null) {
    createTokenListEntity(
      poolWhiteListId, 
      poolId, 
      event.params.spender.toHex(), 
      event.params.sort, 
      event.params.caller.toHex(), 
      event.params.token.toHex()
    );
  }else{
    whilteList.spender =  event.params.spender.toHex()
    whilteList.sort =  event.params.sort
    whilteList.caller = event.params.caller.toHex()
    whilteList.token = event.params.token.toHex()
    whilteList.save()
  }
  pool.save()
}

export function handleWhiteListLiqudityProvider(event: LogCall): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)
  if(pool == null) return
  let callData = event.params.data.toHexString()
  let splitString = callData.split("0xc83a1c2d")[1]
  let investAddress = '0x'+splitString.slice(24)
  let poolinvestListId = poolId.concat('-').concat(investAddress)
  let investId = InvestorList.load(poolinvestListId)

  if(investId == null) {
    createInvestListEntity(poolinvestListId, poolId, investAddress)
  }else{
    investId.address = investAddress
    investId.save()
  }

  pool.save()
}

export function handleRemoveWhitelistedLiquidityProvider(event: LogCall): void {
  let crp = ConfigurableRightsPool.bind(event.address)
  let poolId = getCrpUnderlyingPool(crp)!
  let pool = Pool.load(poolId)

  if (pool == null) return
  // InvestorList
  let callData = event.params.data.toHexString()
  let splitString = callData.split("0xe2762d4b")[1]
  let investAddress = '0x'+splitString.slice(24)

  let poolinvestListId = poolId.concat('-').concat(investAddress)
  let investId = InvestorList.load(poolinvestListId)

  if(investId == null) {
    createInvestListEntity(poolinvestListId, poolId, investAddress)
  }else{
    investId.poolId = ''
    investId.address = null
    investId.save()
  }
  pool.save()
}

export function handlePoolTokenInit(event: PoolTokenInit): void {
  let caller =  event.params.caller.toHex()
  let pool = event.params.pool.toHex()
  let initToken = event.params.initToken.toHex()
  let initTokenTotal = event.params.initTokenTotal
  let initShare = event.params.initShare
  let initPoolId = pool.concat('-').concat(initToken)

  let initPoolListId = new PoolTokenInitList(initPoolId)
  if(initPoolListId == null) {
    let newInitPoolListId =  new PoolTokenInitList(initPoolId)
    newInitPoolListId.caller = caller
    newInitPoolListId.pool = pool
    newInitPoolListId.initToken = initToken
    newInitPoolListId.initTokenTotal = initTokenTotal
    newInitPoolListId.initShare = initShare
    newInitPoolListId.save()
  }else{
    initPoolListId.caller = caller
    initPoolListId.pool = pool
    initPoolListId.initToken = initToken
    initPoolListId.initTokenTotal = initTokenTotal
    initPoolListId.initShare = initShare
    initPoolListId.save()
  }
}
