import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle
} from 'react-native';

interface ActionButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    fullWidth?: boolean;
}

/**
 * A reusable button component for PumpSwap actions
 * @component
 */
const ActionButton: React.FC<ActionButtonProps> = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    style,
    textStyle,
    fullWidth = true
}) => {
    // Determine button styles based on variant
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryButton;
            case 'outline':
                return styles.outlineButton;
            case 'danger':
                return styles.dangerButton;
            case 'primary':
            default:
                return styles.primaryButton;
        }
    };

    // Determine text styles based on variant
    const getTextStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineButtonText;
            case 'secondary':
            case 'primary':
            case 'danger':
            default:
                return styles.buttonText;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                fullWidth && styles.fullWidth,
                disabled && styles.disabledButton,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' ? '#6E56CF' : '#FFFFFF'}
                />
            ) : (
                <Text style={[getTextStyle(), textStyle, disabled && styles.disabledText]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 8,
    },
    fullWidth: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: '#6E56CF',
    },
    secondaryButton: {
        backgroundColor: '#64748B',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#6E56CF',
    },
    dangerButton: {
        backgroundColor: '#EF4444',
    },
    disabledButton: {
        backgroundColor: '#E2E8F0',
        borderColor: '#E2E8F0',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButtonText: {
        color: '#6E56CF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledText: {
        color: '#94A3B8',
    }
});

export default ActionButton; 