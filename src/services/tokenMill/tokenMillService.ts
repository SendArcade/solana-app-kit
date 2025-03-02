// File: src/services/tokenMillService.ts

import {Connection, PublicKey, Transaction} from '@solana/web3.js';
import {Buffer} from 'buffer';
import {SERVER_URL} from '@env';
import {createSyncNativeInstruction} from '@solana/spl-token';
import * as spl from '@solana/spl-token';
import {SystemProgram, LAMPORTS_PER_SOL} from '@solana/web3.js';

// This service centralizes requests to your backend plus the signature flow.

////////////////////////////////////////////////////////////////
// signAndSendLegacyTx
////////////////////////////////////////////////////////////////
export async function signAndSendLegacyTx({
  base64Tx,
  connection,
  signerPublicKey,
  provider,
}: {
  base64Tx: string;
  connection: Connection;
  signerPublicKey: string;
  provider: any; // e.g. Privy or Dynamic
}): Promise<string> {
  // Convert base64 to Transaction
  const txBuffer = Buffer.from(base64Tx, 'base64');
  const legacyTx = Transaction.from(txBuffer);

  // Convert the Tx message to base64 for signMessage
  const serializedMessage = legacyTx.serializeMessage();
  const base64Message = Buffer.from(serializedMessage).toString('base64');

  // Prompt user to sign the message
  const signResult = await provider.request({
    method: 'signMessage',
    params: {message: base64Message},
  });
  if (!signResult || !signResult.signature) {
    throw new Error('No signature from wallet provider');
  }

  // Attach signature
  legacyTx.addSignature(
    new PublicKey(signerPublicKey),
    Buffer.from(signResult.signature, 'base64'),
  );

  // Send
  const signedTx = legacyTx.serialize();
  const txSignature = await connection.sendRawTransaction(signedTx);

  // Optionally confirm
  await connection.confirmTransaction(txSignature);
  return txSignature;
}

////////////////////////////////////////////////////////////////
// fundUserWithWSOL
////////////////////////////////////////////////////////////////
export async function fundUserWithWSOL({
  solAmount,
  connection,
  signerPublicKey,
  provider,
}: {
  solAmount: number;
  connection: Connection;
  signerPublicKey: string;
  provider: any;
}): Promise<string> {
  const wSolMint = new PublicKey('So11111111111111111111111111111111111111112');
  const userPubkey = new PublicKey(signerPublicKey);
  const userQuoteAta = spl.getAssociatedTokenAddressSync(wSolMint, userPubkey);

  // Check if user ATA exists
  const ataInfo = await connection.getAccountInfo(userQuoteAta);
  const tx = new Transaction();

  if (!ataInfo) {
    const createIx = spl.createAssociatedTokenAccountInstruction(
      userPubkey,
      userQuoteAta,
      userPubkey,
      wSolMint,
    );
    tx.add(createIx);
  }

  // Transfer some SOL
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  const transferIx = SystemProgram.transfer({
    fromPubkey: userPubkey,
    toPubkey: userQuoteAta,
    lamports,
  });
  tx.add(transferIx);

  // Sync wSOL
  const syncIx = createSyncNativeInstruction(userQuoteAta);
  tx.add(syncIx);

  // Prepare partial sign
  const {blockhash} = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = userPubkey;

  // Serialize for sign
  const serializedTx = tx.serialize({requireAllSignatures: false});
  const base64Tx = serializedTx.toString('base64');

  return signAndSendLegacyTx({
    base64Tx,
    connection,
    signerPublicKey,
    provider,
  });
}

