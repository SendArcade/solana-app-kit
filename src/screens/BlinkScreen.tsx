import React from 'react';
import { View } from 'react-native';
import { BlinkExample } from '../components/BlinkRequestCard/BlinkRequestCard';



const BlinkScreen: React.FC = () => {
  const actionUrl = 'https://dial.to/donate'; // Replace with your actual Action URL

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <BlinkExample url={actionUrl} />
    </View>
  );
};

export default BlinkScreen; 