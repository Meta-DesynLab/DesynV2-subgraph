import {
  BigDecimal,
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
} from '@graphprotocol/graph-ts'
import {
  Pool,
  User,
  PoolToken,
  PoolShare,
  TokenWhiteList,
  InvestorList,
  ExcuteList,
  TokenPrice,
  Transaction,
  Desyn
} from '../types/schema'
import { BTokenBytes } from '../types/templates/Pool/BTokenBytes'
import { BToken } from '../types/templates/Pool/BToken'
import { CRPFactory } from '../types/Factory/CRPFactory'
import { ConfigurableRightsPool } from '../types/Factory/ConfigurableRightsPool'

export let ZERO_BD = BigDecimal.fromString('0')

let network = dataSource.network()

// Config for mainnet

let WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
let DAI = '0x6b175474e89094c44da98b954eedeac495271d0f'
let CRP_FACTORY = '0xE806Af9E1e73281F420e0996d3F5b9333267Dc13'


export function hexToDecimal(hexString: string, decimals: i32): BigDecimal {
  let bytes = Bytes.fromHexString(hexString).reverse() as Bytes
  let bi = BigInt.fromUnsignedBytes(bytes)
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return bi.divDecimal(scale)
}

export function bigIntToDecimal(amount: BigInt, decimals: i32): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.toBigDecimal().div(scale)
}

export function tokenToDecimal(amount: BigDecimal, decimals: i32): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.div(scale)
}

export function createPoolShareEntity(id: string, pool: string, user: string): void {
  let poolShare = new PoolShare(id)

  createUserEntity(user)

  poolShare.userAddress = user
  poolShare.poolId = pool
  poolShare.balance = ZERO_BD
  poolShare.save()
}

export function createTokenListEntity(id: string, pool: string, spender: string, sort: BigInt, caller: string, token: string): void {
  let list = new TokenWhiteList(id)
  createUserEntity(caller)
  list.poolId = pool
  list.spender = spender
  list.sort = sort
  list.caller = caller
  list.token = token
  list.save()
}

export function createExcuteListEntity(hash: string, poolId: string ):void {
  if(!hash) {
    return 
  }
  let excuteList = new ExcuteList(hash)
  excuteList.id = hash
  excuteList.hash = poolId
  excuteList.save()
}

export function createInvestListEntity(id: string, pool: string, address: string): void {
  let list =  new InvestorList(id);

  list.poolId = pool;
  list.address = address;
  list.save()
}

export function createPoolTokenEntity(id: string, pool: string, address: string): void {
  let token = BToken.bind(Address.fromString(address))
  let tokenBytes = BTokenBytes.bind(Address.fromString(address))
  let symbol = ''
  let name = ''
  let decimals = 18

  // COMMENT THE LINES BELOW OUT FOR LOCAL DEV ON KOVAN

  let symbolCall = token.try_symbol()
  let nameCall = token.try_name()
  let decimalCall = token.try_decimals()

  if (symbolCall.reverted) {
    let symbolBytesCall = tokenBytes.try_symbol()
    if (!symbolBytesCall.reverted) {
      symbol = symbolBytesCall.value.toString()
    }
  } else {
    symbol = symbolCall.value
  }

  if (nameCall.reverted) {
    let nameBytesCall = tokenBytes.try_name()
    if (!nameBytesCall.reverted) {
      name = nameBytesCall.value.toString()
    }
  } else {
    name = nameCall.value
  }

  if (!decimalCall.reverted) {
    decimals = decimalCall.value
  }

  let poolToken = new PoolToken(id)
  poolToken.poolId = pool
  poolToken.address = address
  poolToken.name = name
  poolToken.symbol = symbol
  poolToken.decimals = decimals
  poolToken.balance = ZERO_BD
  poolToken.denormWeight = ZERO_BD
  poolToken.save()
}

