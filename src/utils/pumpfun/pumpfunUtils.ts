// File: src/utils/pumpfun/pumpfunUtils.ts

import {
  PublicKey,
  Connection,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import {AnchorProvider} from '@coral-xyz/anchor';
import {PumpFunSDK} from 'pumpdotfun-sdk';
import {Buffer} from 'buffer';
import { HELIUS_RPC_URL } from '@env';

// ------------------------------------
// 1) Core Provider
// ------------------------------------
export function getProvider(): AnchorProvider {
  const connection = new Connection(
    // Use your chain’s endpoint:
    HELIUS_RPC_URL,
    'confirmed',
  );
  // Just a dummy signer for AnchorProvider:
  const dummyWallet = {
    publicKey: new PublicKey('11111111111111111111111111111111'),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  return new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
  });
}

// ------------------------------------
// 2) Signing Utilities
// ------------------------------------
/**
 * Sign a legacy Transaction using Privy's signMessage
 */
export async function signLegacyTransactionWithPrivy(
  transaction: Transaction,
  signerPubkey: PublicKey,
  privyProvider: any,
): Promise<Transaction> {
  console.log('[signLegacyTransactionWithPrivy] Start signing (legacy).');

  const serializedMessage = transaction.serializeMessage();
  const base64Msg = Buffer.from(serializedMessage).toString('base64');

  const signResult = await privyProvider.request({
    method: 'signMessage',
    params: {message: base64Msg},
  });
  if (!signResult?.signature) {
    throw new Error(
      '[signLegacyTransactionWithPrivy] Invalid signature from provider.',
    );
  }
  const signatureBuffer = Buffer.from(signResult.signature, 'base64');

  transaction.addSignature(signerPubkey, signatureBuffer);

  if (!transaction.verifySignatures()) {
    throw new Error(
      '[signLegacyTransactionWithPrivy] Signature verification failed.',
    );
  }
  console.log('[signLegacyTransactionWithPrivy] Verified OK.');
  return transaction;
}

/**
 * Sign a VersionedTransaction using Privy's signMessage
 */
export async function signVersionedTransactionWithPrivy(
  versionedTx: VersionedTransaction,
  signerPubkey: PublicKey,
  privyProvider: any,
): Promise<VersionedTransaction> {
  console.log('[signVersionedTransactionWithPrivy] Start signing (versioned).');

  const serializedMsg = versionedTx.message.serialize();
  const base64Msg = Buffer.from(serializedMsg).toString('base64');

  const signResult = await privyProvider.request({
    method: 'signMessage',
    params: {message: base64Msg},
  });
  if (!signResult?.signature) {
    throw new Error(
      '[signVersionedTransactionWithPrivy] Invalid signature from provider.',
    );
  }
  const signatureBuffer = Buffer.from(signResult.signature, 'base64');
  versionedTx.addSignature(signerPubkey, signatureBuffer);

  // Quick re-check
  const reserialized = versionedTx.serialize();
  const reCheck = VersionedTransaction.deserialize(reserialized);
  if (!reCheck) {
    throw new Error(
      '[signVersionedTransactionWithPrivy] Re-deserialization failed.',
    );
  }

  console.log(
    '[signVersionedTransactionWithPrivy] Versioned transaction signed OK.',
  );
  return versionedTx;
}

// ------------------------------------
// 3) Raydium & Bonding Helpers
// ------------------------------------
const RAYDIUM_SWAP_API_BASE = 'https://transaction-v1.raydium.io';
const RAYDIUM_API_V3 = 'https://api-v3.raydium.io';
export const RAYDIUM_SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Check if a token mint is recognized by Raydium
 */
