// FILE: src/components/thread/sections/SectionTextImage.tsx
import React, { useState } from 'react';
import { View, Text, Image, ImageSourcePropType, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Dimensions } from 'react-native';

/**
 * Props for the SectionTextImage component
 * @interface SectionTextImageProps
 */
interface SectionTextImageProps {
  /** Optional text content to display above the image */
  text?: string;
  /** The image source to display */
  imageUrl?: ImageSourcePropType;
}

/**
 * A component that renders text content with an image in a post section
 * 
 * @component
 * @description
 * SectionTextImage displays a combination of text and image content in a post.
 * The text appears above the image, and the image is displayed with consistent
 * styling including rounded corners and proper aspect ratio. Users can tap on 
 * the image to view it in a full-screen modal.
 * 
 * Features:
 * - Text and image combination
 * - Optional text content
 * - Responsive image sizing
 * - Consistent styling
 * - Rounded corners for images
 * - Full-screen image view on tap
 * - Loading indicator while image loads
 * 
 * @example
 * ```tsx
 * <SectionTextImage
 *   text="Check out this amazing photo!"
 *   imageUrl={{ uri: 'https://example.com/image.jpg' }}
 * />
 * ```
 */
export default function SectionTextImage({
  text,
  imageUrl,
}: SectionTextImageProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const windowWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      {!!text && <Text style={styles.text}>{text}</Text>}
      {imageUrl && (
        <>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setFullScreenVisible(true)}
            style={styles.imageContainer}
          >
            <Image
              source={imageUrl}
              style={styles.image}
              onLoadStart={() => setIsImageLoading(true)}
              onLoadEnd={() => setIsImageLoading(false)}
              resizeMode="cover"
            />
            {isImageLoading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#1d9bf0" />
              </View>
            )}
          </TouchableOpacity>

          <Modal
            visible={fullScreenVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setFullScreenVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFullScreenVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Image
                source={imageUrl}
                style={{
                  width: windowWidth,
                  height: windowWidth,
                  resizeMode: 'contain'
                }}
              />
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  text: {
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
    lineHeight: 20,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.4)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
