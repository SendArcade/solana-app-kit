import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useDevMode } from '../../context/DevModeContext';
import { useEnvError } from '../../context/EnvErrorContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigationRef} from '../../shared/hooks/useAppNavigation';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { RootState } from '../../shared/state/store';
// Import specific environment variables needed for the frontend
import {
    PRIVY_APP_ID,
    PRIVY_CLIENT_ID,
    CLUSTER,
    TURNKEY_BASE_URL,
    TURNKEY_RP_ID,
    TURNKEY_RP_NAME,
    TURNKEY_ORGANIZATION_ID,
    DYNAMIC_ENVIRONMENT_ID,
    HELIUS_API_KEY,
    HELIUS_RPC_CLUSTER,
    SERVER_URL,
    TENSOR_API_KEY,
    PARA_API_KEY,
    COINGECKO_API_KEY,
    BIRDEYE_API_KEY,
    HELIUS_STAKED_URL,
    HELIUS_STAKED_API_KEY
} from '@env';

// Sample dummy data for profile and posts
const DUMMY_USER = {
    userId: 'demo-user-123',
    username: 'satoshi_nakamoto',
    displayName: 'Satoshi Nakamoto',
    bio: 'Creator of a decentralized digital currency that operates without a central authority.',
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1429234352611897345/HJ-TzEE3_400x400.jpg',
    coverImageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d',
    followerCount: 1287000,
    followingCount: 42,
    isVerified: true,
    walletAddress: '8ZUdizNr7cjWcEPAfSB7pHfwRfCJ4iR23yMrpuVXaJLD'
};

const DUMMY_POST = {
    postId: 'post-456-abc',
    content: 'Just deployed a new contract on Solana! Check out the blazing fast speeds at just $0.0001 per transaction!',
    imageUrl: 'https://images.unsplash.com/photo-1639762681057-408e52192e55',
    timestamp: new Date().getTime() - 3600000, // 1 hour ago
    likeCount: 2431,
    commentCount: 248,
    user: DUMMY_USER,
    isLiked: false,
    hashtags: ['#solana', '#blockchain', '#crypto'],
    transactionHash: '4vJ6p8onCZeUQBPJqrXXGJRSkLTdYvPTL9zGwDdvwSbEeKJdf6C4MQhTccCrxP8ZbpWJkzhGQhFVmUG3Qgpj8j7y'
};

// Screen nodes for the visual tree map
const SCREEN_NODES = [
    // Main nav - this is the root node
    {
        id: 'bottomNav',
        label: 'Bottom Navigation',
        type: 'root',
        route: null,
        params: {},
        children: ['modules', 'feed', 'search', 'profile', 'otherScreens']
    },

    // Other Screens
    {
        id: 'otherScreens',
        label: 'Other Screens',
        type: 'category',
        route: null,
        params: {},
        children: ['thread', 'otherProfile']
    },

    // Main level nodes
    {
        id: 'modules',
        label: 'Modules',
        type: 'category',
        route: 'MainTabs',
        params: { screen: 'Modules' },
        children: ['pumpFun', 'pumpSwap', 'tokenMill', 'nft', 'mercuro']
    },
    {
        id: 'feed',
        label: 'Feed',
        type: 'screen',
        route: 'MainTabs',
        params: { screen: 'Feed' },
        children: ['chat']
    },
    {
        id: 'search',
        label: 'Search',
        type: 'screen',
        route: 'MainTabs',
        params: { screen: 'Search' },
        children: []
    },
    {
        id: 'profile',
        label: 'Profile',
        type: 'screen',
        route: 'ProfileScreen',
        params: {},
        children: []
    },

    // Feed children
    {
        id: 'chat',
        label: 'Chat Screen',
        type: 'screen',
        route: 'ChatScreen',
        params: {},
        children: []
    },

    // Other screens children
    {
        id: 'thread',
        label: 'Thread Screen',
        type: 'screen',
        route: 'MainTabs',
        params: {},
        children: []
    },
    {
        id: 'otherProfile',
        label: 'Other Profile Screen',
        type: 'screen',
        route: 'OtherProfile',
        params: {
            userId: DUMMY_USER.userId,
            username: DUMMY_USER.username,
            displayName: DUMMY_USER.displayName,
            bio: DUMMY_USER.bio,
            profileImage: DUMMY_USER.profileImageUrl,
            followerCount: DUMMY_USER.followerCount,
            followingCount: DUMMY_USER.followingCount,
            isVerified: DUMMY_USER.isVerified
        },
        children: []
    },

    // Modules' children
    {
        id: 'pumpFun',
        label: 'Pump Fun',
        type: 'screen',
        route: 'Pumpfun',
        params: {},
        children: []
    },
    {
        id: 'pumpSwap',
        label: 'Pump Swap',
        type: 'screen',
        route: 'PumpSwap',
        params: {},
        children: []
    },
    {
        id: 'tokenMill',
        label: 'Token Mill',
        type: 'screen',
        route: 'TokenMill',
        params: {},
        children: []
    },
    {
        id: 'nft',
        label: 'NFT Screen',
        type: 'screen',
        route: 'NftScreen',
        params: {},
        children: []
    },
    {
        id: 'mercuro',
        label: 'Mercuro Onramp/Offramp',
        type: 'screen',
        route: 'MercuroScreen',
        params: {},
        children: []
    }
];

