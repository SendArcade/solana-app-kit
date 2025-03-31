import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import Icons from '../../../assets/svgs';
import { TransactionService } from '../../../services/transaction/transactionService';
import { useWallet } from '../../../hooks/useWallet';
import { buyCollectionFloor } from '../../../modules/nft';

interface NFTCollectionDrawerProps {
    visible: boolean;
    onClose: () => void;
    collection: {
        collId: string;
        name: string;
        image?: any;
        description?: string;
    };
}

const NFTCollectionDrawer: React.FC<NFTCollectionDrawerProps> = ({
    visible,
    onClose,
    collection,
}) => {
    console.log('NFTCollectionDrawer render, visible:', visible);

    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const { address, sendTransaction } = useWallet();
    const windowHeight = Dimensions.get('window').height;

    // Debug collection data without causing circular references
    console.log('NFTCollectionDrawer collection data:', {
        collId: collection?.collId,
        name: collection?.name,
        hasImage: !!collection?.image,
        imageType: collection?.image ? typeof collection.image : 'none',
        description: collection?.description,
    });

    // Safety check - if no collection is provided, don't render
    if (!collection) {
        console.error('NFTCollectionDrawer: No collection provided');
        return null;
    }

    // Ensure we have a minimum valid collection to show
    if (!collection.name) {
        console.warn('NFTCollectionDrawer: Collection missing name');
    }

    React.useEffect(() => {
        console.log('NFTCollectionDrawer mounted with collection:', collection.name);
        return () => console.log('NFTCollectionDrawer unmounted');
    }, []);

    React.useEffect(() => {
        console.log('NFTCollectionDrawer visibility changed to:', visible);
    }, [visible]);

    const handleBuyCollectionFloor = async () => {
        if (!collection.collId) {
            Alert.alert('Error', 'Collection ID not found');
            return;
        }

        if (!address) {
            Alert.alert('Error', 'Wallet not connected');
            return;
        }

        try {
            setLoading(true);
            setStatusMsg('Fetching collection floor...');

            const signature = await buyCollectionFloor(
                address,
                collection.collId,
                sendTransaction,
                status => setStatusMsg(status)
            );

            // Show success notification
            TransactionService.showSuccess(signature, 'nft');
            onClose();
        } catch (err: any) {
            console.error('Error during buy transaction:', err);
            TransactionService.showError(err);
        } finally {
            setLoading(false);
            setStatusMsg('');
        }
    };

    // Log when drawer is closed
    const handleClose = () => {
        console.log('NFTCollectionDrawer explicitly closed by user');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.drawerContainer, { maxHeight: windowHeight * 0.7 }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {collection.name && collection.name.length > 20 ?
                                `${collection.name.substring(0, 17)}...` :
                                collection.name}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Icons.cross width={24} height={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        <View style={styles.collectionInfo}>
                            {collection.image && (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={typeof collection.image === 'string'
                                            ? { uri: collection.image }
                                            : collection.image}
                                        style={styles.collectionImage}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}

                            <View style={styles.infoContainer}>
                                <Text style={styles.collectionName}>{collection.name}</Text>
                                {collection.description && (
                                    <Text style={styles.description}>{collection.description}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.buyButton}
                                onPress={handleBuyCollectionFloor}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buyButtonText}>Buy Collection Floor</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Loading Overlay */}
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#32D4DE" />
                                <Text style={styles.loadingText}>{statusMsg}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eaecef',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#14171a',
    },
    content: {
        padding: 16,
    },
    collectionInfo: {
        alignItems: 'center',
        marginVertical: 16,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    collectionImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },
    infoContainer: {
        alignItems: 'center',
    },
    collectionName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#657786',
        marginBottom: 16,
        lineHeight: 22,
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    buyButton: {
        backgroundColor: '#32D4DE',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    buyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 12,
        textAlign: 'center',
    },
});

export default NFTCollectionDrawer; 