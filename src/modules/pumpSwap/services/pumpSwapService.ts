/**
 * PumpSwap Service
 * 
 * Service layer for interacting with the Pump Swap AMM API
 */

import { PublicKey, Connection } from '@solana/web3.js';
import { 
  SwapParams, 
  AddLiquidityParams, 
  RemoveLiquidityParams, 
  CreatePoolParams
} from '../types';
import { TransactionService } from '../../embeddedWalletProviders/services/transaction/transactionService';
import { StandardWallet } from '../../embeddedWalletProviders/types';

// Define Direction enum locally
export enum Direction {
  QuoteToBase = 0,
  BaseToQuote = 1
}

import {SERVER_URL} from '@env';



const API_BASE_URL = SERVER_URL;

/**
 * Create a new pool
 */
export async function createPool({
  index,
  baseMint,
  quoteMint,
  baseAmount,
  quoteAmount,
  userPublicKey,
  connection,
  solanaWallet,
  onStatusUpdate,
}: CreatePoolParams & {
  connection: Connection;
  solanaWallet: StandardWallet | any;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  try {
    onStatusUpdate?.('Preparing pool creation...');
    
    const response = await fetch(`${API_BASE_URL}/build-create-pool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        index,
        baseMint,
        quoteMint,
        baseAmount,
        quoteAmount,
        userPublicKey,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create pool');
    }

    onStatusUpdate?.('Transaction received, sending to wallet...');
    
    // Create a filtered status callback that prevents error messages
    const filteredCallback = (status: string) => {
      if (!status.startsWith('Error:') && !status.includes('failed:')) {
        onStatusUpdate?.(status);
      } else {
        onStatusUpdate?.('Processing transaction...');
      }
    };

    const signature = await TransactionService.signAndSendTransaction(
      { type: 'base64', data: data.data.transaction },
      solanaWallet,
      { 
        connection,
        statusCallback: filteredCallback
      }
    );
    
    onStatusUpdate?.('Pool created successfully!');
    return signature;
  } catch (error) {
    console.error('Error in createPool:', error);
    // Don't send raw error through status update
    onStatusUpdate?.('Transaction failed');
    TransactionService.showError(error);
    throw error;
  }
}

/**
 * Get deposit quote when base amount changes
 */
export async function getDepositQuoteFromBase(
  pool: string,
  baseAmount: number,
  slippage: number
): Promise<{ quote: number; lpToken: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        baseAmount,
        slippage,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get deposit quote');
    }

    return data.data;
  } catch (error) {
    console.error('Error in getDepositQuoteFromBase:', error);
    throw error;
  }
}

/**
 * Get deposit quote when quote amount changes
 */
export async function getDepositQuoteFromQuote(
  pool: string,
  quoteAmount: number,
  slippage: number
): Promise<{ base: number; lpToken: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        quoteAmount,
        slippage,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get deposit quote');
    }

    return data.data;
  } catch (error) {
    console.error('Error in getDepositQuoteFromQuote:', error);
    throw error;
  }
}

/**
 * Add liquidity to a pool
 */
export async function addLiquidity({
  pool,
  baseAmount,
  quoteAmount,
  slippage,
  userPublicKey,
  connection,
  solanaWallet,
  onStatusUpdate,
}: AddLiquidityParams & {
  connection: Connection;
  solanaWallet: StandardWallet | any;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  try {
    onStatusUpdate?.('Preparing liquidity addition...');
    
    const response = await fetch(`${API_BASE_URL}/build-add-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        baseAmount,
        quoteAmount,
        slippage,
        userPublicKey,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add liquidity');
    }

    onStatusUpdate?.('Transaction received, sending to wallet...');
    
    // Create a filtered status callback that prevents error messages
    const filteredCallback = (status: string) => {
      if (!status.startsWith('Error:') && !status.includes('failed:')) {
        onStatusUpdate?.(status);
      } else {
        onStatusUpdate?.('Processing transaction...');
      }
    };

    const signature = await TransactionService.signAndSendTransaction(
      { type: 'base64', data: data.data.transaction },
      solanaWallet,
      { 
        connection,
        statusCallback: filteredCallback
      }
    );
    
    onStatusUpdate?.('Liquidity added successfully!');
    return signature;
  } catch (error) {
    console.error('Error in addLiquidity:', error);
    // Don't send raw error through status update
    onStatusUpdate?.('Transaction failed');
    TransactionService.showError(error);
    throw error;
  }
}

/**
 * Get swap quote from base to quote
 */
export async function getSwapQuoteFromBase(
  pool: string,
  baseAmount: number,
  slippage: number
): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote-swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        inputAmount: baseAmount,
        direction: Direction.BaseToQuote,
        slippage,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get swap quote');
    }

    return data.data;
  } catch (error) {
    console.error('Error in getSwapQuoteFromBase:', error);
    throw error;
  }
}

