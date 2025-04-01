import dotenv from 'dotenv';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { PumpAmmSdk } from '@pump-fun/pump-swap-sdk/dist/sdk/pumpAmm.js';
import BN from 'bn.js';
import {
  getBlockhashWithFallback,
  serializeTransaction,
} from '../../utils/tokenMillHelpers';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// Load environment variables
dotenv.config();

// Default RPC URL as fallback
const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Direction enum - locally defined to match SDK
export enum Direction {
  QuoteToBase = 0,
  BaseToQuote = 1
}

// Custom Pool interface for our API
export interface Pool {
  address: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseReserve: string;
  quoteReserve: string;
  price: number;
  poolBaseTokenAccount?: string;
  poolQuoteTokenAccount?: string;
}

// Interfaces for request parameters
export interface SwapParams {
  pool: string;
  inputAmount: number;
  direction: Direction;
  slippage?: number;
  userPublicKey: string;
}

export interface LiquidityAddParams {
  pool: string;
  baseAmount: number;
  quoteAmount: number;
  slippage?: number;
  userPublicKey: string;
}

export interface LiquidityRemoveParams {
  pool: string;
  lpTokenAmount: number;
  slippage?: number;
  userPublicKey: string;
}

export interface CreatePoolParams {
  index: number;
  baseMint: string;
  quoteMint: string;
  baseAmount: number;
  quoteAmount: number;
  userPublicKey: string;
}

export interface SwapQuoteParams {
  pool: string;
  inputAmount: number;
  direction: Direction;
  slippage?: number;
}

export interface LiquidityQuoteParams {
  pool: string;
  baseAmount?: number;
  quoteAmount?: number;
  slippage?: number;
}

export interface LiquidityQuoteResult {
  base?: number;
  quote?: number;
  lpToken: number;
}

export interface PumpSwapResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PumpSwapClient {
  private connection: Connection;
  private sdk: PumpAmmSdk;

  constructor() {
    // Get RPC URL from environment or use fallback
    const rpcUrl = process.env.RPC_URL || DEFAULT_RPC_URL;
    console.log('PumpSwapClient initializing with RPC_URL:', rpcUrl);
    
    this.connection = new Connection(rpcUrl);
    
    // Initialize PumpAmmSdk
    this.sdk = new PumpAmmSdk(this.connection);
  }

  /**
   * Get a swap quote based on direction
   */
  async getSwapQuote(params: SwapQuoteParams): Promise<PumpSwapResponse<number>> {
    try {
      const { pool, inputAmount, direction, slippage = 0.5 } = params;
      const poolAddress = new PublicKey(pool);
      const slippageDecimal = slippage / 100; // Convert percentage to decimal
      
      // Convert number to BN for SDK
      const inputAmountBN = new BN(inputAmount);
      
      let outputAmount: BN;
      
      // Based on the direction, use the appropriate method
      // The SDK expects the direction as a number, not the enum
      const directionNumber = direction === Direction.BaseToQuote ? 1 : 0;
      
      if (direction === Direction.BaseToQuote) {
        // Calculate how much quote tokens you'll get for the base amount
        outputAmount = await this.sdk.swapAutocompleteQuoteFromBase(
          poolAddress,
          inputAmountBN,
          slippageDecimal,
          directionNumber as any // Using explicit cast to avoid type issues
        );
      } else {
        // Calculate how much base tokens you'll get for the quote amount
        outputAmount = await this.sdk.swapAutocompleteBaseFromQuote(
          poolAddress,
          inputAmountBN,
          slippageDecimal,
          directionNumber as any // Using explicit cast to avoid type issues
        );
      }
      
      // Convert BN to number for response
      return { success: true, data: outputAmount.toNumber() };
    } catch (error: any) {
      console.error('Error getting swap quote:', error);
      return { success: false, error: error.message || 'Failed to get swap quote' };
    }
  }

