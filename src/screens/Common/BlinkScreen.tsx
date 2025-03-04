import React from 'react';
import { View } from 'react-native';
// import { BlinkExample } from '../../components/BlinkRequestCard/BlinkRequestCard';



const BlinkScreen: React.FC = () => {
  const actionUrl =
    'https://api.dial.to/v1/blink?apiUrl=https%3A%2F%2Ftensor.dial.to%2Fbuy-floor%2Fmadlads';

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* <BlinkExample url={actionUrl} /> */}
    </View>
  );
};

export default BlinkScreen; 