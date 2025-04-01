import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PumpSwapCardProps } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A card container for PumpSwap sections
 * @component
 */
const PumpSwapCard: React.FC<PumpSwapCardProps> = ({
    children,
    containerStyle
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
                containerStyle
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default PumpSwapCard; 