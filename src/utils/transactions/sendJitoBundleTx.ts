// File: src/utils/sendJitoBundleTx.ts
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  SystemProgram,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { sendJitoBundle, getSolscanLinks } from './jitoBundling';

// Define tipping accounts.
const TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKc5wPdSSdeBnizKZ6jT',
];

// Helper function to pick a random tip account.
function getRandomTipAccount(): PublicKey {
  const randomIndex = Math.floor(Math.random() * TIP_ACCOUNTS.length);
  return new PublicKey(TIP_ACCOUNTS[randomIndex]);
}

export async function sendJitoBundleTransaction(
  provider: any,
  feeTier: 'low' | 'medium' | 'high' | 'very-high',
  instructions: TransactionInstruction[],
  walletPublicKey: PublicKey,
  connection: Connection,
  feeMapping: Record<string, number>,
): Promise<string> {
  console.log('[sendJitoBundleTransaction] Starting transaction preparation.');

  // Set compute unit limit instruction.
  const computeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 2_000_000,
  });

  const microLamports = feeMapping[feeTier];
  console.log(
    `[sendJitoBundleTransaction] Fee tier: ${feeTier}, MicroLamports: ${microLamports}`,
  );

  const tipAccount = getRandomTipAccount();
  const tipInstruction = SystemProgram.transfer({
    fromPubkey: walletPublicKey,
    toPubkey: tipAccount,
    lamports: 1000,
  });

  const allInstructions = [
    tipInstruction,
    computeUnitLimitIx,
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ...instructions,
  ];
  console.log('[sendJitoBundleTransaction] Combined all instructions.');

  // Get latest blockhash and compile the transaction message.
  const { blockhash } = await connection.getLatestBlockhash();
  console.log(
    `[sendJitoBundleTransaction] Fetched latest blockhash: ${blockhash}`,
  );

  const messageV0 = new TransactionMessage({
    payerKey: walletPublicKey,
    recentBlockhash: blockhash,
    instructions: allInstructions,
  }).compileToV0Message();
  console.log('[sendJitoBundleTransaction] Compiled TransactionMessage to V0.');

  // Create a VersionedTransaction and serialize the message.
  const transaction = new VersionedTransaction(messageV0);
  console.log('[sendJitoBundleTransaction] Created VersionedTransaction.');

  const serializedMessage = transaction.message.serialize();
  const base64Message = Buffer.from(serializedMessage).toString('base64');
  console.log(
    '[sendJitoBundleTransaction] Serialized transaction message to base64.',
  );

  // Request provider to sign the message.
  const signResult = await provider.request({
    method: 'signMessage',
    params: {
      message: base64Message,
    },
  });
  console.log('[sendJitoBundleTransaction] Received signResult from provider.');

  if (!signResult || typeof signResult.signature !== 'string') {
    console.error(
      '[sendJitoBundleTransaction] Invalid signResult format:',
      signResult,
    );
    throw new Error('Provider did not return a valid signature.');
  }

  // Add the signature to the transaction.
  const signatureBuffer = Buffer.from(signResult.signature, 'base64');
  transaction.addSignature(walletPublicKey, signatureBuffer);
  console.log('[sendJitoBundleTransaction] Added signature to transaction.');

  // Validate the signature by attempting to deserialize the transaction.
  try {
    VersionedTransaction.deserialize(transaction.serialize());
    console.log('[sendJitoBundleTransaction] Transaction signature is valid.');
  } catch (error) {
    console.error('[sendJitoBundleTransaction] Invalid signature:', error);
    throw new Error('Invalid signature from provider.');
  }

  // Send the bundled transaction to Jito's block engine.
  const bundleResponse = await sendJitoBundle([transaction]);
  if (bundleResponse?.result) {
    console.log(
      '[sendJitoBundleTransaction] Bundle sent successfully:',
      bundleResponse.result,
    );

    // Retrieve the individual transaction signatures from the bundle status.
    const solscanLinks = await getSolscanLinks(bundleResponse.result);

    if (solscanLinks.length > 0) {
      console.log(
        `[sendJitoBundleTransaction] Transaction sent. Check on Solscan Mainnet: ${solscanLinks.join(
          ', ',
        )}`,
      );
      return solscanLinks[0];
    } else {
      console.warn(
        '[sendJitoBundleTransaction] Bundle status not found yet; returning bundle id.',
      );
      return bundleResponse.result;
    }
  } else {
    console.error(
      '[sendJitoBundleTransaction] Jito bundling failed:',
      bundleResponse,
    );
    throw new Error('Jito bundling failed');
  }
}