////////////////////////////////////////////////////////////////
// createMarket
////////////////////////////////////////////////////////////////
export async function createMarket({
  tokenName,
  tokenSymbol,
  metadataUri,
  totalSupply,
  creatorFee,
  stakingFee,
  userPublicKey,
  connection,
  provider,
}: {
  tokenName: string;
  tokenSymbol: string;
  metadataUri: string;
  totalSupply: number;
  creatorFee: number;
  stakingFee: number;
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<{
  txSignature: string;
  marketAddress: string;
  baseTokenMint: string;
}> {
  const body = {
    name: tokenName,
    symbol: tokenSymbol,
    uri: metadataUri,
    totalSupply,
    creatorFeeShare: creatorFee,
    stakingFeeShare: stakingFee,
    userPublicKey,
  };

  const resp = await fetch(`${SERVER_URL}/api/markets`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  const json = await resp.json();

  if (!json.success) {
    throw new Error(json.error || 'Market creation failed');
  }
  const txSignature = await signAndSendLegacyTx({
    base64Tx: json.transaction,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });

  return {
    txSignature,
    marketAddress: json.marketAddress,
    baseTokenMint: json.baseTokenMint,
  };
}

////////////////////////////////////////////////////////////////
// stakeTokens
////////////////////////////////////////////////////////////////
export async function stakeTokens({
  marketAddress,
  amount,
  userPublicKey,
  connection,
  provider,
}: {
  marketAddress: string;
  amount: number;
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<string> {
  const resp = await fetch(`${SERVER_URL}/api/stake`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      marketAddress,
      amount,
      userPublicKey,
    }),
  });
  const json = await resp.json();
  if (!json.success) {
    throw new Error(json.error || 'Stake failed');
  }
  return signAndSendLegacyTx({
    base64Tx: json.data,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });
}

////////////////////////////////////////////////////////////////
// createVesting
////////////////////////////////////////////////////////////////
export async function createVesting({
  marketAddress,
  baseTokenMint,
  vestingAmount,
  userPublicKey,
  connection,
  provider,
}: {
  marketAddress: string;
  baseTokenMint: string;
  vestingAmount: number;
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<{txSignature: string; ephemeralVestingPubkey: string}> {
  const resp = await fetch(`${SERVER_URL}/api/vesting`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      marketAddress,
      recipient: userPublicKey,
      amount: vestingAmount,
      startTime: Math.floor(Date.now() / 1000),
      duration: 3600,
      cliffDuration: 1800,
      baseTokenMint,
      userPublicKey,
    }),
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Vesting creation failed');
  }

  const txSignature = await signAndSendLegacyTx({
    base64Tx: data.data.transaction,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });

  return {
    txSignature,
    ephemeralVestingPubkey: data.data.ephemeralVestingPubkey,
  };
}

////////////////////////////////////////////////////////////////
// releaseVesting
////////////////////////////////////////////////////////////////
export async function releaseVesting({
  marketAddress,
  vestingPlanAddress,
  baseTokenMint,
  userPublicKey,
  connection,
  provider,
}: {
  marketAddress: string;
  vestingPlanAddress: string;
  baseTokenMint: string;
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<string> {
  const resp = await fetch(`${SERVER_URL}/api/vesting/release`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      marketAddress,
      vestingPlanAddress,
      baseTokenMint,
      userPublicKey,
    }),
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Release vesting failed');
  }
  return signAndSendLegacyTx({
    base64Tx: data.data,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });
}

////////////////////////////////////////////////////////////////
// swapTokens
////////////////////////////////////////////////////////////////
export async function swapTokens({
  marketAddress,
  swapType,
  swapAmount,
  userPublicKey,
  connection,
  provider,
}: {
  marketAddress: string;
  swapType: 'buy' | 'sell';
  swapAmount: number;
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<string> {
  const resp = await fetch(`${SERVER_URL}/api/swap`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      market: marketAddress,
      quoteTokenMint: 'So11111111111111111111111111111111111111112', // wSOL
      action: swapType,
      tradeType: swapType === 'buy' ? 'exactOutput' : 'exactInput',
      amount: Math.floor(swapAmount * 1_000_000),
      otherAmountThreshold: swapType === 'buy' ? 1_000_000_000 : 0,
      userPublicKey,
    }),
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Swap failed');
  }

  return signAndSendLegacyTx({
    base64Tx: data.transaction,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });
}

////////////////////////////////////////////////////////////////
// fundMarket
////////////////////////////////////////////////////////////////
export async function fundMarket({
  marketAddress,
  userPublicKey,
  connection,
  provider,
}: {
  marketAddress: string;
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<string> {
  const marketPubkey = new PublicKey(marketAddress);
  const quoteTokenMint = new PublicKey(
    'So11111111111111111111111111111111111111112',
  );
  const marketQuoteTokenAta = spl.getAssociatedTokenAddressSync(
    quoteTokenMint,
    marketPubkey,
    true,
  );

  const ataInfo = await connection.getAccountInfo(marketQuoteTokenAta);
  const tx = new Transaction();

  if (!ataInfo) {
    const createATAIx = spl.createAssociatedTokenAccountInstruction(
      new PublicKey(userPublicKey),
      marketQuoteTokenAta,
      marketPubkey,
      quoteTokenMint,
    );
    tx.add(createATAIx);
  }

  // Example deposit: 0.1 SOL
  const lamportsToDeposit = Math.floor(0.1 * LAMPORTS_PER_SOL);
  const transferIx = SystemProgram.transfer({
    fromPubkey: new PublicKey(userPublicKey),
    toPubkey: marketQuoteTokenAta,
    lamports: lamportsToDeposit,
  });
  tx.add(transferIx);

  const syncIx = createSyncNativeInstruction(marketQuoteTokenAta);
  tx.add(syncIx);

  const {blockhash} = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(userPublicKey);

  const serializedTx = tx.serialize({requireAllSignatures: false});
  const base64Tx = serializedTx.toString('base64');

  return signAndSendLegacyTx({
    base64Tx,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });
}

////////////////////////////////////////////////////////////////
// setBondingCurve
////////////////////////////////////////////////////////////////
export async function setBondingCurve({
  marketAddress,
  askPrices,
  bidPrices,
  userPublicKey,
  connection,
  provider,
}: {
  marketAddress: string;
  askPrices: number[];
  bidPrices: number[];
  userPublicKey: string;
  connection: Connection;
  provider: any;
}): Promise<string> {
  const body = {
    market: marketAddress,
    userPublicKey,
    askPrices,
    bidPrices,
  };

  const resp = await fetch(`${SERVER_URL}/api/set-curve`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  const json = await resp.json();
  if (!json.success) {
    throw new Error(json.error || 'Set curve failed');
  }

  return signAndSendLegacyTx({
    base64Tx: json.transaction,
    connection,
    signerPublicKey: userPublicKey,
    provider,
  });
}
