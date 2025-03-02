// File: src/utils/jitoBundling.ts
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

export interface JitoBundleResponse {
  jsonrpc: string;
  result: string;
  id: number;
}

// Use the mainnet bundling endpoint.
const JITO_MAINNET_URL =
  'https://mainnet.block-engine.jito.wtf:443/api/v1/bundles';

/**
 * Sends a bundle of signed transactions to Jito's block engine.
 */
export async function sendJitoBundle(
  transactions: VersionedTransaction[],
): Promise<JitoBundleResponse> {
  console.log('[sendJitoBundle] Preparing to send bundle.');

  // Convert transactions to base64 strings.
  const base64Txns = transactions.map((tx, index) => {
    const serializedTx = tx.serialize();
    const base64Tx = Buffer.from(serializedTx).toString('base64');
    console.log(
      `[sendJitoBundle] Serialized transaction ${index + 1}: ${base64Tx}`,
    );
    return base64Tx;
  });

  // Prepare the bundle request.
  const bundleRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'sendBundle',
    params: [base64Txns, { encoding: 'base64' }],
  };

  console.log(
    '[sendJitoBundle] Bundle request:',
    JSON.stringify(bundleRequest, null, 2),
  );

  // Send the bundle to Jito's block engine.
  const response = await fetch(JITO_MAINNET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bundleRequest),
  });

  const responseBody = await response.json();
  console.log(
    '[sendJitoBundle] Response body:',
    JSON.stringify(responseBody, null, 2),
  );

  return responseBody;
}

/**
 * Retrieves Solscan links for each transaction in the bundle.
 * @param bundleId - The bundle ID returned by sendJitoBundle.
 * @returns An array of Solscan transaction links.
 */
export async function getSolscanLinks(bundleId: string): Promise<string[]> {
  const url = 'https://mainnet.block-engine.jito.wtf:443/api/v1/getBundleStatuses';
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getBundleStatuses',
    params: [[bundleId]],
  };

  // We'll try a few times, because there's often a delay before
  // the block engine returns transaction signatures.
  let attempts = 0;
  const maxAttempts = 10;
  const delayMs = 2000; // 2 seconds between polls

  while (attempts < maxAttempts) {
    attempts += 1;
    console.log(`[getSolscanLinks] Attempt ${attempts} of ${maxAttempts}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log(
      '[getSolscanLinks] Bundle status response:',
      JSON.stringify(result, null, 2),
    );

    if (
      result &&
      result.result &&
      result.result.value &&
      result.result.value.length > 0
    ) {
      const bundleResult = result.result.value[0];
      // Once we have "transactions", return the links immediately.
      if (bundleResult.transactions && bundleResult.transactions.length > 0) {
        return bundleResult.transactions.map(
          (txSignature: string) => `https://solscan.io/tx/${txSignature}`,
        );
      }
    }

    // If we didn't get any signatures yet, wait and try again
    console.log('[getSolscanLinks] No transaction signatures yet. Retrying...');
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // If still no signatures, give up and return empty.
  console.warn(
    '[getSolscanLinks] Could not find transaction signatures after polling.',
  );
  return [];
}
