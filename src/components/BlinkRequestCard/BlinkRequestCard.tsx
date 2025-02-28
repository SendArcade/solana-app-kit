import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import {
  Blink,
  Miniblink,
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
 * (A) Utility to transform a "dial.to/v1/blink?apiUrl=..." link
 *     into a "dial.to/?action=solana-action:..." link.
 *
 *     If your link is already "https://dial.to/?action=solana-action:...", 
 *     this function just returns it unchanged.
 */
function transformBlinkUrl(originalUrl: string): string {
  try {
    // Example original:
    // "https://api.dial.to/v1/blink?apiUrl=https%3A%2F%2Ftensor.dial.to%2Fbuy-floor%2Fmadlads"
    const urlObj = new URL(originalUrl);

    // If the link already has ?action=, skip
    if (urlObj.searchParams.has('action')) {
      // It's already in the correct format
      return originalUrl;
    }

    // Otherwise, check if we have apiUrl=...
    const apiUrlParam = urlObj.searchParams.get('apiUrl');
    if (!apiUrlParam) {
      // We do not have action= nor apiUrl=, fallback
      return originalUrl;
    }

    // Build the new link e.g. "https://dial.to/?action=solana-action:<decoded param>"
    // Usually the domain might need to be "dial.to", 
    // but if your final domain is different, adapt as necessary:
    const decodedApiUrl = decodeURIComponent(apiUrlParam);
    const newUrl = `https://dial.to/?action=solana-action:${decodedApiUrl}`;
    return newUrl;
  } catch (e) {
    // If parse fails, fallback
    return originalUrl;
  }
}

/**
 * (B) Our Dialect adapter using the Privy embedded wallet.
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
      // Optionally confirm if needed
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
 * (C) BlinkExample: Full Dialect Blink component that loads an action from the provided URL.
 *     We transform the given URL into the correct "action=solana-action:..." format if needed.
 */
export const BlinkExample: React.FC<{ url: string }> = ({ url }) => {
  console.debug('[BlinkExample] Original URL passed in:', url);
  const transformedUrl = transformBlinkUrl(url);
  console.debug('[BlinkExample] Transformed URL for useAction:', transformedUrl);

  const adapter = createPrivyWalletAdapter();
  const { action, isLoading, refresh } = useAction({ url: transformedUrl });
  if (isLoading) {
    console.debug('[BlinkExample] Loading action...');
    return <ActivityIndicator />;
  }
  if (!action) {
    console.error('[BlinkExample] No action found from URL:', transformedUrl);
    return <Text>Could not load action from {transformedUrl}</Text>;
  }
  console.debug('[BlinkExample] Action loaded, rendering Blink.');

  // For display in the Blink, parse out domain from the final URL
  const website = new URL(transformedUrl);

  return (
    <Blink
      theme={{
        '--blink-button': '#1D9BF0',
        '--blink-border-radius-rounded-button': 9999,
        '--blink-spacing-input-height': 44,
      }}
      action={action}
      adapter={adapter}
      websiteUrl={website.href}
      websiteText={website.hostname}
    />
  );
};

/**
 * (D) MiniblinkExample: A mini version of Blink that selects a specific "Donate" action, if present.
 *     Also transforms the URL if needed.
 */
export const MiniblinkExample: React.FC<{ url: string }> = ({ url }) => {
  console.debug('[MiniblinkExample] Original URL:', url);
  const transformedUrl = transformBlinkUrl(url);
  console.debug('[MiniblinkExample] Transformed URL for useAction:', transformedUrl);

  const adapter = createPrivyWalletAdapter();
  const { action, isLoading } = useAction({ url: transformedUrl });
  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (!action) {
    console.error('[MiniblinkExample] No action found from URL:', transformedUrl);
    return <Text>Could not load action from {transformedUrl}</Text>;
  }
  console.debug('[MiniblinkExample] Action loaded, rendering Miniblink.');

  return (
    <Miniblink
      action={action}
      adapter={adapter}
      selector={(currentAction) =>
        currentAction.actions.find((a) => a.label === 'Donate')!
      }
    />
  );
};
