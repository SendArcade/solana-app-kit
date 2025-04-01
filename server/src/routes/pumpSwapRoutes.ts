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

const router = express.Router();
const pumpSwapClient = new PumpSwapClient();

/**
 * Get a swap quote
 * @route POST /api/pump-swap/quote-swap
 */
router.post('/quote-swap', async (req: Request<{}, {}, SwapQuoteParams>, res: Response) => {
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
router.post('/quote-liquidity', async (req: Request<{}, {}, LiquidityQuoteParams>, res: Response) => {
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
router.post('/build-swap', async (req: Request<{}, {}, SwapParams>, res: Response) => {
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
router.post('/build-add-liquidity', async (req: Request<{}, {}, LiquidityAddParams>, res: Response) => {
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
router.post('/build-remove-liquidity', async (req: Request<{}, {}, LiquidityRemoveParams>, res: Response) => {
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
router.post('/build-create-pool', async (req: Request<{}, {}, CreatePoolParams>, res: Response) => {
  try {
    const result = await pumpSwapClient.buildCreatePoolTx(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in POST /build-create-pool:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error building create pool transaction',
    });
  }
});

/**
 * Simulate a swap
 * @route POST /api/pump-swap/simulate-swap
 */
router.post('/simulate-swap', async (req: Request<{}, {}, SwapParams>, res: Response) => {
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