import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import {
  Blink,
  useAction,
  BlockchainIds,
  createSignMessageText,
  type ActionAdapter,
  type SignMessageData,
  ActionContext,
} from '@dialectlabs/blinks-react-native';

import {
  PublicKey,
  Connection,
  clusterApiUrl,
  VersionedTransaction,
  Transaction,
} from '@solana/web3.js';

import { Buffer } from 'buffer';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';

global.Buffer = Buffer;

/**
 * Props for the BlinkRequestCard component
 */
interface BlinkRequestCardProps {
  /** The URL to load the blink action from */
  url: string;
  /** Optional custom theme overrides for the Blink component */
  theme?: Record<string, string>;
}

/**
 * Props for the MiniblinkRequestCard component
 */
interface MiniblinkRequestCardProps {
  /** The URL to load the blink action from */
  url: string;
  /** Optional custom theme overrides for the Miniblink component */
  theme?: Record<string, string>;
}

/**
 * Transforms a Dialect Blink URL into the correct format for action loading
 * 
 * @param originalUrl - The original URL to transform
 * @returns The transformed URL in the format "dial.to/?action=solana-action:..."
 * 
 * @example
 * ```typescript
 * const url = "https://api.dial.to/v1/blink?apiUrl=https%3A%2F%2Ftensor.dial.to%2Fbuy-floor%2Fmadlads";
 * const transformed = transformBlinkUrl(url);
 * // Returns: "https://dial.to/?action=solana-action:https://tensor.dial.to/buy-floor/madlads"
 * ```
 */
function transformBlinkUrl(originalUrl: string): string {
  try {
    const urlObj = new URL(originalUrl);

    // If the link already has ?action=, skip
    if (urlObj.searchParams.has('action')) {
      return originalUrl;
    }

    // Check if we have apiUrl=...
    const apiUrlParam = urlObj.searchParams.get('apiUrl');
    if (!apiUrlParam) {
      return originalUrl;
    }

    // Build the new link
    const decodedApiUrl = decodeURIComponent(apiUrlParam);
    const newUrl = `https://dial.to/?action=solana-action:${decodedApiUrl}`;
    return newUrl;
  } catch (e) {
    return originalUrl;
  }
}

/**
 * Creates a Dialect adapter using the Privy embedded wallet
 * 
 * @returns An ActionAdapter instance configured for Privy wallet
 * 
 * @description
 * This adapter provides the necessary functions for:
 * - Connecting to the wallet
 * - Signing transactions
 * - Confirming transactions
 * - Signing messages
 * 
 * It uses the Privy embedded Solana wallet and maintains a connection
 * to the Solana mainnet.
 */
function createPrivyWalletAdapter(): ActionAdapter {
  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
  const solanaWallet = useEmbeddedSolanaWallet();

  return {
    connect: async (context: ActionContext) => {
      console.debug('[BlinkAdapter] connect() called, context:', context);
      if (!solanaWallet?.wallets?.length) {
        throw new Error('No Privy Solana wallet found. Please log in first.');
      }
      const pubkeyStr = solanaWallet.wallets[0].publicKey;
      if (!pubkeyStr) {
        throw new Error('Missing public key in Privy Solana wallet.');
      }
      console.debug('[BlinkAdapter] connect() returning pubkey:', pubkeyStr);
      return pubkeyStr;
    },

    signTransaction: async (txBase64: string, context: ActionContext) => {
      console.debug('[BlinkAdapter] signTransaction() called with txBase64:', txBase64);
      try {
        if (!solanaWallet?.getProvider || !solanaWallet?.wallets?.length) {
          return { error: 'No Privy Solana wallet or provider found.' };
        }
        const provider = await solanaWallet.getProvider();
        if (!provider || typeof provider.request !== 'function') {
          return { error: 'Privy provider is missing or invalid.' };
        }
        const txBuffer = Buffer.from(txBase64, 'base64');
        let txObj: VersionedTransaction | Transaction;
        try {
          txObj = VersionedTransaction.deserialize(txBuffer);
          console.debug('[BlinkAdapter] Decoded as VersionedTransaction.');
        } catch (versionedError) {
          txObj = Transaction.from(txBuffer);
          console.debug('[BlinkAdapter] Decoded as Legacy Transaction.');
        }

        console.debug('[BlinkAdapter] signTransaction -> calling provider.request...');
        const signResp = await provider.request({
          method: 'signTransaction',
          params: { transaction: txObj },
        });
        console.debug('[BlinkAdapter] signTransaction -> signResp:', signResp);

        if (!signResp || !signResp.signedTransaction) {
          return { error: 'No signedTransaction returned by Privy.' };
        }
        const { signedTransaction } = signResp;

        console.debug('[BlinkAdapter] signTransaction -> sending raw transaction...');
        const txid = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
        });
        console.debug('[BlinkAdapter] signTransaction -> txid:', txid);

        return { signature: txid };
      } catch (err: any) {
        console.error('[BlinkAdapter] signTransaction error:', err);
        return { error: err?.message ?? String(err) };
      }
    },

    confirmTransaction: async (signature: string) => {
      console.debug('[BlinkAdapter] confirmTransaction() called with:', signature);
      return;
    },

    signMessage: async (message: string | SignMessageData) => {
      console.debug('[BlinkAdapter] signMessage() called with:', message);
      try {
        if (!solanaWallet?.getProvider || !solanaWallet?.wallets?.length) {
          return { error: 'No Privy Solana wallet or provider found.' };
        }
        const provider = await solanaWallet.getProvider();
        if (!provider || typeof provider.request !== 'function') {
          return { error: 'Privy provider is missing or invalid.' };
        }
        const messageToSign =
          typeof message === 'string' ? message : createSignMessageText(message);

        const signResp = await provider.request({
          method: 'signMessage',
          params: { message: Buffer.from(messageToSign).toString('base64') },
        });
        console.debug('[BlinkAdapter] signMessage response:', signResp);
        if (!signResp || !signResp.signature) {
          return { error: 'No signature returned by Privy signMessage.' };
        }
        return { signature: signResp.signature };
      } catch (err: any) {
        console.error('[BlinkAdapter] signMessage error:', err);
        return { error: err?.message ?? String(err) };
      }
    },

    metadata: {
      supportedBlockchainIds: [BlockchainIds.SOLANA_MAINNET],
    },
  };
}

