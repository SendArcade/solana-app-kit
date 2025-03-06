// FILE: src/components/thread/sections/SectionTextImage.tsx
import React from 'react';
import {View, Text, Image, ImageSourcePropType} from 'react-native';

interface SectionTextImageProps {
  text?: string;
  imageUrl?: ImageSourcePropType;
}

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
