import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    TextInput,
    Dimensions,
    Alert,
    Pressable,
} from 'react-native';
import { NftItem } from '../../hooks/useFetchNFTs';
import Icons from '../../assets/svgs';
// import { TENSOR_API_KEY } from '@env';
import { Cluster, clusterApiUrl, Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { CLUSTER, HELIUS_RPC_URL, TENSOR_API_KEY } from '@env';
import { DEFAULT_IMAGES, ENDPOINTS } from '../../config/constants';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createRootPostAsync, addPostLocally } from '../../state/thread/reducer';
import { ThreadSection, ThreadSectionType, ThreadUser } from './thread.types';

// Constants
const SOL_TO_LAMPORTS = 1_000_000_000;

interface NftListingModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectListing: (item: NftItem) => void;
    listingItems: NftItem[];
    loadingListings: boolean;
    fetchNftsError: string | null;
    styles?: any; // Pass styles from parent component
}

// Get screen width to calculate image size (3 per row)
const { width } = Dimensions.get('window');
// Reduce size to avoid right column getting cut off
const ITEM_WIDTH = (width * 0.9 - 30) / 3; // Added more padding

interface CollectionResult {
    collId: string;
    name: string;
    description?: string;
    imageUri?: string;
}

interface FloorNFT {
    mint: string;
    owner: string;
    maxPrice: number;
}

/** Helper to fix IPFS/Arweave URLs */
const fixImageUrl = (url: any): string => {
    if (!url) return '';
    if (url.startsWith('ipfs://'))
        return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    if (url.startsWith('ar://'))
        return url.replace('ar://', 'https://arweave.net/');
    if (url.startsWith('/')) return `https://arweave.net${url}`;
    if (!url.startsWith('http') && !url.startsWith('data:'))
        return `https://${url}`;
    return url;
};

