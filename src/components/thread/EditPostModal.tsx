import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator
} from 'react-native';
import { ThreadPost, ThreadSection } from './thread.types';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { updatePostAsync } from '../../state/thread/reducer';

interface EditPostModalProps {
    isVisible: boolean;
    onClose: () => void;
    post: ThreadPost;
}

const EditPostModal = ({ isVisible, onClose, post }: EditPostModalProps) => {
    const dispatch = useAppDispatch();
    const [sections, setSections] = useState<ThreadSection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize sections from post when modal opens
    useEffect(() => {
        if (post && post.sections) {
            // Deep copy to avoid mutating the original post
            setSections([...post.sections]);
        }
    }, [post]);

    // Update section text 
    const updateSectionText = (index: number, text: string) => {
        const updatedSections = [...sections];

        // Find the section in our filtered list
        const sectionToUpdate = getUniqueEditableSections()[index];
        const sectionType = sectionToUpdate.type;
        const sectionToUpdateId = sectionToUpdate.id || '';

        // Update all instances of this section in the original array
        sections.forEach((section, i) => {
            // For TEXT_IMAGE, update all sections of this type
            if (section.type === 'TEXT_IMAGE' && sectionType === 'TEXT_IMAGE') {
                updatedSections[i] = { ...updatedSections[i], text };
            }
            // For other special types, update all of the same type
            else if ((section.type === 'TEXT_VIDEO' || section.type === 'TEXT_TRADE')
                && section.type === sectionType) {
                updatedSections[i] = { ...updatedSections[i], text };
            }
            // For TEXT_ONLY, only update the exact section
            else if (section.id === sectionToUpdateId) {
                updatedSections[i] = { ...updatedSections[i], text };
            }
        });

        setSections(updatedSections);
    };

    // Handle save
    const handleSave = async () => {
        if (!post.id) return;

        setIsLoading(true);
        setError(null);

        try {
            await dispatch(updatePostAsync({
                postId: post.id,
                sections
            })).unwrap();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update post');
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique sections for display in the UI, removing any duplicates
    const getUniqueEditableSections = () => {
        // Create a map to identify unique sections
        const uniqueSections: ThreadSection[] = [];
        const addedIds = new Set<string>();
        const addedTypes = new Set<string>();

        // Filter sections to keep only unique ones
        sections.forEach(section => {
            const sectionId = section.id || `temp-${Math.random()}`; // Ensure we have a string ID

            // For TEXT_IMAGE, only include the first one we encounter
            if (section.type === 'TEXT_IMAGE') {
                if (!addedTypes.has('TEXT_IMAGE')) {
                    uniqueSections.push(section);
                    addedIds.add(sectionId);
                    addedTypes.add('TEXT_IMAGE');
                }
            }
            // For other special types, only include one per type
            else if (section.type === 'TEXT_VIDEO' ||
                section.type === 'TEXT_TRADE' || section.type === 'NFT_LISTING' ||
                section.type === 'POLL') {
                if (!addedTypes.has(section.type)) {
                    uniqueSections.push(section);
                    addedIds.add(sectionId);
                    addedTypes.add(section.type);
                }
            }
            // For TEXT_ONLY, include all unique instances
            else if (!addedIds.has(sectionId)) {
                uniqueSections.push(section);
                addedIds.add(sectionId);
            }
        });

        return uniqueSections;
    };

    // Renders appropriate editor based on section type
    const renderSectionEditor = (section: ThreadSection, index: number) => {
        // Common text input for all sections that have text
        const renderTextEditor = () => (
            <TextInput
                value={section.text || ''}
                onChangeText={(text) => updateSectionText(index, text)}
                style={styles.textInput}
                placeholder="Edit text..."
                multiline
            />
        );

        switch (section.type) {
            case 'TEXT_ONLY':
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Text</Text>
                        {renderTextEditor()}
                    </View>
                );

            case 'TEXT_IMAGE':
                return (
                    <View style={styles.sectionContainer}>
                        {/* <Text style={styles.sectionTitle}>Text</Text> */}
                        {/* {renderTextEditor()} */}
                        {section.imageUrl && (
                            <View style={styles.imagePreviewContainer}>
                                <Image
                                    source={section.imageUrl}
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                />
                                <Text style={styles.helperText}>
                                    Image cannot be changed
                                </Text>
                            </View>
                        )}
                    </View>
                );

            case 'TEXT_VIDEO':
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Video Caption</Text>
                        {renderTextEditor()}
                        <Text style={styles.helperText}>
                            Video cannot be changed
                        </Text>
                    </View>
                );

            case 'TEXT_TRADE':
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Trade Caption</Text>
                        {renderTextEditor()}
                        <Text style={styles.helperText}>
                            Trade data cannot be changed
                        </Text>
                    </View>
                );

            case 'NFT_LISTING':
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>NFT Listing</Text>
                        <Text style={styles.helperText}>
                            NFT listing data cannot be edited
                        </Text>
                    </View>
                );

            case 'POLL':
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Poll</Text>
                        <Text style={styles.helperText}>
                            Poll data cannot be edited
                        </Text>
                    </View>
                );

            default:
                return (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Unknown Section</Text>
                        <Text style={styles.helperText}>
                            This section type cannot be edited
                        </Text>
                    </View>
                );
        }
    };

    // Get unique sections for the UI
    const uniqueSections = getUniqueEditableSections();

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Post</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView}>
                        {uniqueSections.map((section, index) => (
                            <View key={section.id || `section-${index}`}>
                                {renderSectionEditor(section, index)}
                            </View>
                        ))}

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
    scrollView: {
        padding: 16,
    },
    sectionContainer: {
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        minHeight: 80,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    imagePreviewContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    imagePreview: {
        width: 200,
        height: 120,
        borderRadius: 8,
    },
    helperText: {
        marginTop: 8,
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: '#1d9bf0',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
    saveButtonText: {
        color: 'white',
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
        textAlign: 'center',
    },
});

export default EditPostModal; 