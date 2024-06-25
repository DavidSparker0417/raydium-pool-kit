const { Connection, PublicKey } = require("@solana/web3.js");

const { MAINNET_PROGRAM_ID } = require('@raydium-io/raydium-sdk');


const web3 = require('@solana/web3.js');
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl = require('@solana/spl-token');
const { Market } = require('@openbook-dex/openbook');
const { Metaplex } = require("@metaplex-foundation/js");

const wsolAddress = 'So11111111111111111111111111111111111111112';
const openbookProgramId = new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');

const rayProgram = new web3.PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
const myAccount = new web3.PublicKey('4ucqCoxMAkyziRgvfaXFBThmNAWBUvqAoTAropetZ53C');

const rayFee = new PublicKey(
  '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'
);

const solanaConnection = new Connection("https://warmhearted-bitter-tree.solana-mainnet.quiknode.pro/2cd6e627f27713ce4e7344b4f80ecb743d0e2b38/", {
  wsEndpoint: 'wss://api.mainnet-beta.solana.com',
});

let connection = new Connection("https://warmhearted-bitter-tree.solana-mainnet.quiknode.pro/2cd6e627f27713ce4e7344b4f80ecb743d0e2b38/")

async function derivePoolKeys(id) {
  console.log(id);
  const marketId = new web3.PublicKey(id);

  const marketInfo = await getMarketInfo(marketId);
  const marketDeco = await getDecodedData(marketInfo);
  let baseMint = marketDeco.baseMint;
  let quoteMint = marketDeco.quoteMint;
  const revert = baseMint.toString() === wsolAddress

  let baseVault = raydium_sdk_1.findProgramAddress([rayProgram.toBuffer(), marketId.toBuffer(), Buffer.from('coin_vault_associated_seed', 'utf-8')], rayProgram)['publicKey']
  let quoteVault = raydium_sdk_1.findProgramAddress([rayProgram.toBuffer(), marketId.toBuffer(), Buffer.from('pc_vault_associated_seed', 'utf-8')], rayProgram)['publicKey']
  let marketBaseVault = marketDeco.baseVault
  let marketQuoteVault = marketDeco.quoteVault

  if (revert) {
    let tmp
    
    tmp = baseMint
    baseMint = quoteMint
    quoteMint = tmp

    tmp = baseVault
    baseVault = quoteVault
    quoteVault = tmp

    tmp = marketBaseVault
    marketBaseVault = marketQuoteVault
    marketQuoteVault = tmp
  }
  const baseMintData = await getMintData(baseMint);
  const quoteMintData = await getMintData(quoteMint);
  const baseDecimals = await getDecimals(baseMintData);
  const quoteDecimals = await getDecimals(quoteMintData);

  const authority = (raydium_sdk_1.findProgramAddress([Buffer.from([97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121])], rayProgram))['publicKey'];

  console.log(`[DAVID] baseDecimals = ${baseDecimals}, quoteDecimals = ${quoteDecimals}`)
  const poolKeys = {
    id: raydium_sdk_1.findProgramAddress([rayProgram.toBuffer(), marketId.toBuffer(), Buffer.from('amm_associated_seed', 'utf-8')], rayProgram)['publicKey'],
    baseMint,
    quoteMint,
    lpMint: raydium_sdk_1.findProgramAddress([rayProgram.toBuffer(), marketId.toBuffer(), Buffer.from('lp_mint_associated_seed', 'utf-8')], rayProgram)['publicKey'],
    baseDecimals: baseDecimals,
    quoteDecimals: quoteDecimals,
    lpDecimals: baseDecimals,
    version: 4,
    programId: rayProgram,
    authority: authority,
    openOrders: raydium_sdk_1.findProgramAddress([rayProgram.toBuffer(), marketId.toBuffer(), Buffer.from('open_order_associated_seed', 'utf-8')], rayProgram)['publicKey'],
    targetOrders: raydium_sdk_1.findProgramAddress([rayProgram.toBuffer(), marketId.toBuffer(), Buffer.from('target_associated_seed', 'utf-8')], rayProgram)['publicKey'],
    baseVault,
    quoteVault,
    withdrawQueue: new web3.PublicKey('11111111111111111111111111111111'),
    lpVault: new web3.PublicKey('11111111111111111111111111111111'),
    marketVersion: 3,
    marketProgramId: openbookProgramId,
    marketId: marketId,

    marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({ programId: new web3.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'), marketId: marketId }).publicKey,
    marketBaseVault,
    marketQuoteVault,
    marketBids: marketDeco.bids,
    marketAsks: marketDeco.asks,
    marketEventQueue: marketDeco.eventQueue,
    lookupTableAccount: web3.PublicKey.default
  };
  return poolKeys;
}

async function getMarketInfo(marketId) {
  const marketInfo = await connection.getAccountInfo(marketId);
  return marketInfo;
}

async function getDecodedData(marketInfo) {
  return await Market.getLayout(openbookProgramId).decode(marketInfo.data);
}

async function getMintData(mint) {
  return await connection.getAccountInfo(mint);
}

async function getDecimals(mintData) {
  return raydium_sdk_1.SPL_MINT_LAYOUT.decode(mintData.data).decimals;
}

async function getOwnerAta(mint, publicKey) {
  const foundAta = web3.PublicKey.findProgramAddressSync([publicKey.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];
  return foundAta;
}

function getVaultSigner(marketId, marketDeco) {
  const seeds = [marketId.toBuffer()];
  const seedsWithNonce = seeds.concat(Buffer.from([Number(marketDeco.vaultSignerNonce.toString())]), Buffer.alloc(7));
  return web3.PublicKey.createProgramAddressSync(seedsWithNonce, openbookProgramId);
}

const getTokenMetadataInfo = async (mint) => {

  try {

    // const connection = new Connection("https://api.mainnet-beta.solana.com");
    const connection = new Connection("https://warmhearted-bitter-tree.solana-mainnet.quiknode.pro/2cd6e627f27713ce4e7344b4f80ecb743d0e2b38/")
    const metaplex = Metaplex.make(connection);

    const mintAddress = new PublicKey(mint);

    let tokenName;
    let tokenSymbol;

    const metadataAccount = metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintAddress })

    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount)

    if (metadataAccountInfo) {
      const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress })

      tokenName = token.name;
      tokenSymbol = token.symbol

      return token
    }

  } catch (error) {
    console.log('error', error)
  }

}
async function parseAccountKeys(keys, signature) {
  let marketId = null;
  for (const key of keys) {
    const keyData = await connection.getAccountInfo(new PublicKey(key.pubkey));
    if (keyData !== null && keyData.data.length === 388) {
      marketId = key.pubkey;
    }
  }
  if (marketId === null) {
    parseAccountKeys(keys);
  } else {
    const poolKeys = await derivePoolKeys(marketId);
    console.log('poolKeys', poolKeys)



  }
}

