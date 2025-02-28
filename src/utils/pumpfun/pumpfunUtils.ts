import {
  PublicKey,
  Connection,
} from '@solana/web3.js';
import {AnchorProvider} from '@coral-xyz/anchor';

import {Buffer} from 'buffer';

export function getProvider(): AnchorProvider {
  const connection = new Connection(
    // Use your chain’s endpoint:
    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
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

/** Encode a 64-bit integer into a little-endian Buffer. */
export function encodeU64(value: number): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value), 0);
  return buffer;
}

/** Convert a UTF-8 string to a Buffer with 2-byte length prefix (the Pump.fun format). */
export function bufferFromString(str: string): Buffer {
  const utf8 = Buffer.from(str, 'utf8');
  const lenBuffer = Buffer.alloc(2);
  lenBuffer.writeUInt16LE(utf8.length, 0);
  return Buffer.concat([lenBuffer, utf8]);
}

export async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
}
