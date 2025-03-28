// File: src/utils/transactions/sendPriorityTx.ts
import {Platform} from 'react-native';
import {
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  Connection,
} from '@solana/web3.js';
import type {TransactionInstruction} from '@solana/web3.js';
import { CLUSTER } from '@env';
import { TransactionService } from '../../services/transaction/transactionService';

export async function sendPriorityTransaction(
  provider: any,
  feeTier: 'low' | 'medium' | 'high' | 'very-high',
  instructions: TransactionInstruction[],
  connection: Connection,
  walletPublicKey: PublicKey,
  feeMapping: Record<string, number>,
): Promise<string> {
  console.log('[sendPriorityTransaction] Starting embedded priority tx...');
  const microLamports = feeMapping[feeTier];
  if (!microLamports) {
    throw new Error(`Fee mapping not found for tier: ${feeTier}`);
  }

  console.log(
    '[sendPriorityTransaction] Fee tier:',
    feeTier,
    '-> microLamports=',
    microLamports
  );

  const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2_000_000,
  });
  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  });

  const allInstructions = [computeUnitLimitIx, computeUnitPriceIx, ...instructions];
  const { blockhash } = await connection.getLatestBlockhash();
  console.log('[sendPriorityTransaction] latestBlockhash:', blockhash);

  const messageV0 = new TransactionMessage({
    payerKey: walletPublicKey,
    recentBlockhash: blockhash,
    instructions: allInstructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  console.log('[sendPriorityTransaction] Compiled transaction (embedded)', transaction);

  try {
    console.log('[sendPriorityTransaction] About to signAndSendTransaction via provider...');
    const { signature } = await provider.request({
      method: 'signAndSendTransaction',
      params: {
        transaction,
        connection,
      },
    });

    console.log('[sendPriorityTransaction] signAndSendTransaction returned:', signature);
    if (!signature) {
      throw new Error('No signature returned from signAndSendTransaction');
    }

    // confirm on-chain
    console.log('[sendPriorityTransaction] Confirming transaction...');
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    console.log('[sendPriorityTransaction] Confirmation result:', confirmation.value);
    
    // Check for confirmation error
    if (confirmation.value && confirmation.value.err) {
      // Create a proper error object with logs if available
      const error = new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      // Add logs if they exist on the err object
      if (confirmation.value.err.logs) {
        error.logs = confirmation.value.err.logs;
      }
      TransactionService.showError(error);
      throw error;
    }

    // Show success notification
    TransactionService.showSuccess(signature);
    return signature;
  } catch (error) {
    console.error('[sendPriorityTransaction] Error during transaction:', error);
    TransactionService.showError(error);
    throw error;
  }
}

/**
 * MWA-based usage: now removing 'no-persist' scope.
 */
export async function sendPriorityTransactionMWA(
  connection: Connection,
  recipient: string,
  lamports: number,
  feeMapping: Record<string, number>,
): Promise<string> {
  console.log(
    '[sendPriorityTransactionMWA] Starting MWA priority tx, recipient=',
    recipient,
    'lamports=',
    lamports
  );

  if (Platform.OS !== 'android') {
    throw new Error('MWA is only supported on Android');
  }

  const mwaModule = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  const {transact} = mwaModule;
  const feeTier: 'low' = 'low';
  const microLamports = feeMapping[feeTier] || 0;

  console.log('[sendPriorityTransactionMWA] microLamports from feeMapping:', microLamports);

  return await transact(async (wallet: any) => {
    try {
      console.log('[sendPriorityTransactionMWA] Inside transact callback...');
      
      // Use the correct cluster format with 'solana:' prefix
      const authResult = await wallet.authorize({
        cluster: CLUSTER, // Changed from 'solana:devnet' to 'devnet'
        identity: {
          name: 'React Native dApp',
          uri: 'https://yourdapp.com',
          icon: 'favicon.ico',
        },
      });
      console.log('[sendPriorityTransactionMWA] Authorization result:', authResult);

      const {Buffer} = require('buffer');
      const userEncodedPubkey = authResult.accounts[0].address;
      const userPubkeyBytes = Buffer.from(userEncodedPubkey, 'base64');
      const userPubkey = new PublicKey(userPubkeyBytes);
      console.log('[sendPriorityTransactionMWA] userPubkey:', userPubkey.toBase58());

      // 2) Build instructions
      console.log('[sendPriorityTransactionMWA] Building instructions...');
      const toPublicKey = new PublicKey(recipient);
      const transferIx = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: toPublicKey,
        lamports,
      });

      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 2_000_000,
      });
      const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports,
      });

      const instructions: TransactionInstruction[] = [
        computeUnitLimitIx,
        computeUnitPriceIx,
        transferIx,
      ];
      console.log('[sendPriorityTransactionMWA] Instructions created:', instructions.length);

      // 3) Build transaction
      console.log('[sendPriorityTransactionMWA] Fetching latest blockhash...');
      const { blockhash } = await connection.getLatestBlockhash();
      console.log('[sendPriorityTransactionMWA] blockhash:', blockhash);

      const messageV0 = new TransactionMessage({
        payerKey: userPubkey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      console.log('[sendPriorityTransactionMWA] Compiled transaction (MWA)', transaction);

      // Try using signTransactions first, then manually submit
      console.log('[sendPriorityTransactionMWA] Calling wallet.signTransactions()...');
      const signedTransactions = await wallet.signTransactions({
        transactions: [transaction],
      });
      console.log('[sendPriorityTransactionMWA] signTransactions returned signed transactions');

      if (!signedTransactions?.length) {
        throw new Error('No signed transactions returned from signTransactions');
      }
      
      // Now submit the signed transaction
      const signedTx = signedTransactions[0];
      console.log('[sendPriorityTransactionMWA] Submitting signed transaction to network...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('[sendPriorityTransactionMWA] Got signature:', signature);

      // 5) confirm
      console.log('[sendPriorityTransactionMWA] Confirming transaction on-chain...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      console.log('[sendPriorityTransactionMWA] Confirmation result:', confirmation.value);
      
      // Check for error
      if (confirmation.value && confirmation.value.err) {
        // Create a proper error with logs
        const error = new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        // Add logs if they exist
        if (confirmation.value.err.logs) {
          error.logs = confirmation.value.err.logs;
        }
        TransactionService.showError(error);
        throw error;
      }

      console.log('[sendPriorityTransactionMWA] Transaction confirmed successfully!');
      TransactionService.showSuccess(signature, 'transfer');
      return signature;
    } catch (error) {
      console.log('[sendPriorityTransactionMWA] Caught error inside transact callback:', error);
      TransactionService.showError(error);
      throw error;
    }
  });
}
