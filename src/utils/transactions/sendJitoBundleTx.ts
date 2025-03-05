// FILE: src/utils/transactions/sendJitoBundleTx.ts

import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  ComputeBudgetProgram,
  SystemProgram,
} from '@solana/web3.js';
import {Buffer} from 'buffer';
import {sendJitoBundle, getSolscanLinks} from './jitoBundling';
import { PUBLIC_KEYS } from '../../config/constants';

/** pick random tip account */
function getRandomTipAccount(): PublicKey {
  const randomIndex = Math.floor(
    Math.random() * PUBLIC_KEYS.jitoTipAccounts.length,
  );
  return new PublicKey(PUBLIC_KEYS.jitoTipAccounts[randomIndex]);
}

/**
 * For Jito bundling, we cannot do a typical "signAndSendTransaction" because
 * we must push multiple transactions to the block engine. Instead we do the partial
 * signature flow with `signTransaction`, then we call `sendJitoBundle`.
 */
export async function sendJitoBundleTransaction(
  provider: any,
  feeTier: 'low' | 'medium' | 'high' | 'very-high',
  instructions: TransactionInstruction[],
  walletPublicKey: PublicKey,
  connection: Connection,
  feeMapping: Record<string, number>,
): Promise<string> {
  console.log('[sendJitoBundleTransaction] preparing transaction for Jito');

  const microLamports = feeMapping[feeTier];
  if (!microLamports) {
    throw new Error(`Fee tier not found: ${feeTier}`);
  }

  // create instructions for tip & compute
  const tipAccount = getRandomTipAccount();
  const tipIx = SystemProgram.transfer({
    fromPubkey: walletPublicKey,
    toPubkey: tipAccount,
    lamports: 1000, // example tip
  });
  const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2_000_000,
  });
  const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  });

  const finalInstructions = [
    tipIx,
    computeLimitIx,
    computePriceIx,
    ...instructions,
  ];
  const {blockhash} = await connection.getLatestBlockhash();

  // Build a single VersionedTransaction
  const messageV0 = new TransactionMessage({
    payerKey: walletPublicKey,
    recentBlockhash: blockhash,
    instructions: finalInstructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  // 1) We do partial sign using provider method: signTransaction
  // because we do NOT want to broadcast to normal Solana, but Jito block engine.
  const signedTxObj = await provider.request({
    method: 'signTransaction',
    params: {
      transaction: tx,
      connection,
    },
  });
  if (!signedTxObj || !signedTxObj.transaction) {
    throw new Error('[Jito] No transaction returned from signTransaction');
  }

  let signedTx: VersionedTransaction;
  // parse the transaction object returned
  try {
    const base64Tx = signedTxObj.transaction;
    const buffer = Buffer.from(base64Tx, 'base64');
    signedTx = VersionedTransaction.deserialize(buffer);
  } catch (err) {
    throw new Error('[Jito] signTransaction result parse failed: ' + err);
  }

  // 2) Now we have a fully-signed transaction for jito bundling
  // We'll send the single transaction as a bundle
  const bundleResponse = await sendJitoBundle([signedTx]);
  if (bundleResponse?.result) {
    console.log(
      '[sendJitoBundleTransaction] bundle sent, ID:',
      bundleResponse.result,
    );
    const solscanLinks = await getSolscanLinks(bundleResponse.result);
    if (solscanLinks.length > 0) {
      console.log(
        '[sendJitoBundleTransaction] found transaction sig(s):',
        solscanLinks,
      );
      return solscanLinks[0];
    }
    // no transaction signatures yet
    return bundleResponse.result;
  }
  throw new Error(
    '[sendJitoBundleTransaction] Jito bundling failed or no result',
  );
}