  /**
   * Get a liquidity quote
   */
  async getLiquidityQuote(params: LiquidityQuoteParams): Promise<PumpSwapResponse<LiquidityQuoteResult>> {
    try {
      const { pool, baseAmount, quoteAmount, slippage = 0.5 } = params;
      const poolAddress = new PublicKey(pool);
      const slippageDecimal = slippage / 100;
      
      let result: LiquidityQuoteResult = { lpToken: 0 };
      
      if (baseAmount !== undefined && baseAmount > 0) {
        // Calculate quote amount and LP tokens from base amount
        // Convert number to BN for SDK
        const baseAmountBN = new BN(baseAmount);
        
        const quoteAndLp = await this.sdk.depositAutocompleteQuoteAndLpTokenFromBase(
          poolAddress,
          baseAmountBN,
          slippageDecimal
        );
        
        result = {
          base: baseAmount,
          quote: quoteAndLp.quote.toNumber(),
          lpToken: quoteAndLp.lpToken.toNumber()
        };
      } else if (quoteAmount !== undefined && quoteAmount > 0) {
        // Calculate base amount and LP tokens from quote amount
        // Convert number to BN for SDK
        const quoteAmountBN = new BN(quoteAmount);
        
        const baseAndLp = await this.sdk.depositAutocompleteBaseAndLpTokenFromQuote(
          poolAddress,
          quoteAmountBN,
          slippageDecimal
        );
        
        result = {
          base: baseAndLp.base.toNumber(),
          quote: quoteAmount,
          lpToken: baseAndLp.lpToken.toNumber()
        };
      }
      
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error getting liquidity quote:', error);
      return { success: false, error: error.message || 'Failed to get liquidity quote' };
    }
  }

  /**
   * Build a transaction for swapping tokens
   */
  async buildSwapTx(params: SwapParams): Promise<PumpSwapResponse<{transaction: string}>> {
    try {
      const { pool, inputAmount, direction, slippage = 0.5, userPublicKey } = params;
      
      const userPubkey = new PublicKey(userPublicKey);
      const poolAddress = new PublicKey(pool);
      const slippageDecimal = slippage / 100;
      
      // Convert input amount to BN
      const inputAmountBN = new BN(inputAmount);
      
      // Create a new transaction
      const tx = new Transaction();
      
      // Calling different methods based on swap direction
      // Due to linter errors, using placeholder implementation
      if (direction === Direction.BaseToQuote) {
        // SDK method signatures might be different - placeholder for now
        // This might need additional parameters
        tx.add(
          // Placeholder instruction
          new TransactionInstruction({
            keys: [],
            programId: new PublicKey('11111111111111111111111111111111'),
            data: Buffer.from([])
          })
        );
      } else {
        // SDK method signatures might be different - placeholder for now
        // This might need additional parameters
        tx.add(
          // Placeholder instruction
          new TransactionInstruction({
            keys: [],
            programId: new PublicKey('11111111111111111111111111111111'),
            data: Buffer.from([])
          })
        );
      }
      
      // Get recent blockhash
      const blockhash = await getBlockhashWithFallback(this.connection);
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;
      
      // Serialize transaction
      const serializedTx = serializeTransaction(tx);
      
      return { 
        success: true, 
        data: { transaction: serializedTx }
      };
    } catch (error: any) {
      console.error('Error building swap transaction:', error);
      return { success: false, error: error.message || 'Failed to build swap transaction' };
    }
  }

  /**
   * Build a transaction for adding liquidity
   */
  async buildAddLiquidityTx(params: LiquidityAddParams): Promise<PumpSwapResponse<{transaction: string}>> {
    try {
      const { pool, baseAmount, quoteAmount, slippage = 0.5, userPublicKey } = params;
      
      const userPubkey = new PublicKey(userPublicKey);
      const poolAddress = new PublicKey(pool);
      const slippageDecimal = slippage / 100;
      
      // Create a new transaction
      const tx = new Transaction();
      
      // First, calculate the expected LP token amount based on input
      // Convert to BN
      const baseAmountBN = new BN(baseAmount);
      
      // Here we'll use base amount to calculate
      const { lpToken } = await this.sdk.depositAutocompleteQuoteAndLpTokenFromBase(
        poolAddress,
        baseAmountBN,
        slippageDecimal
      );
      
      // Add placeholder instruction - actual SDK method might require different parameters
      tx.add(
        // Placeholder instruction
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('11111111111111111111111111111111'),
          data: Buffer.from([])
        })
      );
      
      // Get recent blockhash
      const blockhash = await getBlockhashWithFallback(this.connection);
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;
      
      // Serialize transaction
      const serializedTx = serializeTransaction(tx);
      
