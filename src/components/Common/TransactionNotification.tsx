import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Easing,
    Dimensions,
    Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../state/store';
import {
    clearNotification,
    showSuccessNotification,
    showErrorNotification
} from '../../state/notification/reducer';

const { width } = Dimensions.get('window');

/**
 * A component that displays transaction success and error notifications as an animated bottom drawer
 */
const TransactionNotification = () => {
    const dispatch = useDispatch();
    const { visible, message, type } = useSelector(
        (state: RootState) => state.notification
    );

    // Animation for sliding up/down
    const slideAnim = useRef(new Animated.Value(100)).current;
    // Animation for opacity
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show the notification
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                hideNotification();
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            // Reset animation values when hidden
            slideAnim.setValue(100);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const hideNotification = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 100,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            dispatch(clearNotification());
        });
    };

    // If not visible, don't render
    if (!visible || !message) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}>
            <View style={[
                styles.notification,
                type === 'success' ? styles.successNotification : styles.errorNotification,
            ]}>
                <View style={styles.content}>
                    <Text style={styles.title}>{type === 'success' ? 'Success' : 'Error'}</Text>
                    <Text style={styles.message}>{message}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={hideNotification}>
                    <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 50 : 30,
        width: width,
        zIndex: 999,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    notification: {
        flexDirection: 'row',
        width: '100%',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    successNotification: {
        backgroundColor: '#E7F8F0',
        borderLeftWidth: 5,
        borderLeftColor: '#34C759',
    },
    errorNotification: {
        backgroundColor: '#FFF0F0',
        borderLeftWidth: 5,
        borderLeftColor: '#FF3B30',
    },
    content: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 5,
    },
    message: {
        color: '#333',
        fontSize: 14,
    },
    closeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
        height: 24,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#999',
        lineHeight: 24,
    },
});

export default TransactionNotification; 