const NftListingModal = ({
    visible,
    onClose,
    onSelectListing,
    listingItems,
    loadingListings,
    fetchNftsError,
    styles,
}: NftListingModalProps) => {
    // Get wallet information for buy functionality
    const { solanaWallet } = useAuth();
    const userPublicKey = solanaWallet?.wallets?.[0]?.publicKey || null;
    const userWallet: any = solanaWallet;
    const dispatch = useAppDispatch();


    // Default to option 2 so that the current content shows up by default.
    const [selectedOption, setSelectedOption] = useState<number>(2);

    // Search functionality state
    const [collectionName, setCollectionName] = useState('');
    const [searchResults, setSearchResults] = useState<CollectionResult[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // Buy floor state
    const [selectedCollection, setSelectedCollection] = useState<CollectionResult | null>(null);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [floorNFT, setFloorNFT] = useState<FloorNFT | null>(null);
    const [loadingFloorNFT, setLoadingFloorNFT] = useState(false);
    const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
    const userName = useAppSelector(state => state.auth.username);

    // Use provided styles or fallback to default styles
    const modalStyles = defaultStyles;

    // Search collections functionality from BuySection.tsx
    const handleSearchCollections = async () => {
        if (!collectionName.trim()) return;
        setLoadingSearch(true);
        setSearchResults([]);
        try {
            const url = `https://api.mainnet.tensordev.io/api/v1/collections/search_collections?query=${encodeURIComponent(
                collectionName.trim(),
            )}`;
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'x-tensor-api-key': TENSOR_API_KEY,
                },
            };
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Failed to fetch collections: ${response.status}`);
            }
            const data = await response.json();
            if (data.collections && data.collections.length > 0) {
                const mapped: CollectionResult[] = data.collections.map((c: any) => ({
                    collId: c.collId,
                    name: c.name,
                    description: c.description || '',
                    imageUri: c.imageUri || '',
                }));
                console.log('Search results:', mapped);
                setSearchResults(mapped);
            } else {
                console.log('No collections found');
                setSearchResults([]);
            }
        } catch (err: any) {
            console.error('Error searching collections:', err);
            setSearchResults([]);
        } finally {
            setLoadingSearch(false);
        }
    };

    // Fetch floor NFT details for a collection - from BuySection.tsx
    const fetchFloorNFTForCollection = async (
        collId: string,
    ): Promise<FloorNFT | null> => {
        try {
            console.log(`Fetching floor NFT details for collection ${collId}...`);
            setLoadingFloorNFT(true);
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'x-tensor-api-key': TENSOR_API_KEY,
                },
            };
            const url = `https://api.mainnet.tensordev.io/api/v1/mint/collection?collId=${encodeURIComponent(
                collId,
            )}&sortBy=ListingPriceAsc&limit=1`;
            const resp = await fetch(url, options);
            console.log('Response from floor NFT API:', resp);
            if (!resp.ok) {
                throw new Error(`Failed to fetch collection mints: ${resp.status}`);
            }
            const data = await resp.json();
            console.log('Floor NFT data:', data);
            if (data.mints && data.mints.length > 0) {
                const floor = data.mints[0];
                if (floor && floor.mint && floor.listing) {
                    const owner = floor.listing.seller;
                    const maxPrice = parseFloat(floor.listing.price) / SOL_TO_LAMPORTS;
                    console.log(
                        `Floor NFT: mint=${floor.mint}, owner=${owner}, maxPrice=${maxPrice}`,
                    );
                    setFloorNFT({ mint: floor.mint, owner, maxPrice });
                    return { mint: floor.mint, owner, maxPrice };
                }
            }
            Alert.alert('Info', 'No tokens found for the collection floor.');
            return null;
        } catch (err: any) {
            console.error('Error fetching floor NFT:', err);
            Alert.alert('Error', err.message || 'Failed to fetch floor NFT');
            return null;
        } finally {
            setLoadingFloorNFT(false);
        }
    };

    const shareNftPurchase = async (
        floorNft: FloorNFT,
        collection: CollectionResult
    ) => {
        if (!userPublicKey) {
            Alert.alert('Error', 'Cannot share: Wallet not connected');
            return;
        }

        try {
            // Create the NFT listing section with proper type annotation
            const sections: ThreadSection[] = [
                {
                    id: 'section-' + Math.random().toString(36).substr(2, 9),
                    type: 'NFT_LISTING' as ThreadSectionType, // Use the proper enum type
                    listingData: {
                        mint: floorNft.mint,
                        owner: userPublicKey,
                        priceSol: floorNft.maxPrice,
                        name: collection.name,
                        image: fixImageUrl(collection.imageUri),
                    },
                    // Text should be in a separate section if you want to include it
                }
            ];

            // If you want to add a text section as well
            sections.push({
                id: 'section-' + Math.random().toString(36).substr(2, 9),
                type: 'TEXT_ONLY' as ThreadSectionType,
                text: `I just purchased ${collection.name} for ${floorNft.maxPrice.toFixed(5)} SOL! 🎉`
            });

            // Create a proper user object that satisfies ThreadUser
            const user: ThreadUser = {
                id: userPublicKey,
                username: userName || 'Anonymous', // Or get from auth state
                handle: userPublicKey
                    ? '@' + userPublicKey.slice(0, 6) + '...' + userPublicKey.slice(-4)
                    : '@anonymous', // Or get from auth state
                verified: true,
                avatar: storedProfilePic ? { uri: storedProfilePic } : DEFAULT_IMAGES.user,
            };

            // Create a fallback post with proper typing
            const fallbackPost = {
                id: 'local-' + Math.random().toString(36).substr(2, 9),
                userId: userPublicKey,
                user,
                sections,
                createdAt: new Date().toISOString(),
                replies: [],
                reactionCount: 0,
                retweetCount: 0,
                quoteCount: 0,
            };

            try {
                // Create a root post with the NFT listing
                await dispatch(
                    createRootPostAsync({
                        userId: userPublicKey,
                        sections,
                    })
                ).unwrap();

                Alert.alert('Success', 'Your NFT purchase has been shared!');
            } catch (error: any) {
                console.warn('Network request failed, adding post locally:', error.message);
                dispatch(addPostLocally(fallbackPost));
                Alert.alert('Limited Connectivity', 'Your post was saved locally.');
            }
        } catch (err: any) {
            console.error('Error sharing NFT purchase:', err);
            Alert.alert('Error', 'Failed to share your purchase. Please try again.');
        }
    };

    // Handle buy floor functionality - from BuySection.tsx
    const handleBuyFloor = async (coll: CollectionResult) => {
        console.log('Confirm Buy clicked for collection:', coll);
        if (!coll) return;
        const collId = coll.collId;
        // Use the floorNFT from state if available.
        const floorDetails = floorNFT
            ? floorNFT
            : await fetchFloorNFTForCollection(collId);
        if (!floorDetails) {
            console.log('No floor NFT to buy. Aborting.');
            return;
        }
        console.log('Proceeding to buy with floor NFT:', floorDetails);
        if (!userPublicKey || !userWallet) {
            Alert.alert('Error', 'Wallet not connected.');
            return;
        }
        try {
            const rpcUrl = ENDPOINTS.helius || clusterApiUrl(CLUSTER as Cluster);
            const connection = new Connection(rpcUrl, 'confirmed');
            const { blockhash } = await connection.getRecentBlockhash();
            const maxPriceInLamports = floorDetails.maxPrice * SOL_TO_LAMPORTS;
            console.log('Obtained blockhash:', blockhash);
            const buyUrl = `https://api.mainnet.tensordev.io/api/v1/tx/buy?buyer=${userPublicKey}&mint=${floorDetails.mint}&owner=${floorDetails.owner}&maxPrice=${maxPriceInLamports}&blockhash=${blockhash}`;
            console.log('Buy URL:', buyUrl);
            const resp = await fetch(buyUrl, {
                headers: { 'x-tensor-api-key': TENSOR_API_KEY },
            });
            const rawText = await resp.text();
            console.log('Raw response from buy endpoint:', rawText);
            let data: any;
            try {
                data = JSON.parse(rawText);
            } catch (parseErr) {
                throw new Error(
                    'Tensor returned non-JSON response. Check console for details.',
                );
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
                const provider = await userWallet.getProvider();
                const { signature } = await provider.request({
                    method: 'signAndSendTransaction',
                    params: { transaction, connection },
                });
                console.log(`Transaction #${i + 1} signature: ${signature}`);
            }
            Alert.alert(
                'Success',
                'Floor NFT purchased successfully!',
                [
                    {
                        text: 'Share Purchase',
                        onPress: () => shareNftPurchase(floorDetails, coll)
                    },
                    {
                        text: 'Close',
                        style: 'cancel'
                    },
                ]
            );
        } catch (err: any) {
            console.error('Error during buy transaction:', err);
            Alert.alert('Error', err.message || 'Failed to buy floor NFT.');
        } finally {
            setShowBuyModal(false);
            setSelectedCollection(null);
            setFloorNFT(null);
        }
    };

    // Render a grid item (just the image)
    const renderGridItem = ({ item }: { item: CollectionResult }) => {
        return (
            <TouchableOpacity
                style={modalStyles.gridItem}
                onPress={async () => {
                    console.log('Collection selected:', item);
                    setSelectedCollection(item);
                    // Immediately fetch floor NFT details and store in state
                    await fetchFloorNFTForCollection(item.collId);
                    setShowBuyModal(true);
                }}>
                <Image
                    source={{ uri: fixImageUrl(item.imageUri) }}
                    style={modalStyles.gridImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    };

    // Buy Modal UI - from BuySection.tsx
    const renderBuyModal = () => {
        if (!selectedCollection) return null;
        return (
            <Modal
                visible={showBuyModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowBuyModal(false);
                    setSelectedCollection(null);
                    setFloorNFT(null);
                }}>
                <Pressable
                    style={modalStyles.buyModalOverlay}
                    onPress={() => {
                        setShowBuyModal(false);
                        setSelectedCollection(null);
                        setFloorNFT(null);
                    }}>
                    <Pressable
                        style={modalStyles.buyModalContent}
                        onPress={e => e.stopPropagation()}>
                        <Text style={modalStyles.buyModalTitle}>Confirm Purchase</Text>
                        <Text style={modalStyles.buyModalText}>
                            Collection: {selectedCollection.name}
                        </Text>
                        {loadingFloorNFT ? (
                            <ActivityIndicator size="small" color="#32D4DE" />
                        ) : floorNFT ? (
                            <Text style={modalStyles.buyModalText}>
                                Price: {floorNFT.maxPrice.toFixed(5)} SOL
                            </Text>
                        ) : (
                            <Text style={modalStyles.buyModalText}>Price: Loading...</Text>
                        )}
                        <TouchableOpacity
                            style={modalStyles.confirmButton}
                            onPress={() => {
                                console.log('Confirm Buy clicked');
                                handleBuyFloor(selectedCollection);
                            }}>
                            <Text style={modalStyles.confirmButtonText}>Confirm Buy</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}>
            <View style={modalStyles.modalOverlay}>
                <View style={modalStyles.modalContainer}>
                    {selectedOption === 2 ? (
                        // Simple header for nftListing
                        <Text style={modalStyles.modalTitle}>NFT Listing</Text>
                    ) : (
                        // Complex header for tensor with cross, search bar, and arrow
                        <View style={modalStyles.tensorHeader}>
                            <TouchableOpacity onPress={onClose} style={modalStyles.headerButton}>
                                <Icons.cross width={24} height={24} />
                            </TouchableOpacity>

                            <View style={modalStyles.searchContainer}>
                                <TextInput
                                    style={modalStyles.searchInput}
                                    placeholder="Search collections..."
                                    placeholderTextColor="#999"
                                    value={collectionName}
                                    onChangeText={setCollectionName}
                                    onSubmitEditing={handleSearchCollections}
                                />
                            </View>

                            <TouchableOpacity
                                style={modalStyles.headerButton}
                                onPress={handleSearchCollections}>
                                <Icons.arrowRIght width={20} height={20} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectedOption === 2 ? (
                        <>
                            {loadingListings ? (
                                <ActivityIndicator
                                    size="large"
                                    color="#1d9bf0"
                                    style={{ marginTop: 20 }}
                                />
                            ) : fetchNftsError ? (
                                <Text
                                    style={{
                                        marginTop: 16,
                                        color: '#666',
                                        textAlign: 'center',
                                    }}>
                                    {fetchNftsError}
                                </Text>
                            ) : listingItems.length === 0 ? (
                                <Text
                                    style={{
                                        marginTop: 16,
                                        color: '#666',
                                        textAlign: 'center',
                                    }}>
                                    No NFTs found.
                                </Text>
                            ) : (
                                <>
                                    <FlatList
                                        data={listingItems}
                                        keyExtractor={item => item.mint}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={modalStyles.listingCard}
                                                onPress={() => onSelectListing(item)}>
                                                {/* Add a container with relative positioning to hold the image and badge */}
                                                <View style={modalStyles.imageContainer}>
                                                    <Image
                                                        source={{ uri: item.image }}
                                                        style={modalStyles.listingImage}
                                                    />
                                                    {/* Add the compressed NFT badge if applicable */}
                                                    {item.isCompressed && (
                                                        <View style={modalStyles.compressedBadge}>
                                                            <Text style={modalStyles.compressedBadgeText}>
                                                                cNFT
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text
                                                        style={modalStyles.listingName}
                                                        numberOfLines={1}>
                                                        {item.name}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        style={{ marginTop: 10, width: '100%' }}
                                    />
                                    <Text style={modalStyles.disclaimerText}>
                                        Note: Only NFTs with a valid mint ID are displayed.
                                    </Text>
                                </>
                            )}
                        </>
                    ) : (
                        // Tensor Search Results - maintain fixed height with contentContainer
                        <View style={modalStyles.tensorContent}>
                            {loadingSearch ? (
                                <View style={modalStyles.loaderContainer}>
                                    <ActivityIndicator size="small" color="#1d9bf0" />
                                    <Text style={modalStyles.loaderText}>Searching collections...</Text>
                                </View>
                            ) : searchResults.length > 0 ? (
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={item => item.collId}
                                    renderItem={renderGridItem}
                                    numColumns={3}
                                    columnWrapperStyle={modalStyles.gridRow}
                                />
                            ) : (
                                <View style={modalStyles.emptyResultsContainer}>
                                    <Text style={modalStyles.emptyText}>
                                        {collectionName.trim()
                                            ? 'No collections found. Try a different search.'
                                            : 'Search for collections above to see results here.'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Footer with two options */}
                    <View style={modalStyles.footer}>
                        <TouchableOpacity
                            style={[
                                modalStyles.optionButton,
                                selectedOption === 1 && modalStyles.selectedOption
                            ]}
                            onPress={() => setSelectedOption(1)}>
                            <Icons.tensor width={26} height={26} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                modalStyles.optionButton,
                                selectedOption === 2 && modalStyles.selectedOption
                            ]}
                            onPress={() => setSelectedOption(2)}>
                            <Icons.listedNft width={26} height={26} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Buy confirmation modal */}
            {renderBuyModal()}
        </Modal>
    );
};

const defaultStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 4,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: 10,
    },
    listingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        width: '100%',
    },
    listingImage: {
        width: 50,
        height: 50,
        borderRadius: 5,
    },
    listingName: {
        fontWeight: '600',
    },
    // Tensor content area with fixed height
    tensorContent: {
        width: '100%',
        height: 300, // Fixed height to keep modal size consistent
        marginBottom: 10,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: '#666',
    },
    emptyResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
    },
    // Grid styles for search results
    gridRow: {
        justifyContent: 'space-between',
        width: '100%',
        padding: 2,
    },
    imageContainer: {
        position: 'relative', // To position the badge absolutely within
    },
    compressedBadge: {
        position: 'absolute',
        top: 2,
        left: 2,
        backgroundColor: '#FF4500',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    compressedBadgeText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    },
    disclaimerText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 5,
        paddingHorizontal: 15,
        fontStyle: 'italic',
    },
    gridItem: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        margin: 1,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0', // Background color if image fails to load
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center', // Center the icons
        width: '100%',
        paddingVertical: 5,
        // Removed the border between footer and listing
    },
    optionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 20, // Add horizontal margin between icons
    },
    selectedOption: {
        backgroundColor: '#f0f0f0',
    },
    tensorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 10,
        marginBottom: 10,
    },
    headerButton: {
        padding: 8,
    },
    searchContainer: {
        flex: 1,
        marginHorizontal: 10,
    },
    searchInput: {
        backgroundColor: '#f0f0f0',
        borderRadius: 14,
        paddingHorizontal: 15,
        paddingVertical: 8,
        fontSize: 14,
    },
    // Buy modal styles
    buyModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyModalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    buyModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    buyModalText: {
        fontSize: 16,
        marginVertical: 5,
        textAlign: 'center',
    },
    confirmButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#32D4DE',
        borderRadius: 20,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default NftListingModal;