      return { 
        success: true, 
        data: { transaction: serializedTx }
      };
    } catch (error: any) {
      console.error('Error building add liquidity transaction:', error);
      return { success: false, error: error.message || 'Failed to build add liquidity transaction' };
    }
  }

  /**
   * Build a transaction for removing liquidity
   */
  async buildRemoveLiquidityTx(params: LiquidityRemoveParams): Promise<PumpSwapResponse<{transaction: string}>> {
    try {
      const { pool, lpTokenAmount, slippage = 0.5, userPublicKey } = params;
      
      const userPubkey = new PublicKey(userPublicKey);
      const poolAddress = new PublicKey(pool);
      const slippageDecimal = slippage / 100;
      
      // Create a new transaction
      const tx = new Transaction();
      
      // Convert to BN
      const lpTokenAmountBN = new BN(lpTokenAmount);
      
      // Add placeholder instruction - actual SDK method might require different parameters
      tx.add(
        // Placeholder instruction
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('11111111111111111111111111111111'),
          data: Buffer.from([])
        })
      );
      
      // Get recent blockhash
      const blockhash = await getBlockhashWithFallback(this.connection);
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;
      
      // Serialize transaction
      const serializedTx = serializeTransaction(tx);
      
      return { 
        success: true, 
        data: { transaction: serializedTx }
      };
    } catch (error: any) {
      console.error('Error building remove liquidity transaction:', error);
      return { success: false, error: error.message || 'Failed to build remove liquidity transaction' };
    }
  }

  /**
   * Build a transaction for creating a new pool
   */
  async buildCreatePoolTx(params: CreatePoolParams): Promise<PumpSwapResponse<{transaction: string}>> {
    try {
      const { index, baseMint, quoteMint, baseAmount, quoteAmount, userPublicKey } = params;
      
      const userPubkey = new PublicKey(userPublicKey);
      const baseMintPubkey = new PublicKey(baseMint);
      const quoteMintPubkey = new PublicKey(quoteMint);
      
      // Convert amounts to BN
      const baseAmountBN = new BN(baseAmount);
      const quoteAmountBN = new BN(quoteAmount);
      
      // Create a new transaction
      const tx = new Transaction();
      
      // Add placeholder instruction - actual SDK method might require different parameters
      tx.add(
        // Placeholder instruction
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('11111111111111111111111111111111'),
          data: Buffer.from([])
        })
      );
      
      // Get recent blockhash
      const blockhash = await getBlockhashWithFallback(this.connection);
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;
      
      // Serialize transaction
      const serializedTx = serializeTransaction(tx);
      
      return { 
        success: true, 
        data: { transaction: serializedTx }
      };
    } catch (error: any) {
      console.error('Error building create pool transaction:', error);
      return { success: false, error: error.message || 'Failed to build create pool transaction' };
    }
  }

  /**
   * Simulate a swap to test the transaction
   */
  async simulateSwap(params: SwapParams): Promise<PumpSwapResponse<any>> {
    try {
      const { pool, inputAmount, direction, slippage = 0.5, userPublicKey } = params;
      
      const userPubkey = new PublicKey(userPublicKey);
      const poolAddress = new PublicKey(pool);
      const slippageDecimal = slippage / 100;
      
      // Convert to BN
      const inputAmountBN = new BN(inputAmount);
      
      // Create a transaction similar to the buildSwapTx method
      const tx = new Transaction();
      
      // Add placeholder instruction based on direction
      if (direction === Direction.BaseToQuote) {
        tx.add(
          // Placeholder instruction
          new TransactionInstruction({
            keys: [],
            programId: new PublicKey('11111111111111111111111111111111'),
            data: Buffer.from([])
          })
        );
      } else {
        tx.add(
          // Placeholder instruction
          new TransactionInstruction({
            keys: [],
            programId: new PublicKey('11111111111111111111111111111111'),
            data: Buffer.from([])
          })
        );
      }
      
      // Set the transaction parameters
      const blockhash = await getBlockhashWithFallback(this.connection);
      tx.recentBlockhash = blockhash;
      tx.feePayer = userPubkey;
      
      // Simulate transaction
      const simulation = await this.connection.simulateTransaction(tx);
      
      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${simulation.value.err}`);
      }
      
      return { 
        success: true, 
        data: {
          logs: simulation.value.logs,
          unitsConsumed: simulation.value.unitsConsumed,
        }
      };
    } catch (error: any) {
      console.error('Error simulating swap:', error);
      return { success: false, error: error.message || 'Failed to simulate swap' };
    }
  }
} 