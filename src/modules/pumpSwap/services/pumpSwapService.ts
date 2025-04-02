/**
 * PumpSwap Service
 * 
 * Service layer for interacting with the Pump Swap AMM API
 */

import { PublicKey, Connection } from '@solana/web3.js';
import { 
  SwapParams as OriginalSwapParams, 
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

// Modify SwapParams to accept both local Direction and SDK Direction
export interface SwapParams extends Omit<OriginalSwapParams, 'direction'> {
  direction: Direction | number;
}

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
    onStatusUpdate?.('Starting pool creation process...');
    onStatusUpdate?.('Validating token addresses and amounts...');
    
    // Basic validation for display purposes
    if (!baseMint || !quoteMint) {
      throw new Error('Invalid token mint addresses');
    }
    
    if (baseAmount <= 0 || quoteAmount <= 0) {
      throw new Error('Token amounts must be greater than zero');
    }
    
    if (baseMint === quoteMint) {
      throw new Error('Base and quote tokens cannot be the same');
    }
    
    // Identify if any of the tokens are SOL, which requires special handling
    const isBaseSol = baseMint === 'So11111111111111111111111111111111111111112';
    const isQuoteSol = quoteMint === 'So11111111111111111111111111111111111111112';
    
    console.log(`Creating pool: baseMint=${baseMint} (${isBaseSol ? 'SOL' : 'SPL'}), quoteMint=${quoteMint} (${isQuoteSol ? 'SOL' : 'SPL'})`);
    console.log(`Amounts: base=${baseAmount}, quote=${quoteAmount}`);
    
    onStatusUpdate?.(`Creating pool with ${isBaseSol ? 'SOL' : 'SPL'} and ${isQuoteSol ? 'SOL' : 'SPL'}...`);
    
    onStatusUpdate?.('Requesting transaction from server...');
    
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/build-create-pool`, {
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
      const serverError = data.error || 'Failed to create pool';
      console.error('Server error:', serverError);
      
      // If server provided detailed error, show it
      if (data.details) {
        console.error('Error details:', data.details);
      }
      
      throw new Error(serverError);
    }
    
    if (!data.data || !data.data.transaction) {
      throw new Error('Server returned invalid transaction data');
    }

    onStatusUpdate?.('Transaction received. Sending to wallet for approval...');
    
    // Create a filtered status callback that prevents error messages
    const filteredCallback = (status: string) => {
      if (!status.startsWith('Error:') && !status.includes('failed:')) {
        onStatusUpdate?.(status);
      } else {
        onStatusUpdate?.('Processing transaction...');
      }
    };

    onStatusUpdate?.('Waiting for transaction approval and confirmation...');
    
    try {
      onStatusUpdate?.('Sending transaction to network...');
      console.log('Sending transaction to network...');
      
      const signature = await TransactionService.signAndSendTransaction(
        { type: 'base64', data: data.data.transaction },
        solanaWallet,
        { 
          connection,
          statusCallback: filteredCallback
        }
      );
      
      onStatusUpdate?.(`Pool created successfully! Tx: ${signature.slice(0, 8)}...${signature.slice(-8)}`);
      return signature;
    } catch (txError) {
      console.error('Transaction Error:', txError);
      
      // Log detailed error for debugging
      console.log('==== Transaction Error Details ====');
      const txErrorMsg = txError instanceof Error ? txError.message : String(txError);
      console.log('Error message:', txErrorMsg);
      
      // Check for specific error patterns to provide better feedback
      const isInsufficientFunds = 
        txErrorMsg.includes('insufficient lamports') || 
        txErrorMsg.includes('0x1') || // Custom program error code for insufficient funds
        txErrorMsg.includes('Attempt to debit an account but found no record of a prior credit');
      
      // Get transaction logs for debugging if available
      if (txError && typeof txError === 'object' && 'logs' in txError) {
        console.log('Transaction logs:', (txError as any).logs);
        
        // Check logs for insufficient funds message
        const logs = (txError as any).logs || [];
        const insufficientLamportsLog = logs.find((log: string) => log.includes('insufficient lamports'));
        if (insufficientLamportsLog) {
          // Extract the required amount from the log message if available
          const matches = insufficientLamportsLog.match(/insufficient lamports (\d+), need (\d+)/);
          if (matches && matches.length === 3) {
            const have = parseInt(matches[1], 10) / 1_000_000_000; // Convert lamports to SOL
            const need = parseInt(matches[2], 10) / 1_000_000_000; // Convert lamports to SOL
            
            const friendlyError = new Error(
              `Insufficient SOL balance for creating pool. You have ${have.toFixed(6)} SOL, but need at least ${need.toFixed(6)} SOL. ` +
              `Please add more SOL to your wallet and try again.`
            );
            onStatusUpdate?.(`Transaction failed: ${friendlyError.message}`);
            throw friendlyError;
          }
        }
      }
      
      // Provide a friendly error message for insufficient funds
      if (isInsufficientFunds) {
        const friendlyError = new Error(
          'Insufficient SOL balance for creating pool. Creating a pool requires approximately 0.03-0.05 SOL to cover the rent for all necessary accounts. ' +
          'Please add more SOL to your wallet and try again.'
        );
        onStatusUpdate?.(`Transaction failed: ${friendlyError.message}`);
        throw friendlyError;
      }
      
      throw txError;
    }
  } catch (error) {
    console.error('Error in createPool:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't send raw error through status update
    onStatusUpdate?.(`Transaction failed: ${errorMessage}`);
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
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/quote-liquidity`, {
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
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/quote-liquidity`, {
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
  lpTokenAmount,
  slippage,
  userPublicKey,
  connection,
  solanaWallet,
  onStatusUpdate,
}: {
  pool: string;
  baseAmount: number | null;
  quoteAmount: number | null;
  lpTokenAmount: number;
  slippage: number;
  userPublicKey: string;
  connection: Connection;
  solanaWallet: StandardWallet | any;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  try {
    onStatusUpdate?.('Preparing liquidity addition...');
    
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/build-add-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool,
        baseAmount,
        quoteAmount,
        lpTokenAmount,
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
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/quote-swap`, {
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
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/quote-swap`, {
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
    
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/build-swap`, {
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
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/quote-liquidity`, {
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
    
    const response = await fetch(`${API_BASE_URL}/api/pump-swap/build-remove-liquidity`, {
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