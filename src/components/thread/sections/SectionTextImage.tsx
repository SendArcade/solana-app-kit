// FILE: src/components/thread/sections/SectionTextImage.tsx
import React from 'react';
import {View, Text, Image, ImageSourcePropType} from 'react-native';

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
 * styling including rounded corners and proper aspect ratio.
 * 
 * Features:
 * - Text and image combination
 * - Optional text content
 * - Responsive image sizing
 * - Consistent styling
 * - Rounded corners for images
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
  return (
    <View>
      {!!text && (
        <Text style={{fontSize: 14, color: '#000', marginBottom: 4}}>
          {text}
        </Text>
      )}
      {imageUrl && (
        <Image
          source={imageUrl}
          style={{
            width: '70%',
            height: 120,
            borderRadius: 8,
            resizeMode: 'cover',
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}
