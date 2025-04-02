import express, { Request, Response } from 'express';
import { PumpSwapClient } from '../service/pumpSwap/pumpSwapService';
import { 
  SwapParams, 
  LiquidityAddParams, 
  LiquidityRemoveParams, 
  CreatePoolParams,
  SwapQuoteParams,
  LiquidityQuoteParams
} from '../service/pumpSwap/pumpSwapService';
import { PublicKey } from '@solana/web3.js';

// Create router and bypass type checking with 'as any' 
// This is necessary due to a version mismatch between Express 4.x and @types/express 5.x
const router = express.Router() as any;
const pumpSwapClient = new PumpSwapClient();

/**
 * Get a swap quote
 * @route POST /api/pump-swap/quote-swap
 */
router.post('/quote-swap', async (req: Request, res: Response) => {
  try {
    const result = await pumpSwapClient.getSwapQuote(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /quote-swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting swap quote',
    });
  }
});

/**
 * Get a liquidity quote
 * @route POST /api/pump-swap/quote-liquidity
 */
router.post('/quote-liquidity', async (req: Request, res: Response) => {
  try {
    const result = await pumpSwapClient.getLiquidityQuote(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /quote-liquidity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting liquidity quote',
    });
  }
});

/**
 * Build a swap transaction
 * @route POST /api/pump-swap/build-swap
 */
router.post('/build-swap', async (req: Request, res: Response) => {
  try {
    const result = await pumpSwapClient.buildSwapTx(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /build-swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error building swap transaction',
    });
  }
});

/**
 * Build an add liquidity transaction
 * @route POST /api/pump-swap/build-add-liquidity
 */
router.post('/build-add-liquidity', async (req: Request, res: Response) => {
  try {
    const result = await pumpSwapClient.buildAddLiquidityTx(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /build-add-liquidity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error building add liquidity transaction',
    });
  }
});

/**
 * Build a remove liquidity transaction
 * @route POST /api/pump-swap/build-remove-liquidity
 */
router.post('/build-remove-liquidity', async (req: Request, res: Response) => {
  try {
    const result = await pumpSwapClient.buildRemoveLiquidityTx(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /build-remove-liquidity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error building remove liquidity transaction',
    });
  }
});

/**
 * Build a create pool transaction
 * @route POST /api/pump-swap/build-create-pool
 */
router.post('/build-create-pool', async (req: Request, res: Response) => {
  try {
    console.log("Pool creation request received:", {
      baseMint: req.body.baseMint,
      quoteMint: req.body.quoteMint,
      baseAmount: req.body.baseAmount,
      quoteAmount: req.body.quoteAmount,
      index: req.body.index
    });
    
    // Validate the base and quote mints are different
    if (req.body.baseMint === req.body.quoteMint) {
      return res.status(400).json({
        success: false,
        error: 'Base and quote tokens cannot be the same',
      });
    }
    
    // Validate amounts
    if (req.body.baseAmount <= 0 || req.body.quoteAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Token amounts must be greater than zero',
      });
    }
    
    // Validate input addresses
    try {
      // Public key constructor will throw if invalid
      new PublicKey(req.body.baseMint);
      new PublicKey(req.body.quoteMint);
      new PublicKey(req.body.userPublicKey);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid public key format',
      });
    }
    
    const result = await pumpSwapClient.buildCreatePoolTx(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /build-create-pool:', error);
    const errorMessage = error.message || 'Error building create pool transaction';
    
    // Send a more descriptive error to client
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
});

/**
 * Simulate a swap
 * @route POST /api/pump-swap/simulate-swap
 */
router.post('/simulate-swap', async (req: Request, res: Response) => {
  try {
    const result = await pumpSwapClient.simulateSwap(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /simulate-swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error simulating swap',
    });
  }
});

export const pumpSwapRouter = router; 