/**
 * A component that handles Dialect Blink messaging requests
 * 
 * @component
 * @description
 * BlinkRequestCard is a component that integrates with Dialect's Blink system
 * to handle various blockchain actions. It provides:
 * - URL transformation for proper action loading
 * - Wallet connection and transaction signing
 * - Message signing capabilities
 * - Customizable theming
 * 
 * The component uses Privy's embedded Solana wallet for all blockchain
 * interactions and supports both versioned and legacy transactions.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <BlinkRequestCard url="https://api.dial.to/v1/blink?apiUrl=..." />
 * 
 * // With custom theme
 * <BlinkRequestCard 
 *   url="https://api.dial.to/v1/blink?apiUrl=..."
 *   theme={{
 *     '--blink-button': '#FF0000',
 *     '--blink-border-radius-rounded-button': 8,
 *   }}
 * />
 * ```
 */
export const BlinkRequestCard: React.FC<BlinkRequestCardProps> = ({ url, theme }) => {
  console.debug('[BlinkRequestCard] Original URL passed in:', url);
  const transformedUrl = transformBlinkUrl(url);
  console.debug('[BlinkRequestCard] Transformed URL for useAction:', transformedUrl);

  const adapter = createPrivyWalletAdapter();
  const { action, isLoading, refresh } = useAction({ url: transformedUrl });
  
  if (isLoading) {
    console.debug('[BlinkRequestCard] Loading action...');
    return <ActivityIndicator />;
  }
  
  if (!action) {
    console.error('[BlinkRequestCard] No action found from URL:', transformedUrl);
    return <Text>Could not load action from {transformedUrl}</Text>;
  }
  
  console.debug('[BlinkRequestCard] Action loaded, rendering Blink.');

  const website = new URL(transformedUrl);

  return (
    <Blink
      theme={{
        '--blink-button': '#1D9BF0',
        '--blink-border-radius-rounded-button': 9999,
        '--blink-spacing-input-height': 44,
        ...theme,
      }}
      action={action}
      adapter={adapter}
      websiteUrl={website.href}
      websiteText={website.hostname}
    />
  );
};

/**
 * A mini version of BlinkRequestCard that selects a specific "Donate" action
 * 
 * @component
 * @description
 * MiniblinkRequestCard is a compact version of BlinkRequestCard that specifically
 * looks for and displays a "Donate" action if present. It provides the same
 * functionality as BlinkRequestCard but with a more focused use case.
 * 
 * @example
 * ```tsx
 * <MiniblinkRequestCard url="https://api.dial.to/v1/blink?apiUrl=..." />
 * ```
 */
export const MiniblinkRequestCard: React.FC<MiniblinkRequestCardProps> = ({ url, theme }) => {
  console.debug('[MiniblinkRequestCard] Original URL:', url);
  const transformedUrl = transformBlinkUrl(url);
  console.debug('[MiniblinkRequestCard] Transformed URL for useAction:', transformedUrl);

  const adapter = createPrivyWalletAdapter();
  const { action, isLoading } = useAction({ url: transformedUrl });
  
  if (isLoading) {
    return <ActivityIndicator />;
  }
  
  if (!action) {
    console.error('[MiniblinkRequestCard] No action found from URL:', transformedUrl);
    return <Text>Could not load action from {transformedUrl}</Text>;
  }
  
  console.debug('[MiniblinkRequestCard] Action loaded, rendering Miniblink.');

  // Find the donate action before rendering
  const donateAction = action.actions.find((a: { label: string }) => a.label === 'Donate');
  if (!donateAction) {
    return <Text>No donate action found</Text>;
  }

  return (
    <Blink
      theme={{
        '--blink-button': '#1D9BF0',
        '--blink-border-radius-rounded-button': 9999,
        '--blink-spacing-input-height': 44,
        ...theme,
      }}
      action={action}
      adapter={adapter}
    />
  );
};
