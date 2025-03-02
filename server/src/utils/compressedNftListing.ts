import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { TCompSDK } from '@tensor-oss/tcomp-sdk';
import { Provider } from '@project-serum/anchor';
import BN from 'bn.js';
import bs58 from 'bs58';
import { Buffer } from 'buffer';  // <-- IMPORTANT

interface CompressedNftListingParams {
  seller: string;
  owner: string;
  price: number;          // lamports
  expiry?: number;
  merkleTree: string;     // base58 address
  proof: string[];        // array of base58 strings
  root: string;           // base58
  canopyDepth: number;
  leafIndex: number;
  dataHash: string;       // base58
  creatorsHash: string;   // base58 or "0000...000" dummy
}

/** Decode base58 or return 32 bytes of zero if we detect an all-zero string. */
function decodeBase58OrZeros(str: string): Buffer {
  // Check if the string is the all-zero dummy creatorsHash
  if (str === '0000000000000000000000000000000000000000000000000000000000000000') {
    return Buffer.alloc(32); // 32 bytes of 0x00
  }
  // Otherwise decode from base58
  return Buffer.from(bs58.decode(str));
}

export async function buildCompressedNftListingTx(params: CompressedNftListingParams) {
  console.log('[buildCompressedNftListingTx] Start. Provided params:', params);

  // Connect to mainnet
  const connection = new Connection('https://api.mainnet-beta.solana.com');

  // Create an ephemeral keypair (just for building the transaction).
  const ephemeralKeypair = Keypair.generate();
  console.log('[buildCompressedNftListingTx] ephemeral keypair:', ephemeralKeypair.publicKey.toBase58());

  // Dummy provider that never actually signs anything
  const provider = {
    connection,
    wallet: {
      publicKey: ephemeralKeypair.publicKey,
      async signTransaction(tx: Transaction) {
        // No-op; we only need an unsigned TX
        return tx;
      }
    }
  } as Provider;

  // Initialize TCompSDK
  const tensorSdk = new TCompSDK({ provider });
  console.log('[buildCompressedNftListingTx] TCompSDK instantiated.');

  // Decode proof from base58 -> Buffer
  const proofBuffers = params.proof.map((p) => Buffer.from(bs58.decode(p)));

  // Decode the root from base58 -> Buffer, then convert to number[] for TCompSDK
  const rootBuffer = Buffer.from(bs58.decode(params.root));
  const rootArray = Array.from(rootBuffer);

  // Decode dataHash + creatorsHash from base58 (or 32 zeros)
  const dataHashBuffer = Buffer.from(bs58.decode(params.dataHash));
  const creatorsHashBuffer = decodeBase58OrZeros(params.creatorsHash);

  // Optional debug logging
  console.log(
    '[buildCompressedNftListingTx] Debug Data:\n',
    '  proofBuffers =',
    proofBuffers.map((b) => b.toString('hex')), // safely call toString('hex') on a Buffer
    '\n  rootArray =',
    rootArray,
    '\n  dataHashBuffer =',
    dataHashBuffer.toString('hex'),
    '\n  creatorsHashBuffer =',
    creatorsHashBuffer.toString('hex'),
    '\n  canopyDepth =',
    params.canopyDepth,
    '\n  leafIndex =',
    params.leafIndex
  );

  // Build listing instructions via TCompSDK
  const listingResult = await tensorSdk.list({
    merkleTree: new PublicKey(params.merkleTree),
    owner: new PublicKey(params.owner),
    delegate: undefined,
    proof: proofBuffers,           // must be Buffer[]
    root: rootArray,               // must be number[]
    canopyDepth: params.canopyDepth,
    index: params.leafIndex,
    dataHash: dataHashBuffer,      // must be a Buffer
    creatorsHash: creatorsHashBuffer,
    rentPayer: new PublicKey(params.owner),
    amount: new BN(params.price),   // lamports
    currency: null,                // null => SOL
    expireInSec: params.expiry ? new BN(params.expiry) : null,
    privateTaker: null
  });

  console.log('[buildCompressedNftListingTx] listingResult:', listingResult);

  if (!listingResult?.tx?.ixs) {
    throw new Error('No instructions returned from TCompSDK listingResult.');
  }

  // Create a Transaction from listingResult's instructions
  const unsignedTx = new Transaction();
  for (const ix of listingResult.tx.ixs) {
    unsignedTx.add(ix);
  }

  // Add a recent blockhash & feePayer
  const { blockhash } = await connection.getLatestBlockhash();
  unsignedTx.recentBlockhash = blockhash;
  unsignedTx.feePayer = new PublicKey(params.owner);

  // Serialize to base64
  const serializedTx = unsignedTx.serialize({
    requireAllSignatures: false,
    verifySignatures: false
  });
  const base64Tx = serializedTx.toString('base64');

  console.log('[buildCompressedNftListingTx] final base64 unsigned TX:', base64Tx);

  return {
    success: true,
    transaction: base64Tx
  };
}
