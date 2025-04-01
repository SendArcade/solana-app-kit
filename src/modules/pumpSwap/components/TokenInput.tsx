import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { parseInputAmount } from '../utils/pumpSwapUtils';

interface TokenInfo {
    symbol: string;
    logo?: string;
    mint: string;
    decimals: number;
}

interface TokenInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    token: TokenInfo;
    onTokenSelect?: () => void;
    readOnly?: boolean;
    balance?: string;
    isLoading?: boolean;
    hasBorder?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
}

/**
 * A component for entering token amounts with token selection
 * @component
 */
const TokenInput: React.FC<TokenInputProps> = ({
    label,
    value,
    onChangeText,
    token,
    onTokenSelect,
    readOnly = false,
    balance,
    isLoading = false,
    hasBorder = true,
    autoFocus = false,
    placeholder = '0.00'
}) => {
    const [isFocused, setIsFocused] = useState(false);

    // Handle numeric input validation
    const handleTextChange = (text: string) => {
        // Only allow numeric input with decimal point
        const formattedText = parseInputAmount(text);
        onChangeText(formattedText);
    };

    // Handle max button click
    const handleMaxPress = () => {
        if (balance) {
            onChangeText(balance);
        }
    };

    return (
        <View style={[
            styles.container,
            hasBorder && styles.border,
            isFocused && styles.focused
        ]}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                {balance && (
                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Balance: </Text>
                        <Text style={styles.balanceValue}>{balance}</Text>
                        <TouchableOpacity
                            style={styles.maxButton}
                            onPress={handleMaxPress}
                        >
                            <Text style={styles.maxButtonText}>MAX</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={handleTextChange}
                    placeholder={placeholder}
                    placeholderTextColor="#AAAAAA"
                    keyboardType="decimal-pad"
                    editable={!readOnly}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus={autoFocus}
                />

                <TouchableOpacity
                    style={styles.tokenSelector}
                    onPress={onTokenSelect}
                    disabled={!onTokenSelect}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#6E56CF" />
                    ) : (
                        <>
                            {token.logo && (
                                <Image
                                    source={{ uri: token.logo }}
                                    style={styles.tokenIcon}
                                />
                            )}
                            <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                            {onTokenSelect && <Text style={styles.dropdownIcon}>▼</Text>}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        marginBottom: 12,
    },
    border: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    focused: {
        borderColor: '#6E56CF',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#94A3B8',
    },
    balanceValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    maxButton: {
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    maxButtonText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: '500',
        color: '#1E293B',
        padding: 0,
    },
    tokenSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
    },
    tokenIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
    tokenSymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    dropdownIcon: {
        fontSize: 10,
        marginLeft: 4,
        color: '#64748B',
    },
});

export default TokenInput; 