const ether = async (connection) => {

  try {

    // console.log('x')

    connection.onLogs(
      rayFee,
      async ({ logs, err, signature }) => {

        try {

          if (err) {
            console.error('connection contains error', err);
            return;
          }

          console.log(`found new token signature: ${signature}`)

          let signer = '';
          let baseAddress = '';
          let baseDecimals = 0;
          let baseLpAmount = 0;
          let quoteAddress = '';
          let quoteDecimals = 0;
          let quoteLpAmount = 0;

          // You need to use a RPC provider for getParsedTransaction to work properly.
          // Check README.md for suggestions.
          const parsedTransaction = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
          });

          if (parsedTransaction && parsedTransaction.meta && !parsedTransaction.meta.err) {
            console.log('successfully parsed transaction');

            signer = parsedTransaction.transaction.message.accountKeys[0].pubkey.toString();
            console.log(`creator, ${signer}`);

            parseAccountKeys(parsedTransaction.transaction.message.accountKeys, parsedTransaction.transaction.signatures);

            const postTokenBalances = parsedTransaction.meta.postTokenBalances;
            // console.log('postTokenBalances', postTokenBalances);

            const baseInfo = postTokenBalances.find(
              (balance) =>
                balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' &&
                balance.mint !== 'So11111111111111111111111111111111111111112'
            );

            if (baseInfo) {
              // console.log('baseInfo', baseInfo);
              baseAddress = baseInfo.mint;
              baseDecimals = baseInfo.uiTokenAmount.decimals;
              baseLpAmount = baseInfo.uiTokenAmount.uiAmount;
            }

            const quoteInfo = postTokenBalances.find(
              (balance) =>
                balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' &&
                balance.mint === 'So11111111111111111111111111111111111111112'
            );

            if (quoteInfo) {
              // console.log('quoteInfo', quoteInfo);
              quoteAddress = quoteInfo.mint;
              quoteDecimals = quoteInfo.uiTokenAmount.decimals;
              quoteLpAmount = quoteInfo.uiTokenAmount.uiAmount;
            }
          }

          const newTokenData = {
            lpSignature: signature,
            creator: signer,
            timestamp: new Date().toISOString(),
            baseInfo: {
              baseAddress,
              baseDecimals,
              baseLpAmount,
            },
            quoteInfo: {
              quoteAddress,
              quoteDecimals,
              quoteLpAmount,
            },
            // logs: logs, // Ensure `logs` is defined in your scope
          };

          console.log('newTokenData', newTokenData);

        } catch (error) {

          console.log('error', error)

        }
      }
    )

  } catch (error) {

    console.log('error', error)

  }

}

ether(solanaConnection)