import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './WalletCard.style';
import Icons from '../../assets/svgs';

interface WalletCardProps {
    balance: number;
    priceChange: number;
    percentageChange: number;
    onSwap?: () => void;
    onSend?: () => void;
    onRamp?: () => void;
}

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