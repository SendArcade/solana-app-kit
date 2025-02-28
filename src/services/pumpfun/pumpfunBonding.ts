// File: src/services/pumpfun/pumpfunBonding.ts

import {PumpFunSDK} from 'pumpdotfun-sdk';
import {PublicKey, Transaction, Connection} from '@solana/web3.js';

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
    '[PumpFunBonding] buildPumpFunBuyTransaction() lamportsToBuy:',
    lamportsToBuy.toString(),
  );

  const transaction = await sdk.getBuyInstructionsBySolAmount(
    payerPubkey,
    tokenMint,
    lamportsToBuy,
    slippageBasis,
  );
  console.log('[PumpFunBonding] Transaction Instructions:');
  transaction.instructions.forEach((instruction, index) => {
    console.log(`[PumpFunBonding] Instruction ${index}:`, {
      programId: instruction.programId.toString(),
      keys: instruction.keys.map(k => ({
        pubkey: k.pubkey.toString(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      data: instruction.data.toString('hex'),
    });
  });
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
    '[PumpFunBonding] buildPumpFunSellTransaction() lamportsToSell:',
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
