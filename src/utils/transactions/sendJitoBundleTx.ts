// File: src/utils/transactions/sendJitoBundleTx.ts
import {Platform} from 'react-native';
import {
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  Connection,
  SystemProgram,
} from '@solana/web3.js';
import type {TransactionInstruction} from '@solana/web3.js';
import { CLUSTER } from '@env';

export async function sendJitoBundleTransaction(
  provider: any,
  feeTier: 'low' | 'medium' | 'high' | 'very-high',
  instructions: TransactionInstruction[],
  walletPublicKey: PublicKey,
  connection: Connection,
  feeMapping: Record<string, number>,
): Promise<string> {
  console.log('[sendJitoBundleTransaction] Starting embedded Jito tx...');
  const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 2_000_000 });
  const allInstructions = [computeUnitLimitIx, ...instructions];

  const { blockhash } = await connection.getLatestBlockhash();
  console.log('[sendJitoBundleTransaction] blockhash:', blockhash);

  const messageV0 = new TransactionMessage({
    payerKey: walletPublicKey,
    recentBlockhash: blockhash,
    instructions: allInstructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  console.log('[sendJitoBundleTransaction] Compiled transaction (embedded)', transaction);

  try {
    console.log('[sendJitoBundleTransaction] signAndSendTransaction...');
    const {signature} = await provider.request({
      method: 'signAndSendTransaction',
      params: {
        transaction,
        connection,
      },
    });
    console.log('[sendJitoBundleTransaction] signAndSendTransaction returned signature:', signature);
    if (!signature) {
      throw new Error('No signature from signAndSendTransaction');
    }

    // confirm
    console.log('[sendJitoBundleTransaction] Confirming transaction...');
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    console.log('[sendJitoBundleTransaction] Confirmation result:', confirmation.value);
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    return signature;
  } catch (error) {
    console.error('[sendJitoBundleTransaction] Error during transaction:', error);
    throw error;
  }
}

export async function sendJitoBundleTransactionMWA(
  connection: Connection,
  recipient: string,
  lamports: number,
  feeMapping: Record<string, number>,
) {
  console.log('[sendJitoBundleTransactionMWA] Starting MWA Jito tx, recipient=', recipient, 'lamports=', lamports);
  if (Platform.OS !== 'android') {
    throw new Error('MWA is only supported on Android for Jito as well.');
  }

  const mwaModule = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  const {transact} = mwaModule;

  return await transact(async (mobileWallet: any) => {
    try {
      console.log('[sendJitoBundleTransactionMWA] Inside transact callback, authorizing...');
      const authResult = await mobileWallet.authorize({
        cluster: CLUSTER,
        identity: {
          name: 'React Native dApp',
          uri: 'https://yourdapp.com',
          icon: 'favicon.ico',
        },
      });
      console.log('[sendJitoBundleTransactionMWA] Auth result:', authResult);

      const {Buffer} = require('buffer');
      const userEncodedPubkey = authResult.accounts[0].address;
      const userPubkeyBytes = Buffer.from(userEncodedPubkey, 'base64');
      const userPubkey = new PublicKey(userPubkeyBytes);
      console.log('[sendJitoBundleTransactionMWA] userPubkey:', userPubkey.toBase58());

      // build instructions
      const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 2_000_000,
      });
      const transferIx = SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: new PublicKey(recipient),
        lamports,
      });
      const instructions = [computeUnitLimitIx, transferIx];
      console.log('[sendJitoBundleTransactionMWA] instructions count:', instructions.length);

      console.log('[sendJitoBundleTransactionMWA] fetching latest blockhash...');
      const { blockhash } = await connection.getLatestBlockhash();
      console.log('[sendJitoBundleTransactionMWA] blockhash:', blockhash);

      const txMessage = new TransactionMessage({
        payerKey: userPubkey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(txMessage);
      console.log('[sendJitoBundleTransactionMWA] compiled transaction:', transaction);

      // Use signTransactions instead of signAndSendTransactions
      console.log('[sendJitoBundleTransactionMWA] signTransactions...');
      const signedTxs = await mobileWallet.signTransactions({
        transactions: [transaction],
      });
      console.log('[sendJitoBundleTransactionMWA] signTransactions returned signed transactions');

      if (!signedTxs || !signedTxs.length) {
        throw new Error('No signed transactions returned from signTransactions');
      }
      
      // Now submit the signed transaction
      const signedTx = signedTxs[0];
      console.log('[sendJitoBundleTransactionMWA] Submitting signed transaction to network...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      console.log('[sendJitoBundleTransactionMWA] signature:', signature);

      // confirm
      console.log('[sendJitoBundleTransactionMWA] confirming on-chain...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      console.log('[sendJitoBundleTransactionMWA] confirmation result:', confirmation.value);
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('[sendJitoBundleTransactionMWA] Transaction confirmed successfully!');
      return signature;
    } catch (error) {
      console.log('[sendJitoBundleTransactionMWA] Caught error inside transact callback:', error);
      throw error;
    }
  });
}
