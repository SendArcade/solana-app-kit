import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#999999',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
}); 