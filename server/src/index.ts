import express, {Request, Response} from 'express';
import {TokenMillClient} from './utils/tokenMill';
import {
  MarketParams,
  StakingParams,
  SwapParams,
  TokenParams,
  VestingParams,
  FreeMarketParams,
  TokenMetadata,
  SwapAmounts,
} from './types/interfaces';
import {PublicKey} from '@solana/web3.js';
import { launchRouter } from './routes/pumpfunLaunch';
import { buildCompressedNftListingTx } from './utils/compressedNftListing';

/**
 * Express application instance
 */
const app = express();
app.use(express.json());
app.use('/api/pumpfun', launchRouter);
/**
 * TokenMill client instance for interacting with the Solana program
 */
const tokenMill = new TokenMillClient();

interface VestingReleaseParams {
  marketAddress: string;
  vestingPlanAddress: string;
  baseTokenMint: string;
  userPublicKey: string;
}

/**
 * Create a new TokenMill configuration
 * @route POST /api/config
 * @param {Object} req.body
 * @param {string} req.body.authority - Authority public key
 * @param {string} req.body.protocolFeeRecipient - Protocol fee recipient public key
 * @param {number} req.body.protocolFeeShare - Protocol fee share percentage
 * @param {number} req.body.referralFeeShare - Referral fee share percentage
 */
app.post('/api/config', async (req: Request, res: Response) => {
  try {
    const {
      authority,
      protocolFeeRecipient,
      protocolFeeShare,
      referralFeeShare,
    } = req.body;
    const result = await tokenMill.createConfig(
      new PublicKey(authority),
      new PublicKey(protocolFeeRecipient),
      protocolFeeShare,
      referralFeeShare,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get token badge quote
 * @route POST /api/quote-token-badge
 * @param {Object} req.body - Token badge parameters
 * @returns {Promise<TokenMillResponse<any>>} Quote response
 */
app.post('/api/quote-token-badge', async (req: Request, res: Response) => {
  try {
    const result = await tokenMill.getTokenBadge(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create a new market
 * @route POST /api/markets
 * @param {MarketParams} req.body - Market creation parameters
 * @returns {Promise<TokenMillResponse<Market>>} Created market details
 */
app.post(
  '/api/markets',
  async (req: Request<{}, {}, MarketParams>, res: Response) => {
    try {
      const result = await tokenMill.buildCreateMarketTx(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);
app.post(
  '/api/free-market',
  async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const {market} = req.body as FreeMarketParams;

      // Validate required parameter
      if (!market) {
        return res.status(400).json({
          success: false,
          message: 'Market address is required',
        });
      }

      const tokenMillClient = new TokenMillClient();
      const result = await tokenMillClient.freeMarket(market);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Free market error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to free market',
        error: error.message,
      });
    }
  },
);

/**
 * Create a new token
 * @route POST /api/tokens
 * @param {TokenParams} req.body - Token creation parameters
 * @returns {Promise<TokenMillResponse<any>>} Created token details
 */
app.post(
  '/api/tokens',
  async (req: Request<{}, {}, TokenParams>, res: Response) => {
    try {
      const result = await tokenMill.createToken();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
app.post('/api/swap', async (req: Request, res: Response): Promise<any> => {
  try {
    // Cast to your extended SwapParams that includes userPublicKey
    const {
      market,
      quoteTokenMint,
      action,
      tradeType,
      amount,
      otherAmountThreshold,
      userPublicKey
    } = req.body;

    // Build a single transaction
    const result = await tokenMill.buildSwapTx({
      market,
      quoteTokenMint,
      action,
      tradeType,
      amount,
      otherAmountThreshold,
      userPublicKey,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Swap failed',
      });
    }

    // Return { success, transaction: base64Tx }
    return res.status(200).json({
      success: true,
      transaction: result.data?.transaction,
    });
  } catch (error: any) {
    console.error('[POST /api/swap] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * Create a new staking position
 * @route POST /api/stake
 * @param {StakingParams} req.body - Staking parameters
 */
app.post(
  '/api/stake',
  async (
    req: Request<{}, {}, StakingParams & {userPublicKey: string}>,
    res: Response,
  ) => {
    try {
      const result = await tokenMill.buildStakeTx(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

/**
 * Create a new vesting schedule
 * @route POST /api/vesting
 * @param {VestingParams} req.body - Vesting schedule parameters
 */
app.post(
  '/api/vesting',
  async (req: Request<{}, {}, VestingParams>, res: Response) => {
    try {
      const result = await tokenMill.buildCreateVestingTxWithAutoPositionAndATA(
        req.body,
      );
      res.json(result);
    } catch (error: any) {
      console.error('[POST /api/vesting] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  },
);

/**
 * Claim vested tokens for a specific market
 * @route POST /api/vesting/:marketAddress/claim
 * @param {string} req.params.marketAddress - Market address for the vesting schedule
 * @param {Object} req.body - Claim parameters
 */
app.post('/api/vesting/release', async (req: any, res: any) => {
  try {
    const {
      marketAddress,
      vestingPlanAddress,
      baseTokenMint,
      userPublicKey
    } = req.body;

    // Build the base64 transaction
    const result = await tokenMill.buildReleaseVestingTx({
      marketAddress,
      vestingPlanAddress,
      baseTokenMint,
      userPublicKey
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    // Return { success, data: base64Tx }
    return res.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('[POST /api/vesting/release] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
});

app.post("/api/set-curve", async (req: any, res: any) => {
  try {
    const { market, userPublicKey, askPrices, bidPrices } = req.body;

    // 1) Validate
    if (!market || !userPublicKey || !askPrices || !bidPrices) {
      return res.status(400).json({
        success: false,
        error: "Missing market, userPublicKey, askPrices, or bidPrices",
      });
    }

    // 2) Call buildSetCurveTx in tokenMill
    const result = await tokenMill.buildSetCurveTx({
      market,
      userPublicKey,
      askPrices,
      bidPrices,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    // 3) Return the base64 transaction
    return res.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("[POST /api/set-curve] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
});


app.post(
  '/api/quote-swap',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const result = await tokenMill.quoteSwap(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);
app.post(
  '/api/get-asset',
  async (req: Request, res: Response): Promise<any> => {
    const {assetId} = req.body;

    if (!assetId) {
      return res.status(400).json({error: 'Asset ID is required'});
    }

    try {
      const metadata = await tokenMill.getAssetMetadata(assetId);
      res.json(metadata);
    } catch (error: any) {
      res.status(500).json({error: error.message});
    }
  },
);
app.get(
  '/api/graduation',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const result = await tokenMill.getGraduation(req.body.market);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);


app.post('/api/build-compressed-nft-listing-tx', async (req: any, res: any) => {
  try {
    const result = await buildCompressedNftListingTx(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('Failed to build compressed NFT listing tx:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Start the Express server
 */
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
