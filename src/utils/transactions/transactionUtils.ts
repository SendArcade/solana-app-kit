// FILE: src/utils/transactions/transactionUtils.ts

import {
  Connection,
  Transaction,
  VersionedTransaction,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  TransactionMessage,
} from '@solana/web3.js';
import {Buffer} from 'buffer';
import { TransactionService } from '../../services/transaction/transactionService';
import { store } from '../../state/store';
import { StandardWallet } from '../../hooks/useAuth';

/**
 * Fee tier to microLamports mapping for priority transactions
 */
export const DEFAULT_FEE_MAPPING: Record<string, number> = {
  'low': 1_000,
  'medium': 10_000,
  'high': 100_000,
  'very-high': 1_000_000,
};

/**
 * Gets the current transaction mode from Redux state
 */
export const getCurrentTransactionMode = (): 'jito' | 'priority' => {
  return store.getState().transaction.transactionMode;
};

/**
 * Gets the current fee tier from Redux state
 */
export const getCurrentFeeTier = (): 'low' | 'medium' | 'high' | 'very-high' => {
  return store.getState().transaction.selectedFeeTier;
};

/**
 * Gets the microLamports value for the current fee tier
 */
export const getCurrentFeeMicroLamports = (feeMapping = DEFAULT_FEE_MAPPING): number => {
  const feeTier = getCurrentFeeTier();
  return feeMapping[feeTier] || feeMapping.medium;
};

/**
 * Creates priority fee instructions based on the current fee tier
 */
export const createPriorityFeeInstructions = (
  feeMapping = DEFAULT_FEE_MAPPING
): TransactionInstruction[] => {
  const feeTier = getCurrentFeeTier();
  const microLamports = feeMapping[feeTier] || feeMapping.medium;
  
  // Set compute unit limit (same for all transactions)
  const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2_000_000,
  });
  
  // Set compute unit price based on selected fee tier
  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  });
  
  return [computeUnitLimitIx, computeUnitPriceIx];
};

/**
 * Sends a transaction with the current priority fee settings
 */
export async function sendTransactionWithPriorityFee({
  wallet,
  instructions,
  connection,
  shouldUsePriorityFee = true,
  onStatusUpdate,
}: {
  wallet: StandardWallet | any;
  instructions: TransactionInstruction[];
  connection: Connection;
  shouldUsePriorityFee?: boolean;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  // Get transaction mode from Redux
  const transactionMode = getCurrentTransactionMode();
  
  // 1. Create all instructions
  let allInstructions: TransactionInstruction[] = [];
  
  // Add priority fee instructions only if we're in priority mode
  // and shouldUsePriorityFee is true
  if (transactionMode === 'priority' && shouldUsePriorityFee) {
    const priorityInstructions = createPriorityFeeInstructions();
    allInstructions = [...priorityInstructions, ...instructions];
    onStatusUpdate?.(`Using ${getCurrentFeeTier()} priority fee`);
  } 
  // For Jito mode, just add compute unit limit (no priority fee)
  else if (transactionMode === 'jito') {
    const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 2_000_000,
    });
    allInstructions = [computeUnitLimitIx, ...instructions];
    onStatusUpdate?.('Using Jito bundling');
  } 
  // No transaction mode specified, just use the instructions as is
  else {
    allInstructions = [...instructions];
  }
  
  // 2. Get wallet public key
  let walletPublicKey: PublicKey;
  
  if (wallet.publicKey) {
    walletPublicKey = new PublicKey(wallet.publicKey);
  } else if (wallet.address) {
    walletPublicKey = new PublicKey(wallet.address);
  } else {
    throw new Error('No wallet public key or address found');
  }
  
  // 3. Sign and send the transaction using TransactionService
  onStatusUpdate?.('Preparing transaction...');
  
  return await TransactionService.signAndSendTransaction(
    { 
      type: 'instructions',
      instructions: allInstructions,
      feePayer: walletPublicKey,
    },
    wallet,
    { 
      connection,
      statusCallback: onStatusUpdate,
    }
  );
}

/**
 * Sends SOL to a recipient with the current priority fee settings
 */
export async function sendSOL({
  wallet,
  recipientAddress,
  amountSol,
  connection,
  onStatusUpdate,
}: {
  wallet: StandardWallet | any;
  recipientAddress: string;
  amountSol: number;
  connection: Connection;
  onStatusUpdate?: (status: string) => void;
}): Promise<string> {
  try {
    if (!wallet) {
      throw new Error('No wallet provided');
    }
    
    if (!recipientAddress) {
      throw new Error('No recipient address provided');
    }
    
    // Validate amount
    const parsedAmount = parseFloat(amountSol.toString());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid SOL amount');
    }
    
    // Convert to lamports
    const lamports = Math.floor(parsedAmount * LAMPORTS_PER_SOL);
    
    // Get wallet public key
    let walletPublicKey: PublicKey;
    
    if (wallet.publicKey) {
      walletPublicKey = new PublicKey(wallet.publicKey);
    } else if (wallet.address) {
      walletPublicKey = new PublicKey(wallet.address);
    } else {
      throw new Error('No wallet public key or address found');
    }
    
    // Create transfer instruction
    const transferIx = SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey: new PublicKey(recipientAddress),
      lamports,
    });
    
    // Send the transaction with priority fee
    onStatusUpdate?.(`Sending ${amountSol} SOL to ${recipientAddress}`);
    return await sendTransactionWithPriorityFee({
      wallet,
      instructions: [transferIx],
      connection,
      shouldUsePriorityFee: true,
      onStatusUpdate,
    });
  } catch (error: any) {
    console.error('[sendSOL] Error:', error);
    throw error;
  }
}

/**
 * Signs and sends an in-memory transaction (legacy or versioned) via the
 * Privy provider's `signAndSendTransaction` method. Returns the tx signature.
 */
export async function signAndSendWithPrivy(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  provider: any,
): Promise<string> {
  // The provider expects the raw transaction object, not base64.
  // This will produce an object that can be directly pass to signAndSendTransaction.
  const {signature} = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction,
      connection,
    },
  });

  if (!signature) {
    throw new Error('No signature returned from provider');
  }
  return signature;
}

/**
 * Takes a base64-encoded transaction (could be legacy or versioned),
 * deserializes it, and then uses Privy provider to sign+send.
 */
export async function signAndSendBase64Tx(
  base64Tx: string,
  connection: Connection,
  provider: any,
): Promise<string> {
  const txBuffer = Buffer.from(base64Tx, 'base64');
  let transaction: Transaction | VersionedTransaction;

  // Try to parse as VersionedTransaction; fallback to legacy Transaction.
  try {
    transaction = VersionedTransaction.deserialize(txBuffer);
  } catch {
    transaction = Transaction.from(txBuffer);
  }

  const {signature} = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction,
      connection,
    },
  });

  if (!signature) {
    throw new Error('No signature returned while signing base64 tx');
  }
  return signature;
}
