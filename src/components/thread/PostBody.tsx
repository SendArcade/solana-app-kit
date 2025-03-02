import React from 'react';
import { View, Text, Image, Alert, TouchableOpacity } from 'react-native';
import { createThreadStyles, getMergedTheme } from './thread.styles';
import TradeCard from '../TradeCard/TradeCard';
import { ThreadPost } from './thread.types';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { getProvider } from '../../utils/pumpfun/pumpfunUtils';
import { Buffer } from 'buffer';

const SOL_TO_LAMPORTS = 1_000_000_000;

interface PostBodyProps {
  post: ThreadPost;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: { [key: string]: object };
}

export default function PostBody({
  post,
  themeOverrides,
  styleOverrides,
}: PostBodyProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  return (
    <View style={{ marginTop: 8 }}>
      {post.sections.map((section) => (
        <View key={section.id} style={styles.extraContentContainer}>
          <View style={{ width: '84%' }}>
            {renderSection(section, styles)}
          </View>
        </View>
      ))}
    </View>
  );
}

function renderSection(
  section: ThreadPost['sections'][number],
  styles: ReturnType<typeof createThreadStyles>,
) {
  switch (section.type) {
    case 'TEXT_ONLY':
      return <Text style={styles.threadItemText}>{section.text}</Text>;

    case 'TEXT_IMAGE':
      return (
        <>
          {!!section.text && <Text style={styles.threadItemText}>{section.text}</Text>}
          {section.imageUrl && <Image source={section.imageUrl} style={styles.threadItemImage} />}
        </>
      );

    case 'TEXT_VIDEO':
      return (
        <>
          {!!section.text && <Text style={styles.threadItemText}>{section.text}</Text>}
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>[Video Player Placeholder]</Text>
          </View>
        </>
      );

    case 'TEXT_TRADE':
      return (
        <>
          {!!section.text && <Text style={styles.threadItemText}>{section.text}</Text>}
          {section.tradeData && (
            <TradeCard
              token1={{
                avatar: section.tradeData.token1Avatar,
                name: section.tradeData.token1Name,
                priceUsd: section.tradeData.token1PriceUsd,
              }}
              token2={{
                avatar: section.tradeData.token2Avatar,
                name: section.tradeData.token2Name,
                priceUsd: section.tradeData.token2PriceUsd,
                priceSol: section.tradeData.token2PriceSol,
              }}
            />
          )}
        </>
      );

    case 'POLL':
      if (!section.pollData) {
        return <Text style={styles.threadItemText}>[Missing poll data]</Text>;
      }
      return (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{section.pollData.question}</Text>
          {section.pollData?.options.map((option, index) => (
            <View key={index} style={styles.pollOption}>
              <Text style={styles.pollOptionText}>
                {option} • {section.pollData?.votes[index]} votes
              </Text>
            </View>
          ))}
        </View>
      );

    case 'NFT_LISTING':
      if (!section.listingData) {
        return <Text style={styles.threadItemText}>[Missing listing data]</Text>;
      }
      return <NFTListingSection section={section} styles={styles} />;

    default:
      return null;
  }
}

/** A dedicated component to render an NFT listing and initiate a buy. */
interface NFTListingSectionProps {
  section: ThreadPost['sections'][number];
  styles: ReturnType<typeof createThreadStyles>;
}

const NFTListingSection: React.FC<NFTListingSectionProps> = ({ section, styles }) => {
  // Get the current viewer's public key from your auth state
  const viewerPubkey = useSelector((state: RootState) => state.auth.address);

  // Buy handler that replicates the buy logic from your BuySection code
  const handleBuyListedNft = async () => {
    console.log('Buy button clicked for NFT listing');
    const listingOwner = section.listingData!.owner || '';
    const listingPriceSol = section.listingData!.priceSol ?? 0;
    const mint = section.listingData!.mint;
    if (!viewerPubkey) {
      Alert.alert('Error', 'Wallet not connected.');
      return;
    }
    try {
      // Create a connection to Solana mainnet
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      // Get a recent blockhash (using getRecentBlockhash as in your BuySection)
      const { blockhash } = await connection.getRecentBlockhash();
      console.log('Obtained blockhash:', blockhash);
      // Build the buy URL using Tensor's API
      const buyUrl = `https://api.mainnet.tensordev.io/api/v1/tx/buy?buyer=${viewerPubkey}&mint=${mint}&owner=${listingOwner}&maxPrice=${listingPriceSol}&blockhash=${blockhash}`;
      console.log('Buy URL:', buyUrl);
      const resp = await fetch(buyUrl, {
        headers: { 'x-tensor-api-key': 'afe339b5-9c47-4105-a9fa-7fba32a294dc' }
      });
      const rawText = await resp.text();
      console.log('Raw response from Tensor:', rawText);
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Tensor returned non-JSON response. Check console for details.');
      }
      if (!data.txs || data.txs.length === 0) {
        throw new Error('No transactions returned from Tensor API for buying.');
      }
      console.log('Transactions received:', data.txs);
      for (let i = 0; i < data.txs.length; i++) {
        const txObj = data.txs[i];
        let transaction: Transaction | VersionedTransaction;
        if (txObj.txV0) {
          const txBuffer = Buffer.from(txObj.txV0.data, 'base64');
          transaction = VersionedTransaction.deserialize(txBuffer);
          console.log(`Deserialized versioned transaction #${i + 1}`);
        } else if (txObj.tx) {
          const txBuffer = Buffer.from(txObj.tx.data, 'base64');
          transaction = Transaction.from(txBuffer);
          console.log(`Deserialized legacy transaction #${i + 1}`);
        } else {
          throw new Error(`Transaction #${i + 1} is in an unknown format.`);
        }
        // Cast provider to any to bypass type errors
        const provider: any = await getProvider();
        const { signature } = await provider.request({
          method: 'signAndSendTransaction',
          params: { transaction, connection }
        });
        console.log(`Transaction #${i + 1} signature: ${signature}`);
      }
      Alert.alert('Success', 'NFT purchased successfully!');
    } catch (err: any) {
      console.error('Error during buy transaction:', err);
      Alert.alert('Error', err.message || 'Failed to buy NFT.');
    }
  };

  // Fallback values for display
  const listingOwner = section.listingData!.owner || '';
  const listingPrice = section.listingData!.priceSol ?? 0;
  const listingName = section.listingData!.name || 'Unnamed NFT';
  const listingImage = section.listingData!.image || '';

  return (
    <View style={styles.nftListingContainer}>
      {section.text && <Text style={styles.threadItemText}>{section.text}</Text>}
      {/* Vertical NFT card: big image on top, name and price below */}
      <View style={styles.nftListingCard}>
        <View style={styles.nftListingImageContainer}>
          {listingImage ? (
            <Image source={{ uri: listingImage }} style={styles.nftListingImage} />
          ) : (
            <View style={styles.nftListingPlaceholder}>
              <Text style={styles.nftListingPlaceholderText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.nftListingInfo}>
          <Text style={styles.nftListingName} numberOfLines={1}>
            {listingName}
          </Text>
          <Text style={styles.nftListingPrice}>
            {listingPrice > 0 ? `Listed @ ${listingPrice.toFixed(2)} SOL` : 'No Price'}
          </Text>
        </View>
      </View>
      {viewerPubkey && listingOwner && viewerPubkey !== listingOwner ? (
        <TouchableOpacity style={styles.buyButtonStyle} onPress={handleBuyListedNft}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.buyButtonStyle, { opacity: 0.5 }]} disabled>
          <Text style={styles.buyButtonText}>Buy (Disabled)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
