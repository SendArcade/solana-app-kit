// FILE: src/utils/pumpfun/pumpfunUtils.ts

import {
  PublicKey,
  Connection,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import {AnchorProvider} from '@coral-xyz/anchor';
import {PumpFunSDK} from 'pumpdotfun-sdk';
import {Buffer} from 'buffer';
import {HELIUS_RPC_URL} from '@env';

/**
 * Setup: a standard AnchorProvider.
 */
export function getProvider(): AnchorProvider {
  const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
  // Dummy wallet (no signing needed here).
  const dummyWallet = {
    publicKey: new PublicKey('11111111111111111111111111111111'),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  return new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
  });
}

/* ------------------------------------------------------------------
   RAYDIUM UTILS
--------------------------------------------------------------------- */
const RAYDIUM_SWAP_API_BASE = 'https://transaction-v1.raydium.io';
const RAYDIUM_API_V3 = 'https://api-v3.raydium.io';

export const RAYDIUM_SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Check if a token is recognized by Raydium.
 */
export async function checkIfTokenIsOnRaydium(
  mintAddress: string,
): Promise<boolean> {
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
 * Attempt to fetch Raydium's "auto-fee" for compute units.
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
  const url =
    `${RAYDIUM_SWAP_API_BASE}/compute/swap-base-in` +
    `?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}` +
    `&slippageBps=${slippageBps}&txVersion=${txVersion}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Raydium] getSwapQuote() failed: ${errorText}`);
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
    const errorText = await response.text();
    throw new Error(`[Raydium] getSwapTransaction() failed: ${errorText}`);
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

/* ------------------------------------------------------------------
   PUMPFUN BONDING UTILS
--------------------------------------------------------------------- */
export interface PumpFunBuyParams {
  payerPubkey: PublicKey;
  tokenMint: PublicKey;
  lamportsToBuy: bigint;
  slippageBasis?: bigint;
  sdk: PumpFunSDK;
  connection: Connection;
}

/**
 * Build a PumpFun "BUY" transaction using their bonding curve
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
 * Build a PumpFun "SELL" transaction using their bonding curve
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
