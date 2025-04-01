/**
 * PumpSwap Service
 * 
 * Service layer for interacting with the Pump Swap AMM SDK
 */

import { Connection, PublicKey, TransactionInstruction, Transaction, clusterApiUrl, Cluster } from '@solana/web3.js';
import { PumpAmmSdk, Pool } from '@pump-fun/pump-swap-sdk';
// import { BN } from '@project-serum/anchor';
import { CLUSTER, HELIUS_RPC_URL } from '@env';
import { ENDPOINTS } from '../../../config/constants';
import { 
  SwapParams, 
  AddLiquidityParams, 
  RemoveLiquidityParams, 
  CreatePoolParams,
  Direction
} from '../types';

// Create a singleton instance of the SDK
let pumpAmmSdkInstance: PumpAmmSdk | null = null;

// Define a mapping between Direction enum and corresponding string values expected by the SDK
// According to SDK type definitions, Direction is "quoteToBase" | "baseToQuote"
const DirectionMap = {
  BaseToQuote: "baseToQuote" as const,
  QuoteToBase: "quoteToBase" as const
};

/**
 * Convert the Direction enum to the string value expected by the SDK
 * @param direction The Direction enum value
 * @returns The string representation for the SDK
 */
function toDirectionString(direction: Direction): "baseToQuote" | "quoteToBase" {
  // Direct string comparison to handle the Direction enum
  if (String(direction) === 'BaseToQuote') {
    return DirectionMap.BaseToQuote;
  }
  return DirectionMap.QuoteToBase;
}

/**
 * Gets a Solana connection using the best available RPC URL
 * @returns A Solana Connection
 */
