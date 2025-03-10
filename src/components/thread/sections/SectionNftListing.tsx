// FILE: src/components/thread/sections/SectionNftListing.tsx
import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Image, ActivityIndicator} from 'react-native';
import {NftListingData} from '../thread.types';
import styles from './SectionNftListing.style';
import {TENSOR_API_KEY} from '@env';
import {DEFAULT_IMAGES} from '../../../config/constants';

/**
 * Props for the SectionNftListing component
 */
interface SectionNftListingProps {
  listingData?: NftListingData;
}

/**
 * A component that renders an NFT listing card in a post section
 * 
 * Issues resolved:
 *  - Only fetch data once per mint (no repeated updates).
 *  - Handle rate-limit (429) without infinite loops.
 */
export default function SectionNftListing({listingData}: SectionNftListingProps) {
  const [loading, setLoading] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep track of which mint we last fetched, so we don’t re-fetch on re-render
  const lastFetchedMintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!listingData?.mint) {
      return;
    }
    // If we already fetched for this mint, do not fetch again
    if (lastFetchedMintRef.current === listingData.mint) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchNftData = async () => {
      try {
        const url = `https://api.mainnet.tensordev.io/api/v1/mint?mints=${listingData.mint}`;
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

        if (Array.isArray(data) && data.length > 0) {
          setNftData(data[0]);
        } else {
          setError('No data returned from Tensor.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch NFT data');
      } finally {
        if (!cancelled) {
          setLoading(false);
          // Mark that we've fetched for this mint
          lastFetchedMintRef.current = listingData.mint;
        }
      }
    };

    fetchNftData();
    return () => {
      cancelled = true;
    };
  }, [listingData?.mint]);

  if (!listingData) {
    return <Text>[Missing listing data]</Text>;
  }

  function formatSolPrice(lamports: string) {
    if (!lamports) return null;
    const solPrice = parseFloat(lamports) / 1_000_000_000;
    return solPrice.toFixed(2);
  }

  function getNftImageSource(uri?: string) {
    if (!uri || typeof uri !== 'string') {
      return DEFAULT_IMAGES.user; // fallback
    }
    return {uri};
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color="#1d9bf0" />
        ) : (
          <>
            <View style={styles.imageContainer}>
              {nftData?.imageUri ? (
                <Image
                  source={getNftImageSource(nftData.imageUri)}
                  style={styles.image}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.nftTitle} numberOfLines={1}>
                {nftData?.name || listingData.name || 'Unnamed NFT'}
              </Text>

              {nftData?.collName && (
                <Text style={styles.collectionName}>
                  Collection: {nftData.collName}
                </Text>
              )}

              {nftData?.listing?.price && (
                <Text style={styles.priceText}>
                  Listed @ {formatSolPrice(nftData.listing.price)} SOL
                </Text>
              )}

              {nftData?.lastSale?.price && (
                <Text style={styles.lastSale}>
                  Last sale: {formatSolPrice(nftData.lastSale.price)} SOL
                </Text>
              )}

              {nftData?.rarityRankTN && (
                <Text style={styles.rarityInfo}>
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
