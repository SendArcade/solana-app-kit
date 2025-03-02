// FILE: src/components/thread/PostBody.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, Image, ActivityIndicator} from 'react-native';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import TradeCard from '../TradeCard/TradeCard';
import {ThreadPost} from './thread.types';
import {TENSOR_API_KEY} from '@env';
import nftListingStyles from './NftListingSection.style'; // NEW import

interface PostBodyProps {
  post: ThreadPost;
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {[key: string]: object};
}

export default function PostBody({
  post,
  themeOverrides,
  styleOverrides,
}: PostBodyProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(mergedTheme, styleOverrides);

  return (
    <View style={{marginTop: 8}}>
      {post.sections.map(section => (
        <View key={section.id} style={styles.extraContentContainer}>
          <View style={{width: '84%'}}>{renderSection(section, styles)}</View>
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
          {!!section.text && (
            <Text style={styles.threadItemText}>{section.text}</Text>
          )}
          {section.imageUrl && (
            <Image source={section.imageUrl} style={styles.threadItemImage} />
          )}
        </>
      );

    case 'TEXT_VIDEO':
      return (
        <>
          {!!section.text && (
            <Text style={styles.threadItemText}>{section.text}</Text>
          )}
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>
              [Video Player Placeholder]
            </Text>
          </View>
        </>
      );

    case 'TEXT_TRADE':
      return (
        <>
          {!!section.text && (
            <Text style={styles.threadItemText}>{section.text}</Text>
          )}
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
          {section.pollData.options.map((option, index) => (
            <View key={index} style={styles.pollOption}>
              <Text style={styles.pollOptionText}>
                {option} • {section.pollData?.votes[index] ?? 0} votes
              </Text>
            </View>
          ))}
        </View>
      );

    case 'NFT_LISTING':
      if (!section.listingData) {
        return (
          <Text style={styles.threadItemText}>[Missing listing data]</Text>
        );
      }
      return <NftListingSection listing={section.listingData} />;

    default:
      return null;
  }
}

/**
 * Sub-component: NftListingSection
 * Moved all styles to NftListingSection.style.ts
 */
function NftListingSection({
  listing,
}: {
  listing: {
    mint: string;
    owner: string;
    name?: string;
    image?: string;
    priceSol?: number;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchNftData = async () => {
      try {
        setLoading(true);
        setError(null);
        // For demonstration: "quick-mint-info"
        // Documentation: https://docs.tensor.trade/reference/quick_mint_info
        const url = `https://api.mainnet.tensordev.io/api/v1/mint?mints=${listing.mint}`;
        const resp = await fetch(url, {
          headers: {
            'x-tensor-api-key': TENSOR_API_KEY,
          },
        });

        if (!resp.ok) {
          throw new Error(`Tensor API error: ${resp.status}`);
        }
        const data = await resp.json();
        if (cancelled) return;

        if (data && data.length > 0) {
          setNftData(data[0]);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch NFT data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchNftData();
    return () => {
      cancelled = true;
    };
  }, [listing.mint]);

  const formatSolPrice = (lamports: string) => {
    if (!lamports) return null;
    const solPrice = parseFloat(lamports) / 1_000_000_000;
    return solPrice.toFixed(2);
  };

  return (
    <View style={nftListingStyles.container}>
      <View style={nftListingStyles.card}>
        {loading ? (
          <ActivityIndicator size="large" color="#1d9bf0" />
        ) : (
          <>
            <View style={nftListingStyles.imageContainer}>
              {nftData?.imageUri ? (
                <Image
                  source={{uri: nftData.imageUri}}
                  style={nftListingStyles.image}
                />
              ) : (
                <View style={nftListingStyles.placeholder}>
                  <Text style={nftListingStyles.placeholderText}>No Image</Text>
                </View>
              )}
            </View>

            <View style={nftListingStyles.infoSection}>
              <Text style={nftListingStyles.nftTitle} numberOfLines={1}>
                {nftData?.name || listing.name || 'Unnamed NFT'}
              </Text>

              {nftData?.collName && (
                <Text style={nftListingStyles.collectionName}>
                  Collection: {nftData.collName}
                </Text>
              )}

              {!!nftData?.listing?.price && (
                <Text style={nftListingStyles.priceText}>
                  Listed @ {formatSolPrice(nftData.listing.price)} SOL
                </Text>
              )}

              {nftData?.lastSale?.price && (
                <Text style={nftListingStyles.lastSale}>
                  Last sale: {formatSolPrice(nftData.lastSale.price)} SOL
                </Text>
              )}

              {nftData?.rarityRankTN && (
                <Text style={nftListingStyles.rarityInfo}>
                  Rarity Rank: #{nftData.rarityRankTN} of{' '}
                  {nftData.numMints || '?'}
                </Text>
              )}
            </View>
          </>
        )}
        {error && (
          <Text style={{color: 'red', marginTop: 8, fontSize: 12}}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}
