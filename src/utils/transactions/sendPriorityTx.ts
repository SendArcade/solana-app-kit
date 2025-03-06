// FILE: src/utils/transactions/sendPriorityTx.ts

import {
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  PublicKey,
  Connection,
} from '@solana/web3.js';

export async function sendPriorityTransaction(
  provider: any,
  feeTier: 'low' | 'medium' | 'high' | 'very-high',
  instructions: TransactionInstruction[],
  connection: Connection,
  walletPublicKey: PublicKey,
  feeMapping: Record<string, number>,
): Promise<string> {
  const microLamports = feeMapping[feeTier];
  if (!microLamports) {
    throw new Error(`Fee mapping not found for tier: ${feeTier}`);
  }

  const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2_000_000,
  });
  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  });

  const allInstructions = [
    computeUnitLimitIx,
    computeUnitPriceIx,
    ...instructions,
  ];

  const {blockhash} = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: walletPublicKey,
    recentBlockhash: blockhash,
    instructions: allInstructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  // Now let the provider do sign+send
  const {signature} = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction,
      connection,
    },
  });

  if (!signature) {
    throw new Error('No signature returned from signAndSendTransaction');
  }

  return signature;
}
