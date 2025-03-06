// FILE: src/utils/transactions/transactionUtils.ts

import {
  Connection,
  Transaction,
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js';
import {Buffer} from 'buffer';

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