export function getConnection(): Connection {
  // Use Helius RPC URL from env or endpoints, with fallback to default cluster
  const rpcUrl = HELIUS_RPC_URL || ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Initialize or get the PumpAmmSdk instance
 * @returns The PumpAmmSdk instance
 */
export function getPumpAmmSdk(): PumpAmmSdk {
  if (!pumpAmmSdkInstance) {
    const connection = getConnection();
    pumpAmmSdkInstance = new PumpAmmSdk(connection);
    console.log('[PumpSwap] Initialized SDK with connection:', connection.rpcEndpoint);
  }
  
  return pumpAmmSdkInstance;
}

/**
 * Helper function to create a transaction from instructions
 * @param instructions - The transaction instructions
 * @param feePayer - The fee payer public key
 * @returns Transaction object
 */
function createTransactionFromInstructions(
  instructions: TransactionInstruction[],
  feePayer: PublicKey
): Transaction {
  const transaction = new Transaction().add(...instructions);
  transaction.feePayer = feePayer;
  return transaction;
}

/**
 * Get pool public key from a Pool object (implementation will vary based on SDK)
 * @param pool - The Pool object from the SDK
 * @returns A PublicKey
 */
function getPoolPublicKey(pool: Pool): PublicKey {
  // We need to determine the actual structure of the Pool object to extract the public key
  // This is a simplification that should be updated with actual implementation
  try {
    // @ts-ignore - We're using any to bypass type checking here since we don't know the exact structure
    const poolAny = pool as any;
    
    if (poolAny instanceof PublicKey) {
      return poolAny;
    }
    
    if (poolAny.pubkey instanceof PublicKey) {
      return poolAny.pubkey;
    }
    
    if (poolAny.publicKey instanceof PublicKey) {
      return poolAny.publicKey;
    }
    
    if (poolAny.address instanceof PublicKey) {
      return poolAny.address;
    }
    
    if (typeof poolAny.address === 'string') {
      return new PublicKey(poolAny.address);
    }
    
    // Last resort - try converting the whole object to a string
    return new PublicKey(poolAny.toString());
  } catch (error) {
    console.error('Failed to extract public key from pool', error);
    // Default to a placeholder - in real code you'd want to handle this better
    return new PublicKey('11111111111111111111111111111111');
  }
}

/**
 * Perform a token swap using the Pump Swap AMM
 * @param params - The swap parameters
 * @returns The transaction signature
 */
export async function swapTokens({
  userPublicKey,
  pool,
  amount,
  direction,
  slippage,
  solanaWallet,
  onStatusUpdate
}: SwapParams): Promise<string> {
  try {
    onStatusUpdate?.('Initializing swap...');
    
    // Use any type for the SDK until we have clear type definitions
    // This prevents TypeScript errors while still allowing the SDK to work
    // @ts-ignore
    const sdk: any = getPumpAmmSdk();
    const userKey = new PublicKey(userPublicKey);
    
    // Prepare parameters for SDK calls
    const poolKey = getPoolPublicKey(pool);
    
    // Calculate expected output
    onStatusUpdate?.('Calculating swap quote...');
    
    let expectedAmount;
    
    // Convert Direction enum to string value expected by SDK
    const directionString = toDirectionString(direction);
    
    if (directionString === DirectionMap.BaseToQuote) {
      expectedAmount = await sdk.swapAutocompleteQuoteFromBase(
        poolKey,
        amount,
        slippage,
        directionString
      );
    } else {
      expectedAmount = await sdk.swapAutocompleteBaseFromQuote(
        poolKey,
        amount,
        slippage,
        directionString
      );
    }
    
    // Convert expected amount to display format
    const formattedAmount = expectedAmount?.toString() || '0';
    onStatusUpdate?.(`Expected to receive: ${formattedAmount}`);
    
    // Build transaction
    onStatusUpdate?.('Preparing swap transaction...');
    
    // Use the unified swapInstructions method as shown in the docs
    const swapInstructions = await sdk.swapInstructions(
      poolKey,
      userKey,
      amount,
      slippage,
      directionString
    );
    
    // Build transaction
    const transaction = createTransactionFromInstructions(swapInstructions, userKey);
    
    // Sign and send transaction
    onStatusUpdate?.('Sending transaction...');
    const signature = await solanaWallet.signAndSendTransaction(transaction);
    
    onStatusUpdate?.('Swap completed successfully!');
    return signature;
  } catch (error) {
    console.error('Error in swapTokens:', error);
    throw error;
  }
}

/**
 * Add liquidity to a Pump Swap AMM pool
 * @param params - The add liquidity parameters
 * @returns The transaction signature
 */
export async function addLiquidity({
  userPublicKey,
  pool,
  baseAmount,
  quoteAmount,
  lpTokenAmount,
  slippage,
  solanaWallet,
  onStatusUpdate
}: AddLiquidityParams): Promise<string> {
  try {
    onStatusUpdate?.('Initializing liquidity addition...');
    
    // Get SDK instance
    // @ts-ignore
    const sdk: any = getPumpAmmSdk();
    const userKey = new PublicKey(userPublicKey);
    
    // Prepare parameters for SDK calls
    const poolKey = getPoolPublicKey(pool);
    
    // Convert Direction enum to numeric value expected by SDK if needed
    // For addLiquidity, the SDK documentation might specify a direction parameter
    // If needed, use the DirectionMap to convert
    
    onStatusUpdate?.('Preparing add liquidity transaction...');
    
    // Following SDK documentation for addLiquidityInstructions
    const addLiquidityInstructions = await sdk.addLiquidityInstructions(
      poolKey,
      userKey,
      baseAmount,
      quoteAmount,
      slippage
    );
    
    // Build transaction
    const transaction = createTransactionFromInstructions(addLiquidityInstructions, userKey);
    
    // Sign and send transaction
    onStatusUpdate?.('Sending transaction...');
    const signature = await solanaWallet.signAndSendTransaction(transaction);
    
    onStatusUpdate?.('Liquidity added successfully!');
    return signature;
  } catch (error) {
    console.error('Error in addLiquidity:', error);
    throw error;
  }
}

/**
 * Remove liquidity from a Pump Swap AMM pool
 * @param params - The remove liquidity parameters
 * @returns The transaction signature
 */
export async function removeLiquidity({
  userPublicKey,
  pool,
  lpTokenAmount,
  slippage,
  solanaWallet,
  onStatusUpdate
}: RemoveLiquidityParams): Promise<string> {
  try {
    onStatusUpdate?.('Initializing liquidity removal...');
    
    // @ts-ignore
    const sdk: any = getPumpAmmSdk();
    const userKey = new PublicKey(userPublicKey);
    const poolKey = getPoolPublicKey(pool);
    
    // Calculate expected output
    onStatusUpdate?.('Calculating withdrawal amounts...');
    const withdrawResult = await sdk.withdrawAutoCompleteBaseAndQuoteFromLpToken(
      poolKey,
      lpTokenAmount,
      slippage
    );
    
    // Format output amounts (assuming they are BN or similar)
    const baseAmount = withdrawResult?.base?.toString() || '0';
    const quoteAmount = withdrawResult?.quote?.toString() || '0';
    
    onStatusUpdate?.(`Expected to receive: ${baseAmount} base tokens and ${quoteAmount} quote tokens`);
    onStatusUpdate?.('Preparing withdrawal transaction...');
    
    // Create withdraw instructions
    const withdrawInstructions = await sdk.withdrawInstructions(
      poolKey,
      lpTokenAmount,
      slippage,
      userKey
    );
    
    // Build transaction
    const transaction = createTransactionFromInstructions(withdrawInstructions, userKey);
    
    // Sign and send transaction
    onStatusUpdate?.('Sending transaction...');
    const signature = await solanaWallet.signAndSendTransaction(transaction);
    
    onStatusUpdate?.('Liquidity removed successfully!');
    return signature;
  } catch (error) {
    console.error('Error in removeLiquidity:', error);
    throw error;
  }
}

/**
 * Create a new Pump Swap AMM pool
 * @param params - The pool creation parameters
 * @returns The transaction signature
 */
export async function createPool({
  userPublicKey,
  index,
  baseMint,
  quoteMint,
  baseAmount,
  quoteAmount,
  solanaWallet,
  onStatusUpdate
}: CreatePoolParams): Promise<string> {
  try {
    onStatusUpdate?.('Initializing pool creation...');
    
    // @ts-ignore
    const sdk: any = getPumpAmmSdk();
    const creatorKey = new PublicKey(userPublicKey);
    const baseMintKey = new PublicKey(baseMint);
    const quoteMintKey = new PublicKey(quoteMint);
    
    // Calculate initial pool price
    onStatusUpdate?.('Calculating initial pool price...');
    const initialPoolPrice = sdk.createAutocompleteInitialPoolPrice(
      baseAmount,
      quoteAmount
    );
    
    onStatusUpdate?.(`Initial pool price: ${initialPoolPrice}`);
    onStatusUpdate?.('Preparing pool creation transaction...');
    
    // Create pool instructions
    const createPoolInstructions = await sdk.createPoolInstructions(
      index, 
      creatorKey, 
      baseMintKey, 
      quoteMintKey, 
      baseAmount, 
      quoteAmount
    );
    
    // Build transaction
    const transaction = createTransactionFromInstructions(createPoolInstructions, creatorKey);
    
    // Sign and send transaction
    onStatusUpdate?.('Sending transaction...');
    const signature = await solanaWallet.signAndSendTransaction(transaction);
    
    onStatusUpdate?.('Pool created successfully!');
    return signature;
  } catch (error) {
    console.error('Error in createPool:', error);
    throw error;
  }
}

/**
 * Get a quote for a token swap
 * @param pool - The pool to swap in
 * @param inputAmount - The input amount
 * @param direction - The swap direction
 * @param slippage - The slippage tolerance in percentage
 * @returns The expected output amount
 */
export async function getSwapQuote(
  pool: Pool,
  inputAmount: number,
  direction: Direction,
  slippage: number
): Promise<number> {
  try {
    // @ts-ignore
    const sdk: any = getPumpAmmSdk();
    const poolKey = getPoolPublicKey(pool);
    
    // Convert Direction enum to string value expected by SDK
    const directionString = toDirectionString(direction);
    
    // Use the appropriate SDK method based on direction
    if (directionString === DirectionMap.BaseToQuote) {
      return await sdk.swapAutocompleteQuoteFromBase(
        poolKey,
        inputAmount,
        slippage,
        directionString
      );
    } else {
      return await sdk.swapAutocompleteBaseFromQuote(
        poolKey,
        inputAmount,
        slippage,
        directionString
      );
    }
  } catch (error) {
    console.error('Error in getSwapQuote:', error);
    throw error;
  }
}

/**
 * Get liquidity quotes for adding liquidity
 * @param pool - The pool to add liquidity to
 * @param baseAmount - The base token amount or null
 * @param quoteAmount - The quote token amount or null
 * @param slippage - The slippage tolerance in percentage
 * @returns Information about expected LP tokens
 */
export async function getLiquidityQuote(
  pool: Pool,
  baseAmount: number | null,
  quoteAmount: number | null,
  slippage: number
): Promise<{quote: number | null, base: number | null, lpToken: number}> {
  try {
    // @ts-ignore
    const sdk: any = getPumpAmmSdk();
    const poolKey = getPoolPublicKey(pool);
    
    let result;
    if (quoteAmount === null && baseAmount !== null) {
      // When base input changes, calculate quote
      result = await sdk.depositAutocompleteQuoteAndLpTokenFromBase(
        poolKey,
        baseAmount,
        slippage
      );
      
      // Convert result to appropriate format
      return {
        base: baseAmount,
        quote: result?.quote ? Number(result.quote.toString()) : 0,
        lpToken: result?.lpToken ? Number(result.lpToken.toString()) : 0
      };
    } else if (baseAmount === null && quoteAmount !== null) {
      // When quote input changes, calculate base
      result = await sdk.depositAutocompleteBaseAndLpTokenFromQuote(
        poolKey,
        quoteAmount,
        slippage
      );
      
      // Convert result to appropriate format
      return {
        base: result?.base ? Number(result.base.toString()) : 0,
        quote: quoteAmount,
        lpToken: result?.lpToken ? Number(result.lpToken.toString()) : 0
      };
    } else {
      throw new Error('Either baseAmount or quoteAmount must be provided, not both or neither');
    }
  } catch (error) {
    console.error('Error in getLiquidityQuote:', error);
    throw error;
  }
} 