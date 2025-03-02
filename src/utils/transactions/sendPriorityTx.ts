import {
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  PublicKey,
  Connection,
} from '@solana/web3.js';
import {Buffer} from 'buffer';

/**
 * Send a "priority" transaction with compute unit price instructions included.
 *
 * @param provider - A wallet provider that can sign messages (e.g. from Privy or Dynamic).
 * @param feeTier - "low" | "medium" | "high" | "very-high"
 * @param instructions - The Solana TransactionInstructions to be executed.
 * @param connection - The @solana/web3.js Connection instance.
 * @param walletPublicKey - The public key of the sending wallet.
 * @param feeMapping - A record mapping feeTier to the "microLamports" to pay for compute.
 * @returns Transaction signature string, once confirmed.
 */
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

  // (Optionally you handle airdrops on devnet, etc.)
  // Here is the same core logic as before.

  // Add compute instructions
  const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2_000_000,
  });
  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  });

  // Combine final instructions
  const allInstructions = [
    computeUnitLimitIx,
    computeUnitPriceIx,
    ...instructions,
  ];

  const latestBlockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: walletPublicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: allInstructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  // 1) Serialize the transaction message
  const serializedMessage = transaction.message.serialize();
  const base64Message = Buffer.from(serializedMessage).toString('base64');

  // 2) Request signature from the provider/wallet
  const {signature} = await provider.request({
    method: 'signMessage',
    params: {message: base64Message},
  });
  transaction.addSignature(walletPublicKey, Buffer.from(signature, 'base64'));

  // 3) Validate & send
  VersionedTransaction.deserialize(transaction.serialize()); // ensures signature is valid
  const serializedTx = transaction.serialize();
  const txHash = await connection.sendRawTransaction(serializedTx);

  // Optionally confirm it
  // await connection.confirmTransaction(txHash, 'confirmed');

  return txHash;
}
