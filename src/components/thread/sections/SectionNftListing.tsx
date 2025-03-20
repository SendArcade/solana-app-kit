import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Image, ActivityIndicator} from 'react-native';
import {NftListingData} from '../thread.types';
import styles from './SectionNftListing.style';
import {TENSOR_API_KEY} from '@env';
import {DEFAULT_IMAGES} from '../../../config/constants';

interface SectionNftListingProps {
  listingData?: NftListingData;
}

export default function SectionNftListing({listingData}: SectionNftListingProps) {
  const [loading, setLoading] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Track what we last fetched to avoid redundant fetches
  const lastFetchedRef = useRef<{mint?: string, collId?: string} | null>(null);

  useEffect(() => {
    if (!listingData) return;

    // Determine if we need to fetch data
    const needsFetch = 
      !lastFetchedRef.current || 
      (listingData.mint && lastFetchedRef.current.mint !== listingData.mint) ||
      (listingData.collId && lastFetchedRef.current.collId !== listingData.collId);
    
    if (!needsFetch) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Fetch collection data if this is a collection listing
        if (listingData.isCollection && listingData.collId) {
          await fetchCollectionData(listingData.collId);
          if (cancelled) return;
        } 
        // Otherwise fetch specific NFT data
        else if (listingData.mint) {
          await fetchNftData(listingData.mint);
          if (cancelled) return;
        } else {
          setError('No mint or collection ID provided');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          // Track what we fetched
          lastFetchedRef.current = {
            mint: listingData.mint,
            collId: listingData.collId
          };
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [listingData?.mint, listingData?.collId, listingData?.isCollection]);

  // Function to fetch NFT data
  const fetchNftData = async (mint: string) => {
    const url = `https://api.mainnet.tensordev.io/api/v1/mint?mints=${mint}`;
    const resp = await fetch(url, {
      headers: {
        'x-tensor-api-key': TENSOR_API_KEY,
      },
    });
    if (!resp.ok) {
      throw new Error(`Tensor API error: ${resp.status}`);
    }
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      setNftData(data[0]);
    } else {
      throw new Error('No data returned from Tensor');
    }
  };

// Function to fetch collection data - updated to use find_collection endpoint
const fetchCollectionData = async (collId: string) => {
  try {
    // Use the find_collection endpoint to get comprehensive collection data
    const url = `https://api.mainnet.tensordev.io/api/v1/collections/find_collection?filter=${collId}`;
    const resp = await fetch(url, {
      headers: {
        'x-tensor-api-key': TENSOR_API_KEY,
      },
    });
    
    if (!resp.ok) {
      throw new Error(`Tensor API error: ${resp.status}`);
    }
    
    const data = await resp.json();
    console.log('Collection data:', data);
    setCollectionData(data);
    
    // Now that we have collection data, fetch the current floor price
    try {
      const floorUrl = `https://api.mainnet.tensordev.io/api/v1/mint/collection?collId=${collId}&sortBy=ListingPriceAsc&limit=1`;
      const floorResp = await fetch(floorUrl, {
        headers: {
          'x-tensor-api-key': TENSOR_API_KEY,
        },
      });
      
      if (floorResp.ok) {
        const floorData = await floorResp.json();
        if (floorData.mints?.length > 0 && floorData.mints[0].listing?.price) {
          // Add floor price to collection data
          setCollectionData((prev : any) => ({
            ...prev,
            floorPrice: parseFloat(floorData.mints[0].listing.price) / 1_000_000_000
          }));
        }
      }
    } catch (floorErr) {
      console.error('Error fetching floor price:', floorErr);
    }
  } catch (err) {
    console.error('Error fetching collection data:', err);
    throw err;
  }
};


  if (!listingData) {
    return <Text>[Missing listing data]</Text>;
  }

  function formatSolPrice(price: number | string | undefined) {
    if (!price) return null;
    const solPrice = typeof price === 'string' ? 
      parseFloat(price) / 1_000_000_000 : 
      price;
    return solPrice.toFixed(2);
  }

  function getNftImageSource(uri?: string) {
    if (!uri || typeof uri !== 'string') {
      return DEFAULT_IMAGES.user; // fallback
    }
    return {uri};
  }

  // Render based on whether it's a collection or specific NFT
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#1d9bf0" />;
    }

    if (listingData.isCollection) {
      return (
        <>
          <View style={styles.imageContainer}>
            {listingData.image || (collectionData?.imageUri) ? (
              <Image
                source={getNftImageSource(listingData.image || collectionData?.imageUri)}
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
              {listingData.collectionName || collectionData?.name || 'Unnamed Collection'}
            </Text>

            {collectionData?.floorPrice && (
              <Text style={[styles.priceText, {color: '#32D4DE'}]}>
                Current Floor: {formatSolPrice(collectionData.floorPrice)} SOL
              </Text>
            )}

            {collectionData?.description && (
              <Text style={styles.collectionDescription} numberOfLines={2}>
                {collectionData.description}
              </Text>
            )}

            {collectionData?.tokenCount && (
              <Text style={styles.rarityInfo}>
                Items: {collectionData.tokenCount}
              </Text>
            )}
          </View>
        </>
      );
    }

    // Regular NFT listing display (existing code)
    return (
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
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {renderContent()}

        {error && (
          <Text style={{color: 'red', marginTop: 8, fontSize: 12}}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}

