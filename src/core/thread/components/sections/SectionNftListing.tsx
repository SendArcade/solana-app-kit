import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NftListingData } from '../thread.types';
import styles from './SectionNftListing.style';
import { TENSOR_API_KEY } from '@env';
import { DEFAULT_IMAGES } from '../../../../config/constants';
import TokenDetailsDrawer from '../../../../components/Common/TokenDetailsDrawer/TokenDetailsDrawer';

interface SectionNftListingProps {
  listingData?: NftListingData;
}

// Create a cache for NFT and collection data to prevent redundant fetches
const nftDataCache = new Map<string, any>();
const collectionDataCache = new Map<string, any>();

export default function SectionNftListing({ listingData }: SectionNftListingProps) {
  const [loading, setLoading] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNftDetailsDrawer, setShowNftDetailsDrawer] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Track what we last fetched to avoid redundant fetches
  const lastFetchedRef = useRef<{ mint?: string, collId?: string } | null>(null);
  // Track if the component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!listingData) return;

    // Check if we have cached data
    if (listingData.isCollection && listingData.collId && collectionDataCache.has(listingData.collId)) {
      const cachedData = collectionDataCache.get(listingData.collId);
      if (cachedData) {
        setCollectionData(cachedData);
        return;
      }
    } else if (listingData.mint && nftDataCache.has(listingData.mint)) {
      const cachedData = nftDataCache.get(listingData.mint);
      if (cachedData) {
        setNftData(cachedData);
        return;
      }
    }

    // If no cached data, determine if we need to fetch data
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
        if (!cancelled && isMountedRef.current) {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
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
    // Check cache first
    if (nftDataCache.has(mint)) {
      const cachedData = nftDataCache.get(mint);
      if (isMountedRef.current) {
        setNftData(cachedData);
      }
      return;
    }

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
      // Cache the data
      nftDataCache.set(mint, data[0]);
      if (isMountedRef.current) {
        setNftData(data[0]);
      }
    } else {
      throw new Error('No data returned from Tensor');
    }
  };

  // Function to fetch collection data - updated to use find_collection endpoint
  const fetchCollectionData = async (collId: string) => {
    // Check cache first
    if (collectionDataCache.has(collId)) {
      const cachedData = collectionDataCache.get(collId);
      if (isMountedRef.current) {
        setCollectionData(cachedData);
      }
      return;
    }

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
      if (isMountedRef.current) {
        setCollectionData(data);
      }

      // Cache the data
      collectionDataCache.set(collId, data);

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
            const updatedData = {
              ...data,
              floorPrice: parseFloat(floorData.mints[0].listing.price) / 1_000_000_000
            };

            // Update cache with floor price
            collectionDataCache.set(collId, updatedData);

            if (isMountedRef.current) {
              setCollectionData(updatedData);
            }
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

  // console.log(collectionData, "/////////////////////")

  // Handle opening the NFT details drawer
  const handleOpenNftDetails = async () => {
    // Show loading indicator briefly
    setDrawerLoading(true);

    // If we need to fetch data, do so before showing the drawer
    if (!nftData && listingData?.mint) {
      try {
        await fetchNftData(listingData.mint);
      } catch (err) {
        console.error('Error fetching NFT data for drawer:', err);
      }
    }

    if (!collectionData && listingData?.isCollection && listingData?.collId) {
      try {
        await fetchCollectionData(listingData.collId);
      } catch (err) {
        console.error('Error fetching collection data for drawer:', err);
      }
    }

    // Short timeout to ensure smoother opening experience
    setTimeout(() => {
      setDrawerLoading(false);
      setShowNftDetailsDrawer(true);
    }, 300);
  };

  if (!listingData) {
    return <Text>[Missing listing data]</Text>;
  }

  function formatSolPrice(price: number | string | undefined) {
    if (!price) return null;
    const solPrice = typeof price === 'string' ?
      parseFloat(price) / 1_000_000_000 :
      price;
    return solPrice.toFixed(4);
  }

  function getNftImageSource(uri?: string) {
    if (!uri || typeof uri !== 'string') {
      return DEFAULT_IMAGES.user; // fallback
    }
    return { uri };
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
              <Text style={[styles.priceText, { color: '#32D4DE' }]}>
                Current Floor: <Text>{formatSolPrice(collectionData.floorPrice)}</Text> <Text>SOL</Text>
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
              Listed @ <Text>{formatSolPrice(nftData.listing.price)}</Text> <Text>SOL</Text>
            </Text>
          )}

          {nftData?.lastSale?.price && (
            <Text style={styles.lastSale}>
              Last sale: <Text>{formatSolPrice(nftData.lastSale.price)}</Text> <Text>SOL</Text>
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

  // Get the appropriate data for the drawer
  const getNftDetailsForDrawer = () => {
    if (listingData.isCollection) {
      return {
        mint: listingData.collId || '',
        symbol: '',
        name: listingData.collectionName || collectionData?.name || 'Collection',
        logoURI: listingData.image || collectionData?.imageUri || '',
        isCollection: true,
        collectionData: collectionData
      };
    } else {
      return {
        mint: listingData.mint || '',
        symbol: '',
        name: nftData?.name || listingData.name || 'NFT',
        logoURI: nftData?.imageUri || '',
        nftData: nftData
      };
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.7}
        onPress={handleOpenNftDetails}
      >
        <View style={styles.card}>
          {renderContent()}

          {error && (
            <Text style={{ color: 'red', marginTop: 8, fontSize: 12 }}>
              {error}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* NFT Details Drawer */}
      <TokenDetailsDrawer
        visible={showNftDetailsDrawer}
        onClose={() => setShowNftDetailsDrawer(false)}
        tokenMint={listingData.collId || listingData.mint || ''}
        initialData={getNftDetailsForDrawer()}
        loading={drawerLoading}
      />
    </>
  );
}

