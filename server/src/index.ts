// File: src/index.ts
import express, { Request, Response } from 'express';
import { TokenMillClient } from './service/tokenMill';
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
import { PublicKey } from '@solana/web3.js';
import { launchRouter } from './routes/pumpfunLaunch';
import { buildCompressedNftListingTx } from './utils/compressedNftListing';
import { threadRouter } from './routes/threadRoutes';
import knex from './db/knex';

const app = express();
app.use(express.json());

// Test the database connection.
// Instead of exiting on error, we log the error and continue.
async function testDbConnection() {
  try {
    const result = await knex.raw('select 1+1 as result');
    console.log(
      'Database connection successful:',
      result.rows ? result.rows[0] : result
    );
  } catch (error) {
    console.error('Database connection failed:', error);
    console.warn('Proceeding without a successful DB connection.');
  }
}

// Run migrations.
// If migrations fail, log error and continue instead of exiting.
async function runMigrationsAndStartServer() {
  try {
    console.log('Running migrations...');
    const [batchNo, log] = await knex.migrate.latest();
    console.log(`Migrations ran successfully in batch ${batchNo}`);
    if (log.length > 0) {
      console.log('Migrations executed:', log);
    }
  } catch (error) {
    console.error('Migration error:', error);
    console.warn('Proceeding without running migrations.');
  }
}

// Use the pumpfun and thread routes.
app.use('/api/pumpfun', launchRouter);
app.use('/api', threadRouter);

/**
 * TokenMill client instance for interacting with the Solana program.
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
      const { market } = req.body as FreeMarketParams;
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
  },
);

app.post('/api/swap', async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      market,
      quoteTokenMint,
      action,
      tradeType,
      amount,
      otherAmountThreshold,
      userPublicKey,
    } = req.body;
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
 */
app.post(
  '/api/stake',
  async (
    req: Request<{}, {}, StakingParams & { userPublicKey: string }>,
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
 * @route POST /api/vesting/release
 */
app.post('/api/vesting/release', async (req: any, res: any) => {
  try {
    const {
      marketAddress,
      vestingPlanAddress,
      baseTokenMint,
      userPublicKey,
    } = req.body;
    const result = await tokenMill.buildReleaseVestingTx({
      marketAddress,
      vestingPlanAddress,
      baseTokenMint,
      userPublicKey,
    });
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    return res.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('[POST /api/vesting/release] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

app.post('/api/set-curve', async (req: Request, res: Response): Promise<any> => {
  try {
    const { market, userPublicKey, askPrices, bidPrices } = req.body;
    if (!market || !userPublicKey || !askPrices || !bidPrices) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: market, userPublicKey, askPrices, bidPrices',
      });
    }
    const result = await tokenMill.buildSetCurveTx({
      market,
      userPublicKey,
      askPrices,
      bidPrices,
    });
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    return res.status(200).json({
      success: true,
      transaction: result.data?.transaction,
    });
  } catch (error: any) {
    console.error('[POST /api/set-curve] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error in set-curve',
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
    const { assetId } = req.body;
    if (!assetId) {
      return res.status(400).json({ error: 'Asset ID is required' });
    }
    try {
      const metadata = await tokenMill.getAssetMetadata(assetId);
      res.json(metadata);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

// Start the Express server.
// Note: We now try connecting to the database and running migrations,
// but if these fail we log the error and continue to start the server.
const PORT = process.env.PORT || 3000;


(async function startServer() {
  await testDbConnection();
  await runMigrationsAndStartServer();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
