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
import { TENSOR_API_KEY } from '@env';
import { DEFAULT_IMAGES } from '../../config/constants';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createRootPostAsync, addPostLocally } from '../../state/thread/reducer';
import { ThreadSection, ThreadSectionType, ThreadUser } from './thread.types';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TransactionService } from '../../services/transaction/transactionService';

// Constants
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width * 0.9 - 30) / 3; // Added more padding

interface NftListingModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectListing: (item: NftItem) => void;
    listingItems: NftItem[];
    loadingListings: boolean;
    fetchNftsError: string | null;
    styles?: any; // Pass styles from parent component
}

interface CollectionResult {
    collId: string;
    name: string;
    description?: string;
    imageUri?: string;
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
    // Use the wallet hook instead of directly using useAuth
    const { wallet, address, publicKey, sendTransaction } = useWallet();
    const userPublicKey = address || null;
    const dispatch = useAppDispatch();

    // Default to option 2 so that the current content shows up by default.
    const [selectedOption, setSelectedOption] = useState<number>(2);

    // Search functionality state
    const [collectionName, setCollectionName] = useState('');
    const [searchResults, setSearchResults] = useState<CollectionResult[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [isSendingTransaction, setIsSendingTransaction] = useState(false);

    // Share NFT state
    const [selectedCollection, setSelectedCollection] = useState<CollectionResult | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
    const userName = useAppSelector(state => state.auth.username);

    // Use provided styles or fallback to default styles
    const modalStyles = defaultStyles;

    // Search collections functionality
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

    // Function to send a transaction for NFT operations (example)
    const handleNftTransaction = async (nftItem: NftItem) => {
        if (!publicKey) {
            Alert.alert('Error', 'Wallet not connected');
            return;
        }

        try {
            setIsSendingTransaction(true);

            // Example transaction - this would be replaced with actual NFT transaction logic
            // For example: transferring NFT, listing NFT for sale, etc.
            const connection = new Connection('https://api.mainnet-beta.solana.com');
            const transaction = new Transaction();

            // Here you would add the appropriate instructions for NFT operations
            // For example:
            // transaction.add(
            //   createTransferInstruction(
            //     new PublicKey(nftItem.mint),
            //     publicKey,
            //     new PublicKey(recipientAddress),
            //     publicKey,
            //     1
            //   )
            // );

            // Using the new wallet transaction method
            const signature = await sendTransaction(
                transaction,
                connection,
                {
                    confirmTransaction: true,
                    statusCallback: (status) => {
                        // Filter out error messages from status updates
                        if (!status.startsWith('Error:') && !status.includes('failed')) {
                            console.log(`Transaction status: ${status}`);
                        } else {
                            console.log(`Transaction processing...`);
                        }
                    }
                }
            );

            console.log('Transaction sent with signature:', signature);
            TransactionService.showSuccess(signature, 'nft');

        } catch (error: any) {
            console.error('Error sending transaction:', error);
            TransactionService.showError(error);
        } finally {
            setIsSendingTransaction(false);
        }
    };

    // Share NFT collection to feed
    const shareNftCollection = async (collection: CollectionResult) => {
        if (!userPublicKey) {
            Alert.alert('Error', 'Cannot share: Wallet not connected');
            return;
        }

        try {
            // Create the NFT listing section with collection data
            const sections: ThreadSection[] = [
                {
                    id: 'section-' + Math.random().toString(36).substr(2, 9),
                    type: 'NFT_LISTING' as ThreadSectionType,
                    listingData: {
                        collId: collection.collId,
                        owner: userPublicKey,
                        name: collection.name,
                        image: fixImageUrl(collection.imageUri),
                        isCollection: true,
                        collectionName: collection.name,
                        collectionImage: fixImageUrl(collection.imageUri),
                        collectionDescription: collection.description
                    },
                }
            ];

            // Add a text section about the collection
            sections.push({
                id: 'section-' + Math.random().toString(36).substr(2, 9),
                type: 'TEXT_ONLY' as ThreadSectionType,
                text: `Check out this awesome collection: ${collection.name}! 🔥`
            });

            // Create a proper user object that satisfies ThreadUser
            const user: ThreadUser = {
                id: userPublicKey,
                username: userName || 'Anonymous',
                handle: userPublicKey
                    ? '@' + userPublicKey.slice(0, 6) + '...' + userPublicKey.slice(-4)
                    : '@anonymous',
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

                TransactionService.showSuccess('post_created', 'nft');
            } catch (error: any) {
                console.warn('Network request failed, adding post locally:', error.message);
                dispatch(addPostLocally(fallbackPost));
                Alert.alert('Limited Connectivity', 'Your post was saved locally.');
            }
        } catch (err: any) {
            console.error('Error sharing collection:', err);
            TransactionService.showError(err);
        } finally {
            setShowShareModal(false);
            setSelectedCollection(null);
        }
    };

    // Render a grid item (just the image)
    const renderGridItem = ({ item }: { item: CollectionResult }) => {
        return (
            <TouchableOpacity
                style={modalStyles.gridItem}
                onPress={() => {
                    console.log('Collection selected:', item);
                    setSelectedCollection(item);
                    setShowShareModal(true);
                }}>
                <Image
                    source={{ uri: fixImageUrl(item.imageUri) }}
                    style={modalStyles.gridImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    };

    // Share Modal UI
    const renderShareModal = () => {
        if (!selectedCollection) return null;
        return (
            <Modal
                visible={showShareModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowShareModal(false);
                    setSelectedCollection(null);
                }}>
                <Pressable
                    style={modalStyles.shareModalOverlay}
                    onPress={() => {
                        setShowShareModal(false);
                        setSelectedCollection(null);
                    }}>
                    <Pressable
                        style={modalStyles.shareModalContent}
                        onPress={e => e.stopPropagation()}>
                        <Text style={modalStyles.shareModalTitle}>Share Collection</Text>
                        <Text style={modalStyles.shareModalText}>
                            Collection: {selectedCollection.name}
                        </Text>
                        <Image
                            source={{ uri: fixImageUrl(selectedCollection.imageUri) }}
                            style={modalStyles.shareModalImage}
                            resizeMode="cover"
                        />
                        <Text style={modalStyles.shareModalDescription} numberOfLines={3}>
                            {selectedCollection.description || "No description available"}
                        </Text>
                        <TouchableOpacity
                            style={modalStyles.shareButton}
                            onPress={() => {
                                shareNftCollection(selectedCollection);
                            }}>
                            <Text style={modalStyles.shareButtonText}>Share to Feed</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    };

    // Modified render for NFT listing items to include transaction option
    const renderNftItem = ({ item }: { item: NftItem }) => (
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

            {/* Transaction button for NFT operations */}
            <TouchableOpacity
                style={modalStyles.actionButton}
                onPress={() => handleNftTransaction(item)}
                disabled={isSendingTransaction}>
                {isSendingTransaction ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={modalStyles.actionButtonText}>Transfer</Text>
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );

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
                                        renderItem={renderNftItem}
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

            {/* Share confirmation modal */}
            {renderShareModal()}
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
    // Share modal styles
    shareModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareModalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    shareModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    shareModalText: {
        fontSize: 16,
        marginVertical: 5,
        textAlign: 'center',
    },
    shareModalImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginVertical: 10,
    },
    shareModalDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginVertical: 5,
        paddingHorizontal: 10,
    },
    shareButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#32D4DE',
        borderRadius: 20,
    },
    shareButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Add styles for the new action button
    actionButton: {
        backgroundColor: '#32D4DE',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NftListingModal;
