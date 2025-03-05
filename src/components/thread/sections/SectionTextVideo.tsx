// FILE: src/components/thread/sections/SectionTextVideo.tsx
import React from 'react';
import {View, Text} from 'react-native';

interface SectionTextVideoProps {
  text?: string;
  videoUrl?: string;
}

export default function SectionTextVideo({
  text,
  videoUrl,
}: SectionTextVideoProps) {
  return (
    <View>
      {!!text && (
        <Text style={{fontSize: 14, color: '#000', marginBottom: 4}}>
          {text}
        </Text>
      )}
      {/* Placeholder for video player */}
      <View
        style={{
          padding: 10,
          backgroundColor: '#EEE',
          borderRadius: 8,
          marginTop: 4,
        }}>
        <Text style={{color: '#666', textAlign: 'center'}}>
          [Video Player Placeholder]
        </Text>
        {videoUrl ? (
          <Text style={{marginTop: 4, color: '#999'}}>URL: {videoUrl}</Text>
        ) : null}
      </View>
    </View>
  );
}