export function updatePoolLiquidity(id: string): void {
  let pool = Pool.load(id)
  let tokensList: Array<Bytes> = pool.tokensList
  let tokensOriginalList: Array<Bytes> = pool.tokensList

  if (pool.tokensCount.equals(BigInt.fromI32(0))) {
    pool.liquidity = ZERO_BD
    pool.save()
    return
  }

  if (!tokensList || pool.tokensCount.lt(BigInt.fromI32(2)) || !pool.publicSwap) return

  // Find pool liquidity

  let hasPrice = false
  let hasUsdPrice = false
  let poolLiquidity = ZERO_BD

  if (tokensList.includes(Address.fromString(WETH))) {
    let wethTokenPrice = TokenPrice.load(WETH)
    if (wethTokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(WETH)
      let poolToken = PoolToken.load(poolTokenId)
      poolLiquidity = wethTokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      hasPrice = true
    }
  } else if (tokensList.includes(Address.fromString(DAI))) {
    let daiTokenPrice = TokenPrice.load(DAI)
    if (daiTokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(DAI)
      let poolToken = PoolToken.load(poolTokenId)
      poolLiquidity = daiTokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      hasPrice = true
    }
  }

  // Create or update token price

  if (hasPrice) {
    for (let i: i32 = 0; i < tokensList.length; i++) {
      let tokenPriceId = tokensList[i].toHexString()
      let tokenPrice = TokenPrice.load(tokenPriceId)
      if (tokenPrice == null) {
        tokenPrice = new TokenPrice(tokenPriceId)
        tokenPrice.poolTokenId = ''
        tokenPrice.poolLiquidity = ZERO_BD
      }

      let poolTokenId = id.concat('-').concat(tokenPriceId)
      let poolToken = PoolToken.load(poolTokenId)

      if (
        pool.active && !pool.crp && pool.tokensCount.notEqual(BigInt.fromI32(0)) && pool.publicSwap &&
        (tokenPrice.poolTokenId == poolTokenId || poolLiquidity.gt(tokenPrice.poolLiquidity)) &&
        (
          (tokenPriceId != WETH.toString() && tokenPriceId != DAI.toString()) ||
          (pool.tokensCount.equals(BigInt.fromI32(2)) && hasUsdPrice)
        )
      ) {
        tokenPrice.price = ZERO_BD

        if (poolToken.balance.gt(ZERO_BD)) {
          tokenPrice.price = poolLiquidity.div(pool.totalWeight).times(poolToken.denormWeight).div(poolToken.balance)
        }

        tokenPrice.symbol = poolToken.symbol
        tokenPrice.name = poolToken.name
        tokenPrice.decimals = poolToken.decimals
        tokenPrice.poolLiquidity = poolLiquidity
        tokenPrice.poolTokenId = poolTokenId
        tokenPrice.save()
      }
    }
  }

  // Update pool liquidity

  let liquidity = ZERO_BD
  let denormWeight = ZERO_BD

  for (let i: i32 = 0; i < tokensList.length; i++) {
    let tokenPriceId = tokensList[i].toHexString()
    let tokenPrice = TokenPrice.load(tokenPriceId)
    if (tokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(tokenPriceId)
      let poolToken = PoolToken.load(poolTokenId)
      if (tokenPrice.price.gt(ZERO_BD) && poolToken.denormWeight.gt(denormWeight)) {
        denormWeight = poolToken.denormWeight
        liquidity = tokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      }
    }
  }

  let factory = Desyn.load('1')
  factory.totalLiquidity = factory.totalLiquidity.minus(pool.liquidity).plus(liquidity)
  factory.save()

  pool.liquidity = liquidity
  pool.tokensOriginalList = tokensOriginalList
  pool.save()
}

export function decrPoolCount(active: boolean, finalized: boolean, crp: boolean): void {
  if (active) {
    let factory = Desyn.load('1')
    factory.poolCount = factory.poolCount - 1
    if (finalized) factory.finalizedPoolCount = factory.finalizedPoolCount - 1
    if (crp) factory.crpCount = factory.crpCount - 1
    factory.save()
  }
}