/**
 * Get swap quote from quote to base
 */
export async function getSwapQuoteFromQuote(
  pool: string,
  quoteAmount: number,
  slippage: number
): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote-swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        inputAmount: quoteAmount,
        direction: Direction.QuoteToBase,
        slippage,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get swap quote');
    }

    return data.data;
  } catch (error) {
    console.error('Error in getSwapQuoteFromQuote:', error);
    throw error;
  }
}

/**
 * Perform a token swap
 */
export async function swapTokens({
  pool,
  amount,
  direction,
  slippage,
  userPublicKey,
  connection,
  solanaWallet,
  onStatusUpdate,
}: SwapParams & {
  connection: Connection;
  solanaWallet: StandardWallet | any;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  try {
    onStatusUpdate?.('Preparing swap transaction...');
    
    const response = await fetch(`${API_BASE_URL}/build-swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        inputAmount: amount,
        direction,
        slippage,
        userPublicKey,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to perform swap');
    }

    onStatusUpdate?.('Transaction received, sending to wallet...');
    
    // Create a filtered status callback that prevents error messages
    const filteredCallback = (status: string) => {
      if (!status.startsWith('Error:') && !status.includes('failed:')) {
        onStatusUpdate?.(status);
      } else {
        onStatusUpdate?.('Processing transaction...');
      }
    };

    const signature = await TransactionService.signAndSendTransaction(
      { type: 'base64', data: data.data.transaction },
      solanaWallet,
      { 
        connection,
        statusCallback: filteredCallback
      }
    );
    
    onStatusUpdate?.('Swap completed successfully!');
    return signature;
  } catch (error) {
    console.error('Error in swapTokens:', error);
    // Don't send raw error through status update
    onStatusUpdate?.('Transaction failed');
    TransactionService.showError(error);
    throw error;
  }
}

/**
 * Get withdrawal quote
 */
export async function getWithdrawalQuote(
  pool: string,
  lpTokenAmount: number,
  slippage: number
): Promise<{ base: number; quote: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        lpTokenAmount,
        slippage,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get withdrawal quote');
    }

    return data.data;
  } catch (error) {
    console.error('Error in getWithdrawalQuote:', error);
    throw error;
  }
}

/**
 * Remove liquidity from a pool
 */
export async function removeLiquidity({
  pool,
  lpTokenAmount,
  slippage,
  userPublicKey,
  connection,
  solanaWallet,
  onStatusUpdate,
}: RemoveLiquidityParams & {
  connection: Connection;
  solanaWallet: StandardWallet | any;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  try {
    onStatusUpdate?.('Preparing liquidity removal...');
    
    const response = await fetch(`${API_BASE_URL}/build-remove-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        lpTokenAmount,
        slippage,
        userPublicKey,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to remove liquidity');
    }

    onStatusUpdate?.('Transaction received, sending to wallet...');
    
    // Create a filtered status callback that prevents error messages
    const filteredCallback = (status: string) => {
      if (!status.startsWith('Error:') && !status.includes('failed:')) {
        onStatusUpdate?.(status);
      } else {
        onStatusUpdate?.('Processing transaction...');
      }
    };

    const signature = await TransactionService.signAndSendTransaction(
      { type: 'base64', data: data.data.transaction },
      solanaWallet,
      { 
        connection,
        statusCallback: filteredCallback
      }
    );
    
    onStatusUpdate?.('Liquidity removed successfully!');
    return signature;
  } catch (error) {
    console.error('Error in removeLiquidity:', error);
    // Don't send raw error through status update
    onStatusUpdate?.('Transaction failed');
    TransactionService.showError(error);
    throw error;
  }
} 