type RouteNames = string;

// Navigation Map Component - Redesigned to be more modern and sleek
const AppNavigationMap = ({ onScreenSelect }: { onScreenSelect: (route: RouteNames, params: Record<string, unknown>) => void }) => {
    // Track which sections are expanded
    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
        bottomNav: true,
        modules: false,
        feed: false,
        otherScreens: false
    });

    // Toggle a section's expanded state
    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Modern node component for the navigation map
    const NavNode = ({
        id,
        indentLevel = 0,
        isChild = false
    }: {
        id: string,
        indentLevel?: number,
        isChild?: boolean
    }) => {
        const node = SCREEN_NODES.find(n => n.id === id);
        if (!node) return null;

        const nodeType = node.type;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedSections[id];

        // Icons for different types of nodes
        const getNodeIcon = () => {
            if (nodeType === 'root') return '•••';
            if (nodeType === 'category') return '•';
            return '→';
        };

        return (
            <View style={{ marginBottom: isChild ? 6 : 4 }}>
                <TouchableOpacity
                    style={[
                        styles.navMapNode,
                        { marginLeft: indentLevel * 16 },
                        nodeType === 'root' ? styles.rootNode :
                            nodeType === 'category' ? styles.categoryNode :
                                styles.screenNode
                    ]}
                    onPress={() => {
                        if (hasChildren) {
                            toggleSection(id);
                        } else if (node.route) {
                            onScreenSelect(node.route, node.params);
                        }
                    }}
                >
                    <View style={styles.nodeContent}>
                        {hasChildren && (
                            <Text style={[
                                styles.nodeArrow,
                                nodeType === 'root' ? styles.rootText :
                                    nodeType === 'category' ? styles.categoryText :
                                        styles.screenText
                            ]}>
                                {isExpanded ? '−' : '+'}
                            </Text>
                        )}

                        <Text style={[
                            styles.nodeLabel,
                            nodeType === 'root' ? styles.rootText :
                                nodeType === 'category' ? styles.categoryText :
                                    styles.screenText
                        ]}>
                            {node.label}
                        </Text>
                    </View>

                    {node.route && (
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => onScreenSelect(node.route, node.params)}
                        >
                            <Text style={styles.navButtonText}>Open</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                {/* Render children when section is expanded with connecting lines */}
                {hasChildren && isExpanded && (
                    <View style={styles.childrenContainer}>
                        {node.children.map(childId => (
                            <NavNode
                                key={childId}
                                id={childId}
                                indentLevel={indentLevel + 1}
                                isChild={true}
                            />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.navigationMapContainer}>
            <NavNode id="bottomNav" />
        </View>
    );
};

// Component to display missing environment variables
const MissingEnvVars = () => {
    const { hasMissingEnvVars, missingEnvVars, toggleErrorModal } = useEnvError();

    if (!hasMissingEnvVars) {
        return (
            <View style={styles.envContainer}>
                <Text style={styles.envTitle}>Environment Variables</Text>
                <Text style={styles.envComplete}>All environment variables are set correctly.</Text>
            </View>
        );
    }

    return (
        <View style={styles.envContainer}>
            <Text style={styles.envTitle}>Environment Variables</Text>
            <Text style={styles.envDescription}>
                The following environment variables are missing. The app can continue in dev mode,
                but certain features may not work correctly.
            </Text>
            {missingEnvVars.slice(0, 5).map((varName) => (
                <View key={varName} style={styles.envVarItem}>
                    <Text style={styles.envVarName}>{varName}</Text>
                </View>
            ))}

            {missingEnvVars.length > 5 && (
                <Text style={styles.moreVarsText}>
                    + {missingEnvVars.length - 5} more...
                </Text>
            )}

            <Text style={styles.envHelper}>
                To fix this, add these variables to your .env.local file.
            </Text>
        </View>
    );
};

const DevDrawer = () => {
    const { isDevDrawerOpen, toggleDevDrawer } = useDevMode();
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

    // Bypass authentication for dev mode
    const bypassAuth = () => {
        if (!isLoggedIn) {
            // Force login with dummy data
            dispatch({
                type: 'auth/loginSuccess',
                payload: {
                    provider: 'mwa',
                    address: DUMMY_USER.walletAddress,
                    profilePicUrl: DUMMY_USER.profileImageUrl,
                    username: DUMMY_USER.username,
                    description: DUMMY_USER.bio
                }
            });
            console.log('Dev mode: Authentication bypassed');
            return true;
        }
        return false;
    };

    const navigateToScreen = (route: RouteNames, params: Record<string, unknown> = {}) => {
        try {
            if (!route) return; // Skip navigation for category nodes

            // First close the drawer
            toggleDevDrawer();

            // Bypass authentication in dev mode
            const didBypass = bypassAuth();

            // Then navigate to the selected screen
            // We use a small timeout to ensure the drawer closing animation completes
            // and auth state updates if needed
            setTimeout(() => {
                if (navigationRef.isReady()) {
                    const nav = navigationRef.current;

                    // If we bypassed auth, we need more time for the auth state to update
                    // before attempting navigation
                    const navigationDelay = didBypass ? 500 : 100;

                    setTimeout(() => {
                        try {
                            if (nav) {
                                // Handle nested navigation
                                if (typeof params.screen === 'string') {
                                    nav.navigate(route as any, params as any);
                                } else {
                                    nav.navigate(route as any, params as any);
                                }
                                console.log(`Navigated to ${route} with params`, params);
                            }
                        } catch (navError) {
                            console.error('Inner navigation error:', navError);
                            alert(`Failed to navigate to ${route}`);
                        }
                    }, navigationDelay);
                } else {
                    console.error('Navigation is not ready');
                    alert('Navigation is not ready. Try again in a moment.');
                }
            }, 100);
        } catch (error: unknown) {
            console.error('Navigation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to navigate to ${route}. Error: ${errorMessage}`);
        }
    };

    if (!isDevDrawerOpen) return null;

    return (
        <View style={styles.overlay}>
            <TouchableOpacity
                style={styles.backdrop}
                onPress={toggleDevDrawer}
                activeOpacity={1}
            />
            <SafeAreaView style={styles.drawerContainer} edges={['bottom', 'left', 'right']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Developer Tools</Text>
                    <TouchableOpacity
                        style={styles.closeButtonContainer}
                        onPress={toggleDevDrawer}
                    >
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.content}>
                    {/* Show missing environment variables */}
                    <MissingEnvVars />

                    <View style={styles.navigationMapContainer}>
                        <Text style={styles.mapTitle}>App Navigation</Text>
                        <Text style={styles.mapDescription}>
                            Use this map to navigate directly to different screens in the app
                            without having to go through the normal flow.
                        </Text>
                        <AppNavigationMap onScreenSelect={navigateToScreen} />
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Developer Info</Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Environment:</Text>
                            <Text style={styles.infoValue}>Development</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>App Version:</Text>
                            <Text style={styles.infoValue}>
                                {(process.env as any).npm_package_version || '0.1.0'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Login Status:</Text>
                            <Text style={[styles.infoValue, { color: isLoggedIn ? '#34C759' : '#FF9500' }]}>
                                {isLoggedIn ? 'Logged In' : 'Not Logged In'}
                            </Text>
                        </View>
                    </View>

                    {!isLoggedIn && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={bypassAuth}
                        >
                            <Text style={styles.actionButtonText}>Force Login (For Testing)</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: Dimensions.get('window').height * 0.9,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    closeButtonContainer: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(0,122,255,0.1)',
    },
    closeButton: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    navigationMapContainer: {
        marginBottom: 5,
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        color: '#000',
    },
    mapDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    navMapNode: {
        marginVertical: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rootNode: {
        backgroundColor: '#F5F5F7',
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    categoryNode: {
        backgroundColor: '#F5F5F7',
        borderLeftWidth: 3,
        borderLeftColor: '#FF9500',
    },
    screenNode: {
        backgroundColor: '#F5F5F7',
        borderLeftWidth: 3,
        borderLeftColor: '#32D74B',
    },
    rootText: {
        color: '#007AFF',
    },
    categoryText: {
        color: '#FF9500',
    },
    screenText: {
        color: '#32D74B',
    },
    nodeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    nodeArrow: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: '600',
    },
    nodeLabel: {
        fontWeight: '500',
        fontSize: 15,
    },
    navButton: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    navButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    childrenContainer: {
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    actionButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    envContainer: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    envTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        color: '#000',
    },
    envDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 18,
    },
    envComplete: {
        fontSize: 14,
        color: '#34C759',
        fontWeight: '500',
    },
    envVarItem: {
        backgroundColor: 'rgba(255,76,76,0.1)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ff4c4c',
    },
    envVarName: {
        fontWeight: '600',
        color: '#ff4c4c',
    },
    envHelper: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    moreVarsText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        marginVertical: 8,
    }
});

export default DevDrawer;