export function saveTransaction(
  event: ethereum.Event, 
  eventName: string, 
  poolAddress: string = '0',  
  tokenAddress: string = '0',
  tokenAmountInOut: BigDecimal = ZERO_BD,
  newAmount: BigDecimal = ZERO_BD,
  lpTokenShare: BigDecimal = ZERO_BD,
  ): void {
  let tx = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let userAddress = event.transaction.from.toHex()
  let transaction = Transaction.load(tx)
  if (transaction == null) {
    transaction = new Transaction(tx)
  }

  let poolSmartAddress = poolAddress.length != 0 ? poolAddress : event.address.toHex()
  
  transaction.event = eventName
  transaction.poolAddress = poolSmartAddress
  transaction.tokenAddress = tokenAddress
  transaction.userAddress = userAddress
  transaction.gasUsed = event.transaction.gasUsed.toBigDecimal()
  transaction.gasPrice = event.transaction.gasPrice.toBigDecimal()
  transaction.tx = event.transaction.hash
  transaction.timestamp = event.block.timestamp.toI32()
  transaction.block = event.block.number.toI32()
  transaction.newAmount = newAmount
  transaction.tokenAmountInOut = tokenAmountInOut
  transaction.lpTokenShare = lpTokenShare
  transaction.save()

  createUserEntity(userAddress)
}

export function createUserEntity(address: string): void {
  if (User.load(address) == null) {
    let user = new User(address)
    user.save()
  }
}

export function isCrp(address: Address, block: ethereum.Block): boolean {
  let crpFactory = CRPFactory.bind(Address.fromString(CRP_FACTORY))
  let isCrp = crpFactory.try_isCrp(address)
  if (isCrp.reverted) return false
  return isCrp.value
}

export function getCrpUnderlyingPool(crp: ConfigurableRightsPool): string | null {
  let bPool = crp.try_bPool()
  if (bPool.reverted) return null;
  return bPool.value.toHexString()
}

export function getCrpController(crp: ConfigurableRightsPool): string | null {
  let controller = crp.try_getController()
  if (controller.reverted) return null;
  return controller.value.toHexString()
}

export function getCrpSymbol(crp: ConfigurableRightsPool): string {
  let symbol = crp.try_symbol()
  if (symbol.reverted) return ''
  return symbol.value
}

export function getCrpName(crp: ConfigurableRightsPool): string {
  let name = crp.try_name()
  if (name.reverted) return ''
  return name.value
}

export function getCrpEtype(crp: ConfigurableRightsPool): BigInt {
  let etype = crp.try_etype()
  if(etype.reverted) return BigInt.fromI32(0)
  return  BigInt.fromI32(etype.value)
}

export function getCrpEtfStatusCollectPeriod(crp: ConfigurableRightsPool): BigInt {
  let etfStatus = crp.try_etfStatus()
  if(etfStatus.reverted) return BigInt.fromI32(0)
  return etfStatus.value.value0
}

export function getCrpEtfStatusCollectEndTime(crp: ConfigurableRightsPool): BigInt {
  let etfStatus = crp.try_etfStatus()
  if(etfStatus.reverted) return BigInt.fromI32(0)
  return etfStatus.value.value1
}

export function getCrpEtfStatusClosurePeriod(crp: ConfigurableRightsPool): BigInt {
  let etfStatus = crp.try_etfStatus()
  if(etfStatus.reverted) return BigInt.fromI32(0)
  return etfStatus.value.value2
}

export function getCrpEtfStatusClosureEndTime(crp: ConfigurableRightsPool): BigInt {
  let etfStatus = crp.try_etfStatus()
  if(etfStatus.reverted) return BigInt.fromI32(0)
  return etfStatus.value.value3
}

export function getUpperCap(crp: ConfigurableRightsPool): BigInt {
  let etfStatus = crp.try_etfStatus()
  if(etfStatus.reverted) return BigInt.fromI32(0)
  return etfStatus.value.value4
}

export function getFloorCap(crp: ConfigurableRightsPool): BigInt {
  let etfStatus = crp.try_etfStatus()
  if(etfStatus.reverted) return BigInt.fromI32(0)
  return etfStatus.value.value5
}

export function getStartClaimFeeTime(crp: ConfigurableRightsPool): BigInt {
  let startclaimFeeTime = crp.try_etfStatus()
  if(startclaimFeeTime.reverted) return BigInt.fromI32(0)
  return startclaimFeeTime.value.value10
}


export function getCrpRights(crp: ConfigurableRightsPool): string[] {
  let rights = crp.try_rights()
  if (rights.reverted) return []
  let rightsArr: string[] = []
  if (rights.value.value0) rightsArr.push('canWhitelistLPs')
  if (rights.value.value1) rightsArr.push('canTokenWhiteLists')
  return rightsArr
}
