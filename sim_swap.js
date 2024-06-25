const { Connection, PublicKey } = require("@solana/web3.js")
const { Liquidity, MAINNET_PROGRAM_ID, TOKEN_PROGRAM_ID, Token, TokenAmount, Percent } = require('@raydium-io/raydium-sdk');

const swap = async () => {

    const connection = new Connection('https://small-alien-needle.solana-mainnet.quiknode.pro/770bd5f12ee210e2c1e3a00c2483d5057c7faa04/', "confirmed");

    try {

        // get pool keys

        // non pump fun coin

        /*

        const poolKeys = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            baseMint: new PublicKey('7CVoN5jfzpV5DxEjWACjJBoy4qK4m9eCZgUEFtqyyqg1'),
            quoteMint: new PublicKey('So11111111111111111111111111111111111111112'),
            baseDecimals: 6,
            quoteDecimals: 9,
            marketId: new PublicKey('12m3Lfj2WQtQ7NjGzjvh82LLfSm3NZ6BBK8ZRPVtjGBd'),
            programId: MAINNET_PROGRAM_ID.AmmV4,
            marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET
        });

        poolKeys.marketBaseVault = new PublicKey('8LDxzqXCh2YoRmjCkRKkrQjQ379qB9cSEWanw84D92d')
        poolKeys.marketQuoteVault = new PublicKey('FH8eydph3ns7Uko2pHwCxWvf51pAZRS6Sbz2DcSE7XgY')
        poolKeys.marketBids = new PublicKey('8rE4vCEf5M5LX3x6BWTwsGeyqoeyUrK6TdnNznvpUMeZ')
        poolKeys.marketAsks = new PublicKey('9pWHzrDB7U6ukQr5hxLKgoESUE17TLne3CXVeYr6jooD')
        poolKeys.marketEventQueue = new PublicKey('8hYtiPoZVpzn3SoZukm9vMev2e8zVMDWEvnxqEVr9dSt')
        
        */


        // pump fun coin

        const poolKeys = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            baseMint: new PublicKey('5ZQGLVAcx7HzQaRhKwvBQRMHze5GCLw49SPpsbQvpump'),
            quoteMint: new PublicKey('So11111111111111111111111111111111111111112'),
            baseDecimals: 6,
            quoteDecimals: 9,
            marketId: new PublicKey('8vU28HaJkurz9dmDSQTLn3nfFp7kbdCeRgQgYin3kJdX'),
            programId: MAINNET_PROGRAM_ID.AmmV4,
            marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET
        });

        poolKeys.marketBaseVault = new PublicKey('5DbiGVcVEYWZaeFFm3nFbigSWKzuQcKPAN5ji7QzwVM3')
        poolKeys.marketQuoteVault = new PublicKey('6MRZ3T3mm2bWa6T9dKE1BkTnjMiMEawwo5X3FjPuk9S4')
        poolKeys.marketBids = new PublicKey('FLrENzFX7KUejtrEMT22DGhPbPPuudS3aE2R4yAkvq6m')
        poolKeys.marketAsks = new PublicKey('ELXp8EKQqf44dcmXQ4hKPoBTXAqX16hThzz18ZzWhmmy')
        poolKeys.marketEventQueue = new PublicKey('CJFdaTLMLVbkMnBgXs6wredc3WByi3h4h5cKEx6QCDCD')

        console.log('poolKeys', poolKeys)

        // get pool info

        const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys })

        console.log('poolInfo', poolInfo)

    } catch(error) {

        console.log('error', error)

    }

}

const x = async () => {

    swap()

}

x()