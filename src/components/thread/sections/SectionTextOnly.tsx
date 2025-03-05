// FILE: src/components/thread/sections/SectionTextOnly.tsx
import React from 'react';
import {Text} from 'react-native';

interface SectionTextOnlyProps {
  text?: string;
}

export default function SectionTextOnly({text = ''}: SectionTextOnlyProps) {
  return (
    <Text style={{fontSize: 14, color: '#000', marginBottom: 6}}>{text}</Text>
  );
}
