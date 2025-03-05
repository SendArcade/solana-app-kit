// FILE: src/components/thread/sections/SectionNftListing.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, Image, ActivityIndicator} from 'react-native';
import {NftListingData} from '../thread.types';
import styles from './SectionNftListing.style';
import {TENSOR_API_KEY} from '@env';
import {DEFAULT_IMAGES} from '../../../config/constants';

interface SectionNftListingProps {
  listingData?: NftListingData;
}

export default function SectionNftListing({
  listingData,
}: SectionNftListingProps) {
  const [loading, setLoading] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingData) return;
    let cancelled = false;

    const fetchNftData = async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, [listingData]);

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
      return DEFAULT_IMAGES.user;
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
