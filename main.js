const { Connection, PublicKey } = require("@solana/web3.js");
const { 
  MAINNET_PROGRAM_ID, 
  LIQUIDITY_STATE_LAYOUT_V4, 
  MARKET_STATE_LAYOUT_V3, 
  SPL_MINT_LAYOUT,
  Market
} = require('@raydium-io/raydium-sdk');
const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl = require('@solana/spl-token');
const { Metaplex } = require("@metaplex-foundation/js");

const wsolAddress = 'So11111111111111111111111111111111111111112';
const openbookProgramId = new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
const rayProgram = new web3.PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
const myAccount = new web3.PublicKey('4ucqCoxMAkyziRgvfaXFBThmNAWBUvqAoTAropetZ53C');
const rayFee = new PublicKey(
  '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'
);
let connection = new Connection("https://warmhearted-bitter-tree.solana-mainnet.quiknode.pro/2cd6e627f27713ce4e7344b4f80ecb743d0e2b38/")

class Pair {
  address
  amount
  decimal
  constructor(address = "", amount = 0, decimal = 9) {
    this.address = address
    this.amount = amount
    this.decimal = decimal
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function doRaydiumPoolSniper(
  signature,
  poolSummary,
  poolKey,
  poolSize,
  createdAt) {

  processingSignature = signature

  const base = poolSummary.base.address
  const dangerInfo = poolSummary.danger
  let isDanger = !(dangerInfo.freezeAuthDisabled && dangerInfo.mintAuthDisabled && dangerInfo.lpBurned)
  console.log(`POOL-SIZE:: ${poolSize}, base = ${base}, danger:${isDanger}`)

  const poolDetectionTimstamp = new Date().getTime()
  const detectLatancy = (poolDetectionTimstamp - createdAt) / 1000
  console.log(`detecting pool elapsed *** ${detectLatancy}s ***.`)

  if (!dangerInfo.freezeAuthDisabled) {
    console.log(`This token could be frozen. skipping...`)
    return
  }
}

async function getPoolSummary(poolId) {
  // lp burn
  let poolDecoded = undefined
  let marketInfo = undefined
  let marketAcc = undefined
  while (true) {
    try {
      const poolAcc = await connection.getAccountInfo(new PublicKey(poolId))
      poolDecoded = LIQUIDITY_STATE_LAYOUT_V4.decode(poolAcc.data)
      marketAcc = await connection.getAccountInfo(new PublicKey(poolDecoded.marketId))
      marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAcc.data)
      break
    } catch (error) {
      console.log(`Cannot get pool account. retrying...`)
      await sleep(500)
      continue
    }
  }
  // console.log(`POOL-DECODED :: ID(${poolId}) DECODED = `, poolDecoded)
  // get amounts of pair
  let baseMintAddr
  let base
  let quote
  if (poolDecoded.baseMint.toString() === wsolAddress) {
    baseMintAddr = poolDecoded.quoteMint
    base = new Pair(
      poolDecoded.quoteMint.toString(),
      poolDecoded.swapBaseInAmount / (10 ** poolDecoded.baseDecimal),
      poolDecoded.quoteDecimal
    )
    quote = new Pair(
      poolDecoded.baseMint.toString(),
      poolDecoded.swapQuoteOutAmount / (10 ** poolDecoded.quoteDecimal),
      poolDecoded.baseDecimal
    )
  } else {
    baseMintAddr = poolDecoded.baseMint
    base = new Pair(
      poolDecoded.baseMint.toString(),
      poolDecoded.swapQuoteInAmount / (10 ** poolDecoded.quoteDecimal),
      poolDecoded.baseDecimal
    )
    quote = new Pair(
      poolDecoded.quoteMint.toString(),
      poolDecoded.swapBaseOutAmount / (10 ** poolDecoded.baseDecimal),
      poolDecoded.quoteDecimal
    )
  }

  // danger info
  let mintAuthDisabled = false
  let freezeAuthDisabled = false

  let mintInfo
  while (true) {
    try {
      const baseMintAcc = await connection.getAccountInfo(baseMintAddr)
      mintInfo = SPL_MINT_LAYOUT.decode(baseMintAcc.data)
      break
    } catch (error) {
      await sleep(10)
      continue
    }
  }
  if (!mintInfo.mintAuthorityOption && !mintInfo.mintAuthority)
    mintAuthDisabled = true
  if (!mintInfo.freezeAuthorityOption)
    freezeAuthDisabled = true
  const totalLp = poolDecoded.lpReserve
  const remainLp = 0//await getLpAmount(poolDecoded.lpMint)
  const burnedLp = totalLp - remainLp
  const burnnedPercent = (burnedLp * 100) / totalLp

  const lpBurned = burnnedPercent > 80;
  return {
    base,
    quote,
    marketInfo,
    marketAcccount: marketAcc,
    danger: {
      mintAuthDisabled,
      freezeAuthDisabled,
      lpBurned,
      top10Holders: true
    }
  }
}

// extract pair tokens
function extractPairTokens(trWithMeta) {
  const info = trWithMeta?.transaction?.message?.instructions
  const instruction = info.find(inst => inst?.accounts && inst?.accounts.length >= 16)
  if (!instruction) {
    console.log(`Cannot find pair tokens from transaction metadata!`)
    return [null, null, null, null]
  }

  // get addresses
  const accounts = instruction.accounts
  let base = accounts[8].toString()
  let quote = accounts[9].toString()
  // get amounts
  const innerInstruction = trWithMeta?.meta?.innerInstructions
  const instructions = innerInstruction[0]?.instructions
  const liqMints = instructions.slice(-3)

  let amountBase
  let amountQuote
  amountBase = parseFloat(liqMints[0].parsed.info.amount)
  amountQuote = parseFloat(liqMints[1].parsed.info.amount)
  if (base === wsolAddress) {
    const tmp = base
    base = quote
    quote = tmp
    amountBase = parseFloat(liqMints[1].parsed.info.amount)
    amountQuote = parseFloat(liqMints[0].parsed.info.amount)
  }
  // get decimals
  return [accounts, amountBase, amountQuote, base]
}


async function analyzePoolCreationTransaction(signature) {
  let trWithMeta = null
  while (true) {
    trWithMeta = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 2.0 })
    if (trWithMeta && trWithMeta.meta) {
      break
    }
  }

  if (trWithMeta.meta.err) {
    return
  }

  const createdAt = new Date(trWithMeta?.blockTime * 1000)
  // extract pair tokens
  const [accounts, amountBase, amountQuote, base] = extractPairTokens(trWithMeta);
  const poolSummary = await getPoolSummary(accounts[4])

  let poolSize = 0
  let baseDecimal, quoteDecimal
  if (base === accounts[8].toString()) {
    poolSize = amountQuote / (10 ** poolSummary.quote.decimal)
    baseDecimal = poolSummary.base.decimal
    quoteDecimal = poolSummary.quote.decimal
  } else {
    poolSize = amountQuote / (10 ** poolSummary.quote.decimal)
    baseDecimal = poolSummary.quote.decimal
    quoteDecimal = poolSummary.base.decimal
  }

  const marketInfo = poolSummary.marketInfo
  const marketAccount = poolSummary.marketAcccount
  // construct pool information
  const poolKeys = {
    id: accounts[4],
    baseMint: new PublicKey(accounts[8]),
    quoteMint: new PublicKey(accounts[9]),
    lpMint: accounts[7],
    baseDecimals: baseDecimal,
    quoteDecimals: quoteDecimal,
    lpDecimals: baseDecimal,
    version: 4,
    programId: rayProgram,
    authority: accounts[5],
    openOrders: accounts[6],
    targetOrders: accounts[12],
    baseVault: accounts[10],
    quoteVault: accounts[11],
    withdrawQueue: PublicKey.default,
    lpVault: PublicKey.default,
    marketVersion: 3,
    marketProgramId: marketAccount.owner,
    marketId: accounts[16],
    marketAuthority: Market.getAssociatedAuthority({ programId: marketAccount.owner, marketId: new PublicKey(accounts[16]) }).publicKey,
    marketBaseVault: marketInfo.baseVault,
    marketQuoteVault: marketInfo.quoteVault,
    marketBids: marketInfo.bids,
    marketAsks: marketInfo.asks,
    marketEventQueue: marketInfo.eventQueue,
    lookupTableAccount: PublicKey.default
  }

  const poolCreationTimestamp = createdAt.getTime()
  await doRaydiumPoolSniper(signature, poolSummary, poolKeys, poolSize, poolCreationTimestamp)
}

let oldSignature = ""
async function raydiumEventCallback({ logs, err, signature }) {
  const searchInstruction = "initialize2"
  if (err || signature === oldSignature) return;
  if (logs && logs.some(log => log.includes(searchInstruction))) {
    console.log(`+++++++++++++++++++++ WEB3 Detection (QUICKNODE) : ${signature} `)
    oldSignature = signature
    await analyzePoolCreationTransaction(signature)
  }
}
async function main() {
  connection.onLogs(
    rayProgram,
    raydiumEventCallback,
    "finalized"
  )
}

main() 