export async function checkIfTokenIsOnRaydium(
  mintAddress: string,
): Promise<boolean> {
  console.log('[Raydium] Checking for mint:', mintAddress);

  const url = `${RAYDIUM_API_V3}/mint/ids?mints=${mintAddress}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn('[Raydium] Non-200 response checking token:', response.status);
    return false;
  }
  const data = await response.json();
  return !!(data?.success && Array.isArray(data.data) && data.data[0] !== null);
}

/**
 * Attempt to fetch Raydium's "auto-fee" for compute unit price
 */
export async function getSwapFee(): Promise<string> {
  console.log('[Raydium] getSwapFee() called.');
  const url = `${RAYDIUM_API_V3}/main/auto-fee`;

  const response = await fetch(url);
  if (!response.ok) {
    console.warn('[Raydium] getSwapFee() failed:', response.statusText);
    return '5000';
  }
  const data = await response.json();
  if (data?.success && data?.data?.default?.h) {
    return String(data.data.default.h);
  }
  return '5000';
}

/**
 * Generic fetch for Raydium swap quote
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amountInLamports: number,
  slippageBps = 200,
  txVersion = 'V0',
): Promise<any> {
  const url = `${RAYDIUM_SWAP_API_BASE}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=${slippageBps}&txVersion=${txVersion}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `[Raydium] getSwapQuote() failed: ${await response.text()}`,
    );
  }
  return response.json();
}

/**
 * Build final Raydium swap transaction from a quote
 */
export async function getSwapTransaction(params: {
  swapResponse: any;
  computeUnitPriceMicroLamports: string;
  userPubkey: string;
  unwrapSol: boolean;
  wrapSol: boolean;
  txVersion?: string;
  inputAccount?: string;
}): Promise<any> {
  const {
    swapResponse,
    computeUnitPriceMicroLamports,
    userPubkey,
    unwrapSol,
    wrapSol,
    txVersion = 'V0',
    inputAccount,
  } = params;

  const body: any = {
    computeUnitPriceMicroLamports,
    swapResponse,
    txVersion,
    wallet: userPubkey,
    unwrapSol,
    wrapSol,
  };
  if (inputAccount) body.inputAccount = inputAccount;

  const url = `${RAYDIUM_SWAP_API_BASE}/transaction/swap-base-in`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `[Raydium] getSwapTransaction() failed: ${await response.text()}`,
    );
  }
  return response.json();
}

/**
 * Parse a versioned transaction from base64
 */
export function parseRaydiumVersionedTransaction(
  base64Tx: string,
): VersionedTransaction {
  const rawTx = Buffer.from(base64Tx, 'base64');
  return VersionedTransaction.deserialize(rawTx);
}

// ------------------------------------
// 4) Pumpfun Bonding Helpers
// ------------------------------------
export interface PumpFunBuyParams {
  payerPubkey: PublicKey;
  tokenMint: PublicKey;
  lamportsToBuy: bigint;
  slippageBasis?: bigint;
  sdk: PumpFunSDK;
  connection: Connection;
}

/**
 * Build a transaction for a PumpFun "BUY" using their bonding curve
 */
export async function buildPumpFunBuyTransaction({
  payerPubkey,
  tokenMint,
  lamportsToBuy,
  slippageBasis = 2000n,
  sdk,
  connection,
}: PumpFunBuyParams): Promise<Transaction> {
  console.log(
    '[PumpFunBonding] buildPumpFunBuyTransaction() =>',
    lamportsToBuy.toString(),
  );

  const transaction = await sdk.getBuyInstructionsBySolAmount(
    payerPubkey,
    tokenMint,
    lamportsToBuy,
    slippageBasis,
  );
  const {blockhash} = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payerPubkey;
  return transaction;
}

export interface PumpFunSellParams {
  sellerPubkey: PublicKey;
  tokenMint: PublicKey;
  lamportsToSell: bigint;
  slippageBasis?: bigint;
  sdk: PumpFunSDK;
  connection: Connection;
}

/**
 * Build a transaction for a PumpFun "SELL" using their bonding curve
 */
export async function buildPumpFunSellTransaction({
  sellerPubkey,
  tokenMint,
  lamportsToSell,
  slippageBasis = 2000n,
  sdk,
  connection,
}: PumpFunSellParams): Promise<Transaction> {
  console.log(
    '[PumpFunBonding] buildPumpFunSellTransaction() =>',
    lamportsToSell.toString(),
  );

  const transaction = await sdk.getSellInstructionsByTokenAmount(
    sellerPubkey,
    tokenMint,
    lamportsToSell,
    slippageBasis,
  );
  const {blockhash} = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = sellerPubkey;
  return transaction;
}
