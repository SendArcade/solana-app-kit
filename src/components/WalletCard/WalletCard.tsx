import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './WalletCard.style';
import Icons from '../../assets/svgs';

/**
 * Props for the WalletCard component
 * @interface WalletCardProps
 */
interface WalletCardProps {
    /** Current wallet balance in USD */
    balance: number;
    /** Price change in USD */
    priceChange: number;
    /** Percentage change in portfolio value */
    percentageChange: number;
    /** Callback fired when the swap button is pressed */
    onSwap?: () => void;
    /** Callback fired when the send button is pressed */
    onSend?: () => void;
    /** Callback fired when the on-ramp button is pressed */
    onRamp?: () => void;
}

/**
 * A component that displays wallet information and actions
 * 
 * @component
 * @description
 * WalletCard is a comprehensive wallet interface component that shows the user's
 * portfolio balance, price changes, and provides quick access to common wallet
 * actions like swapping tokens, sending funds, and on-ramping fiat currency.
 * 
 * Features:
 * - Displays current portfolio balance in USD
 * - Shows price change and percentage change
 * - Provides quick access buttons for Swap, Send, and On-Ramp actions
 * - Integrates with Mercuryo for fiat on-ramping
 * 
 * @example
 * ```tsx
 * <WalletCard
 *   balance={1234.56}
 *   priceChange={23.45}
 *   percentageChange={1.2}
 *   onSwap={() => handleSwap()}
 *   onSend={() => handleSend()}
 *   onRamp={() => handleOnRamp()}
 * />
 * ```
 */
export const WalletCard: React.FC<WalletCardProps> = ({
    balance, 
    priceChange,
    percentageChange,
    onSwap,
    onSend,
    onRamp
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.balanceSection}>
                <Text style={styles.balanceAmount}>
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.priceChangeRow}>
                    <Text style={styles.priceChangeText}>
                        +${priceChange.toFixed(8)}
                    </Text>
                    <View style={styles.percentageContainer}>
                        <Text style={styles.percentageText}>
                            +{percentageChange.toFixed(2)}%
                        </Text>
                    </View>
                </View>
                <Text style={styles.portfolioLabel}>Portfolio balance</Text>
            </View>

            <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onSwap}
                    activeOpacity={0.7}
                >
                    <View style={styles.buttonIconContainer}>
                        <Icons.SwapIcon width={24} height={24} />
                    </View>
                    <Text style={styles.buttonLabel}>Swap</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onSend}
                    activeOpacity={0.7}
                >
                    <View style={styles.buttonIconContainer}>
                        <Icons.Arrow width={24} height={24} />
                    </View>
                    <Text style={styles.buttonLabel}>Send</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onRamp}
                    activeOpacity={0.7}
                >
                    <View style={styles.buttonIconContainer}>
                        <Icons.Arrow width={24} height={24} />
                    </View>
                    <Text style={styles.buttonLabel}>On-Ramp</Text>
                    <Text style={styles.buttonSubLabel}>via mercuryo</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default WalletCard; 