import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    PumpSwapCard,
    SwapSection,
    LiquidityAddSection,
    LiquidityRemoveSection,
    PoolCreationSection
} from '../components';

type TabType = 'swap' | 'addLiquidity' | 'removeLiquidity' | 'createPool';

/**
 * Main screen for the PumpSwap module with tabs for different functions
 * @component
 */
const PumpSwapScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('swap');
    const insets = useSafeAreaInsets();

    // Render the tab bar
    const renderTabBar = () => {
        const tabs: { key: TabType; label: string }[] = [
            { key: 'swap', label: 'Swap' },
            { key: 'addLiquidity', label: 'Add Liquidity' },
            { key: 'removeLiquidity', label: 'Remove Liquidity' },
            { key: 'createPool', label: 'Create Pool' },
        ];

        return (
            <View style={styles.tabBar}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text
                            style={[
                                styles.tabLabel,
                                activeTab === tab.key && styles.activeTabLabel,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // Render the active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'swap':
                return <SwapSection swapButtonLabel="Swap Tokens" />;
            case 'addLiquidity':
                return <LiquidityAddSection addLiquidityButtonLabel="Add Liquidity" />;
            case 'removeLiquidity':
                return <LiquidityRemoveSection removeLiquidityButtonLabel="Remove Liquidity" />;
            case 'createPool':
                return <PoolCreationSection createPoolButtonLabel="Create Pool" />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>PumpSwap</Text>
                        <Text style={styles.subtitle}>
                            Swap, provide liquidity, and create pools
                        </Text>
                    </View>

                    <PumpSwapCard>
                        {renderTabBar()}
                        <View style={styles.tabContent}>
                            {renderTabContent()}
                        </View>
                    </PumpSwapCard>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    activeTabLabel: {
        color: '#6E56CF',
        fontWeight: '600',
    },
    tabContent: {
        paddingTop: 8,
        paddingHorizontal: 4,
    },
});

export default PumpSwapScreen; 